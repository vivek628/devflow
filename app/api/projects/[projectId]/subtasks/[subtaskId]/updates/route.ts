import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getSessionUser } from "@/lib/auth/get-session-user";
import { getDatabaseErrorDetails } from "@/lib/db/prisma-errors";
import {
  createSubtaskUpdate,
  createSubtaskUpdateSchema,
} from "@/modules/projects";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string; subtaskId: string }> },
) {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { projectId, subtaskId } = await params;
    const update = await createSubtaskUpdate(
      projectId,
      subtaskId,
      sessionUser.userId,
      createSubtaskUpdateSchema.parse(await request.json()),
    );

    if (!update) {
      return NextResponse.json(
        { success: false, message: "Subtask not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: update,
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

    console.error("Subtask update log create error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to create subtask update" },
      { status: 500 },
    );
  }
}
