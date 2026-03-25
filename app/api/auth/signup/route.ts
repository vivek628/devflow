import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { signupUser } from "@/services/auth/signup.service";
import { signupSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = signupSchema.parse(body);

    const result = await signupUser(validatedData);

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

    console.error("Signup error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while creating the account",
      },
      { status: 500 },
    );
  }
}
