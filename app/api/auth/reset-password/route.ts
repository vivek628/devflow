import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getDatabaseErrorDetails } from "@/lib/db/prisma-errors";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { confirmPasswordReset, resetPasswordSchema } from "@/modules/auth";

function getRequestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: Request) {
  try {
    const ip = getRequestIp(request);
    const requestLimit = enforceRateLimit({
      key: `reset-password:ip:${ip}`,
      limit: 100,
      windowMs: 60 * 1000,
    });

    if (!requestLimit.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many requests. Try again in a minute.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(requestLimit.retryAfterSeconds),
          },
        },
      );
    }

    const body = await request.json();
    const validatedData = resetPasswordSchema.parse(body);
    const result = await confirmPasswordReset(validatedData);

    return NextResponse.json(
      {
        success: result.success,
        code: "code" in result ? result.code : null,
        message: result.message,
      },
      { status: result.status },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const databaseError = getDatabaseErrorDetails(error);

    if (databaseError) {
      return NextResponse.json(
        {
          success: false,
          message: databaseError.message,
        },
        { status: databaseError.status },
      );
    }

    console.error("Reset password error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to reset the password right now",
      },
      { status: 500 },
    );
  }
}
