import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getSessionUser } from "@/lib/auth/get-session-user";
import { getDatabaseErrorDetails } from "@/lib/db/prisma-errors";
import {
  createProject,
  createProjectSchema,
  listProjectsForOwner,
} from "@/modules/projects";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const projects = await listProjectsForOwner(sessionUser.userId);

    return NextResponse.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    const databaseError = getDatabaseErrorDetails(error);

    if (databaseError) {
      return NextResponse.json(
        { success: false, message: databaseError.message },
        { status: databaseError.status },
      );
    }

    console.error("Projects fetch error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load projects" },
      { status: 500 },
    );
  }
}

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
    const validatedData = createProjectSchema.parse(body);
    const project = await createProject(sessionUser.userId, validatedData);

    return NextResponse.json(
      {
        success: true,
        data: project,
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

    console.error("Project create error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to create project" },
      { status: 500 },
    );
  }
}
