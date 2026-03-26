import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
} from "@prisma/client/runtime/library";

type DatabaseErrorDetails = {
  status: number;
  message: string;
};

function isConnectivityMessage(message: string) {
  return [
    "server selection timeout",
    "no available servers",
    "replicasetnoprimary",
    "i/o error",
    "can't reach database server",
    "can't connect to server",
  ].some((fragment) => message.includes(fragment));
}

export function getDatabaseErrorDetails(
  error: unknown,
): DatabaseErrorDetails | null {
  if (error instanceof PrismaClientInitializationError) {
    return {
      status: 503,
      message: "Database connection is temporarily unavailable. Please try again.",
    };
  }

  if (error instanceof PrismaClientKnownRequestError) {
    const prismaMessage = String(error.meta?.message ?? "").toLowerCase();

    if (error.code === "P2010" && isConnectivityMessage(prismaMessage)) {
      return {
        status: 503,
        message: "Database connection is temporarily unavailable. Please try again.",
      };
    }
  }

  if (error instanceof Error && isConnectivityMessage(error.message.toLowerCase())) {
    return {
      status: 503,
      message: "Database connection is temporarily unavailable. Please try again.",
    };
  }

  return null;
}
