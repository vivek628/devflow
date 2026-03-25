import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { loginSchema } from "@/lib/validations/auth";
import { loginUser } from "@/services/auth/login.service";

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

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        data: result.user,
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
