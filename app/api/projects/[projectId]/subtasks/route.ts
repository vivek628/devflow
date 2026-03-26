import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getSessionUser } from "@/lib/auth/get-session-user";
import { getDatabaseErrorDetails } from "@/lib/db/prisma-errors";
import { createSubtask, createSubtaskSchema } from "@/modules/projects";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { projectId } = await params;
    const body = await request.json();
    const validatedData = createSubtaskSchema.parse(body);
    const subtask = await createSubtask(
      projectId,
      sessionUser.userId,
      validatedData,
    );

    if (!subtask) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: subtask,
      },
      { status: 201 },
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
        { success: false, message: databaseError.message },
        { status: databaseError.status },
      );
    }

    console.error("Subtask create error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to create subtask" },
      { status: 500 },
    );
  }
}
