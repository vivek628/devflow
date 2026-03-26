import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { authCookie, createSessionToken } from "@/lib/auth/session";
import { getDatabaseErrorDetails } from "@/lib/db/prisma-errors";
import { loginSchema, loginUser } from "@/modules/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    const result = await loginUser(validatedData);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
        },
        { status: result.status },
      );
    }

    const token = await createSessionToken({
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: result.message,
        data: result.user,
      },
      { status: result.status },
    );

    response.cookies.set({
      name: authCookie.name,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: authCookie.maxAge,
    });

    return response;
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
      console.error("Login database error:", error);

      return NextResponse.json(
        {
          success: false,
          message: databaseError.message,
        },
        { status: databaseError.status },
      );
    }

    console.error("Login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while signing in",
      },
      { status: 500 },
    );
  }
}
