import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

export async function findPasswordResetUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
}

export async function clearPasswordResetTokensForUserAndEmail(input: {
  userId: string;
  email: string;
}) {
  return prisma.passwordResetToken.deleteMany({
    where: {
      OR: [{ userId: input.userId }, { email: input.email }],
    },
  });
}

function formatIstDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })
    .format(value)
    .replace(",", "")
    .concat(" IST");
}

function activePasswordResetTokenWhere(input: { userId: string; email: string }) {
  return {
    AND: [
      {
        OR: [{ email: input.email }, { userId: input.userId }],
      },
      {
        OR: [{ consumedAt: null }, { consumedAt: { isSet: false } }],
      },
    ],
  } satisfies Prisma.PasswordResetTokenWhereInput;
}

export async function deleteStalePasswordResetTokens() {
  return prisma.passwordResetToken.deleteMany({
    where: {
      OR: [
        {
          createdAt: {
            lt: new Date(Date.now() - 3 * 60 * 1000),
          },
        },
        {
          consumedAt: {
            not: null,
          },
        },
      ],
    },
  });
}

export async function createPasswordResetToken(data: {
  email: string;
  userId: string;
  codeHash: string;
  expiresAt: Date;
}) {
  const createdAt = new Date();
  const createdAtIst = formatIstDate(createdAt);

  return prisma.passwordResetToken.create({
    data: {
      ...data,
      createdAt,
      createdAtIst,
      expiresAtIst: formatIstDate(data.expiresAt),
      updatedAtIst: createdAtIst,
    },
  });
}

export async function findLatestPasswordResetTokenForUserOrEmail(input: {
  userId: string;
  email: string;
}) {
  return prisma.passwordResetToken.findFirst({
    where: activePasswordResetTokenWhere(input),
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function incrementPasswordResetTokenFailedTries(tokenId: string) {
  return prisma.passwordResetToken.update({
    where: { id: tokenId },
    data: {
      failedTries: {
        increment: 1,
      },
      updatedAtIst: formatIstDate(new Date()),
    },
  });
}

export async function markPasswordResetTokenVerified(tokenId: string) {
  return prisma.passwordResetToken.update({
    where: { id: tokenId },
    data: {
      verifiedAt: new Date(),
      updatedAtIst: formatIstDate(new Date()),
    },
  });
}

export async function consumePasswordResetToken(tokenId: string) {
  return prisma.passwordResetToken.update({
    where: { id: tokenId },
    data: {
      consumedAt: new Date(),
      updatedAtIst: formatIstDate(new Date()),
    },
  });
}

export async function updateUserPassword(userId: string, password: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { password },
  });
}
