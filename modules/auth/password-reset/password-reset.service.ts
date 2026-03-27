import bcrypt from "bcryptjs";
import crypto from "crypto";

import {
  ForgotPasswordInput,
  ResetPasswordInput,
  VerifyResetCodeInput,
} from "@/modules/auth/password-reset/password-reset.schemas";
import {
  clearPasswordResetTokensForUserAndEmail,
  consumePasswordResetToken,
  createPasswordResetToken,
  deleteStalePasswordResetTokens,
  findLatestPasswordResetTokenForUserOrEmail,
  findPasswordResetUserByEmail,
  incrementPasswordResetTokenFailedTries,
  markPasswordResetTokenVerified,
  updateUserPassword,
} from "@/modules/auth/password-reset/password-reset.repository";
import { sendPasswordResetEmail } from "@/modules/auth/password-reset/password-reset.email";

const PASSWORD_RESET_EXPIRY_MS = 2 * 60 * 1000;
const PASSWORD_RESET_MAX_FAILED_TRIES = 3;

export const passwordResetErrorCodes = {
  EXPIRED_CODE: "EXPIRED_CODE",
  INVALID_CODE: "INVALID_CODE",
  TOO_MANY_ATTEMPTS: "TOO_MANY_ATTEMPTS",
  VERIFY_FIRST: "VERIFY_FIRST",
} as const;

function hashResetCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function generateResetCode() {
  return crypto.randomInt(100000, 1_000_000).toString();
}

export async function requestPasswordReset(input: ForgotPasswordInput) {
  await deleteStalePasswordResetTokens();

  const user = await findPasswordResetUserByEmail(input.email);

  if (!user) {
    return {
      success: true as const,
      status: 200,
      message:
        "If an account exists for this email, a reset code has been sent.",
    };
  }

  const code = generateResetCode();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);

  await clearPasswordResetTokensForUserAndEmail({
    userId: user.id,
    email: user.email,
  });
  await createPasswordResetToken({
    email: user.email,
    userId: user.id,
    codeHash: hashResetCode(code),
    expiresAt,
  });

  await sendPasswordResetEmail({
    name: user.name,
    email: user.email,
    code,
  });

  return {
    success: true as const,
    status: 200,
    message:
      "If an account exists for this email, a reset code has been sent.",
  };
}

async function validateResetCode(input: VerifyResetCodeInput) {
  await deleteStalePasswordResetTokens();

  const user = await findPasswordResetUserByEmail(input.email);

  if (!user) {
    return {
      success: false as const,
      status: 400,
      code: passwordResetErrorCodes.EXPIRED_CODE,
      message: "Reset code expired. Request a new one.",
    };
  }

  const token = await findLatestPasswordResetTokenForUserOrEmail({
    userId: user.id,
    email: input.email,
  });

  if (!token) {
    return {
      success: false as const,
      status: 400,
      code: passwordResetErrorCodes.EXPIRED_CODE,
      message: "Reset code expired. Request a new one.",
    };
  }

  if (token.expiresAt.getTime() < Date.now()) {
    await clearPasswordResetTokensForUserAndEmail({
      userId: user.id,
      email: input.email,
    });

    return {
      success: false as const,
      status: 400,
      code: passwordResetErrorCodes.EXPIRED_CODE,
      message: "Reset code expired. Request a new one.",
    };
  }

  if (token.failedTries >= PASSWORD_RESET_MAX_FAILED_TRIES) {
    await clearPasswordResetTokensForUserAndEmail({
      userId: user.id,
      email: input.email,
    });

    return {
      success: false as const,
      status: 429,
      code: passwordResetErrorCodes.TOO_MANY_ATTEMPTS,
      message: "Too many wrong attempts. Request a new reset code.",
    };
  }

  const codeMatches = token.codeHash === hashResetCode(input.code);

  if (!codeMatches) {
    const updatedToken = await incrementPasswordResetTokenFailedTries(token.id);
    const remainingTries =
      PASSWORD_RESET_MAX_FAILED_TRIES - updatedToken.failedTries;

    if (remainingTries <= 0) {
      await clearPasswordResetTokensForUserAndEmail({
        userId: user.id,
        email: input.email,
      });

      return {
        success: false as const,
        status: 429,
        code: passwordResetErrorCodes.TOO_MANY_ATTEMPTS,
        message: "Too many wrong attempts. Request a new reset code.",
      };
    }

    return {
      success: false as const,
      status: 400,
      code: passwordResetErrorCodes.INVALID_CODE,
      message: `Invalid reset code. ${remainingTries} attempt${remainingTries === 1 ? "" : "s"} remaining.`,
    };
  }

  return {
    success: true as const,
    user,
    token,
  };
}

export async function verifyPasswordResetCode(input: VerifyResetCodeInput) {
  const result = await validateResetCode(input);

  if (!result.success) {
    return result;
  }

  await markPasswordResetTokenVerified(result.token.id);

  return {
    success: true as const,
    status: 200,
    message: "Reset code verified. You can now set a new password.",
  };
}

export async function confirmPasswordReset(input: ResetPasswordInput) {
  const result = await validateResetCode({
    email: input.email,
    code: input.code,
  });

  if (!result.success) {
    return result;
  }

  if (!result.token.verifiedAt) {
    return {
      success: false as const,
      status: 400,
      code: passwordResetErrorCodes.VERIFY_FIRST,
      message: "Verify the reset code first before updating the password.",
    };
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);
  await updateUserPassword(result.user.id, hashedPassword);
  await consumePasswordResetToken(result.token.id);
  await clearPasswordResetTokensForUserAndEmail({
    userId: result.user.id,
    email: result.user.email,
  });

  return {
    success: true as const,
    status: 200,
    message: "Password reset successful. You can now log in.",
  };
}

export const passwordResetConfig = {
  expiryMs: PASSWORD_RESET_EXPIRY_MS,
  maxFailedTries: PASSWORD_RESET_MAX_FAILED_TRIES,
} as const;
