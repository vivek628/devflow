import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getDatabaseErrorDetails } from "@/lib/db/prisma-errors";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { forgotPasswordSchema, requestPasswordReset } from "@/modules/auth";

function getRequestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: Request) {
  try {
    const ip = getRequestIp(request);
    const body = await request.json();
    const validatedData = forgotPasswordSchema.parse(body);

    const requestLimit = enforceRateLimit({
      key: `forgot-password:ip:${ip}`,
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

    const emailLimit = enforceRateLimit({
      key: `forgot-password:email:${validatedData.email}`,
      limit: 3,
      windowMs: 2 * 60 * 1000,
    });

    if (!emailLimit.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many reset requests. Try again after 2 minutes.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(emailLimit.retryAfterSeconds),
          },
        },
      );
    }

    const result = await requestPasswordReset(validatedData);

    return NextResponse.json(
      {
        success: true,
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

    console.error("Forgot password error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to process the reset request right now",
      },
      { status: 500 },
    );
  }
}
