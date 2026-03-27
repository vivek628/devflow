import { describe, expect, it } from "vitest";

import {
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyResetCodeSchema,
} from "@/modules/auth/password-reset/password-reset.schemas";

describe("password reset schemas", () => {
  it("normalizes forgot-password email input", () => {
    const result = forgotPasswordSchema.parse({
      email: "  TEST@Example.COM  ",
    });

    expect(result.email).toBe("test@example.com");
  });

  it("rejects a reset payload when passwords do not match", () => {
    const result = resetPasswordSchema.safeParse({
      email: "user@example.com",
      code: "123456",
      password: "password123",
      confirmPassword: "different123",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword).toContain(
        "Passwords do not match",
      );
    }
  });

  it("requires a 6-digit numeric verification code", () => {
    const result = verifyResetCodeSchema.safeParse({
      email: "user@example.com",
      code: "12ab",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.code).toContain(
        "Enter the 6-digit reset code",
      );
    }
  });
});
