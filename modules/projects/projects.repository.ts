import { prisma } from "@/lib/db/prisma";
import {
  CreateProjectInput,
  CreateSubtaskInput,
  CreateSubtaskUpdateInput,
  UpdateProjectInput,
  UpdateSubtaskInput,
} from "@/modules/projects/projects.schemas";

function mapDueDate(value?: string) {
  return value ? new Date(value) : null;
}

export async function findProjectsByOwnerId(ownerId: string) {
  return prisma.project.findMany({
    where: { ownerId },
    include: {
      subtasks: {
        include: {
          updates: {
            orderBy: [{ loggedAt: "desc" }, { createdAt: "desc" }],
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function findProjectByIdForOwner(projectId: string, ownerId: string) {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId,
    },
    include: {
      subtasks: {
        include: {
          updates: {
            orderBy: [{ loggedAt: "desc" }, { createdAt: "desc" }],
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function createProjectForOwner(
  ownerId: string,
  input: CreateProjectInput,
) {
  return prisma.project.create({
    data: {
      title: input.title,
      description: input.description,
      status: input.status,
      techStack: input.techStack,
      repoUrl: input.repoUrl,
      ownerId,
    },
    include: {
      subtasks: {
        include: {
          updates: {
            orderBy: [{ loggedAt: "desc" }, { createdAt: "desc" }],
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function updateProjectById(
  projectId: string,
  input: UpdateProjectInput,
) {
  return prisma.project.update({
    where: { id: projectId },
    data: {
      title: input.title,
      description: input.description,
      status: input.status,
      techStack: input.techStack,
      repoUrl: input.repoUrl,
    },
    include: {
      subtasks: {
        include: {
          updates: {
            orderBy: [{ loggedAt: "desc" }, { createdAt: "desc" }],
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function deleteProjectById(projectId: string) {
  return prisma.project.delete({
    where: { id: projectId },
  });
}

export async function createSubtaskForProject(
  projectId: string,
  input: CreateSubtaskInput,
) {
  return prisma.subtask.create({
    data: {
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      dueDate: mapDueDate(input.dueDate),
      projectId,
    },
  });
}

export async function findSubtaskByIdForOwner(
  projectId: string,
  subtaskId: string,
  ownerId: string,
) {
  return prisma.subtask.findFirst({
    where: {
      id: subtaskId,
      projectId,
      project: {
        ownerId,
      },
    },
  });
}

export async function updateSubtaskById(
  subtaskId: string,
  input: UpdateSubtaskInput,
) {
  return prisma.subtask.update({
    where: { id: subtaskId },
    data: {
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      dueDate: mapDueDate(input.dueDate),
    },
  });
}

function mapLoggedAt(value?: string) {
  return value ? new Date(value) : undefined;
}

export async function createUpdateForSubtask(
  subtaskId: string,
  input: CreateSubtaskUpdateInput,
) {
  return prisma.subtaskUpdate.create({
    data: {
      summary: input.summary,
      timeLogMinutes: input.timeLogMinutes,
      loggedAt: mapLoggedAt(input.loggedAt) ?? new Date(),
      subtaskId,
    },
  });
}

export async function deleteSubtaskById(subtaskId: string) {
  return prisma.subtask.delete({
    where: { id: subtaskId },
  });
}
