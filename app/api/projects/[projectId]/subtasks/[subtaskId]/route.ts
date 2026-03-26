import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getSessionUser } from "@/lib/auth/get-session-user";
import { getDatabaseErrorDetails } from "@/lib/db/prisma-errors";
import {
  removeSubtask,
  updateSubtask,
  updateSubtaskSchema,
} from "@/modules/projects";

export async function PATCH(
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
    const updatedSubtask = await updateSubtask(
      projectId,
      subtaskId,
      sessionUser.userId,
      updateSubtaskSchema.parse(await request.json()),
    );

    if (!updatedSubtask) {
      return NextResponse.json(
        { success: false, message: "Subtask not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedSubtask,
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

    const databaseError = getDatabaseErrorDetails(error);

    if (databaseError) {
      return NextResponse.json(
        { success: false, message: databaseError.message },
        { status: databaseError.status },
      );
    }

    console.error("Subtask update error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update subtask" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
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
    const subtaskRemoved = await removeSubtask(
      projectId,
      subtaskId,
      sessionUser.userId,
    );

    if (!subtaskRemoved) {
      return NextResponse.json(
        { success: false, message: "Subtask not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    const databaseError = getDatabaseErrorDetails(error);

    if (databaseError) {
      return NextResponse.json(
        { success: false, message: databaseError.message },
        { status: databaseError.status },
      );
    }

    console.error("Subtask delete error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to delete subtask" },
      { status: 500 },
    );
  }
}
