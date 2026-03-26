import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getSessionUser } from "@/lib/auth/get-session-user";
import {
  generateProjectSubtasks,
  generateProjectSubtasksSchema,
} from "@/modules/ai";

export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validatedData = generateProjectSubtasksSchema.parse(body);
    const subtasks = await generateProjectSubtasks(validatedData);

    return NextResponse.json({
      success: true,
      data: {
        subtasks,
      },
    });
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

    console.error("AI subtask generation error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error &&
          error.message === "GEMINI_API_KEY is not configured"
            ? error.message
            : "Unable to generate AI subtasks",
      },
      { status: 500 },
    );
  }
}
