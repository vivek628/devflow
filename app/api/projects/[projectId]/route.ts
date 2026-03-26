import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getSessionUser } from "@/lib/auth/get-session-user";
import { getDatabaseErrorDetails } from "@/lib/db/prisma-errors";
import {
  getProjectForOwner,
  removeProject,
  updateProject,
  updateProjectSchema,
} from "@/modules/projects";

export async function GET(
  _request: Request,
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
    const project = await getProjectForOwner(projectId, sessionUser.userId);

    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error) {
    const databaseError = getDatabaseErrorDetails(error);

    if (databaseError) {
      return NextResponse.json(
        { success: false, message: databaseError.message },
        { status: databaseError.status },
      );
    }

    console.error("Project fetch error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load project" },
      { status: 500 },
    );
  }
}

export async function PATCH(
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
    const validatedData = updateProjectSchema.parse(body);
    const updatedProject = await updateProject(
      projectId,
      sessionUser.userId,
      validatedData,
    );

    if (!updatedProject) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedProject,
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

    console.error("Project update error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update project" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
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
    const projectRemoved = await removeProject(projectId, sessionUser.userId);

    if (!projectRemoved) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
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

    console.error("Project delete error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to delete project" },
      { status: 500 },
    );
  }
}
