import {
  createProjectForOwner,
  createSubtaskForProject,
  createUpdateForSubtask,
  deleteProjectById,
  deleteSubtaskById,
  findProjectByIdForOwner,
  findProjectsByOwnerId,
  findSubtaskByIdForOwner,
  updateProjectById,
  updateSubtaskById,
} from "@/modules/projects/projects.repository";
import {
  CreateProjectInput,
  CreateSubtaskInput,
  CreateSubtaskUpdateInput,
  UpdateProjectInput,
  UpdateSubtaskInput,
} from "@/modules/projects/projects.schemas";

export function mapSubtaskUpdate(update: {
  id: string;
  summary: string;
  timeLogMinutes: number;
  loggedAt: Date;
}) {
  return {
    id: update.id,
    summary: update.summary,
    timeLogMinutes: update.timeLogMinutes,
    loggedAt: update.loggedAt.toISOString(),
  };
}

function getTotalLoggedMinutes(
  updates?: Array<{
    timeLogMinutes: number;
  }>,
) {
  return (updates ?? []).reduce(
    (total, update) => total + update.timeLogMinutes,
    0,
  );
}

export function mapSubtask(subtask: {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  updates?: Array<{
    id: string;
    summary: string;
    timeLogMinutes: number;
    loggedAt: Date;
  }>;
}) {
  return {
    id: subtask.id,
    title: subtask.title,
    description: subtask.description,
    status: subtask.status,
    priority: subtask.priority,
    dueDate: subtask.dueDate?.toISOString() ?? null,
    totalTimeLogMinutes: getTotalLoggedMinutes(subtask.updates),
    updates: (subtask.updates ?? []).map(mapSubtaskUpdate),
  };
}

export function mapProject(project: {
  id: string;
  title: string;
  description: string;
  status: string;
  techStack: string[];
  repoUrl: string | null;
  subtasks: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    dueDate: Date | null;
    updates?: Array<{
      id: string;
      summary: string;
      timeLogMinutes: number;
      loggedAt: Date;
    }>;
  }>;
}) {
  const mappedSubtasks = project.subtasks.map(mapSubtask);

  return {
    id: project.id,
    name: project.title,
    description: project.description,
    status: project.status,
    techStack: project.techStack,
    repoUrl: project.repoUrl ?? "",
    totalTimeLogMinutes: mappedSubtasks.reduce(
      (total, subtask) => total + subtask.totalTimeLogMinutes,
      0,
    ),
    subtasks: mappedSubtasks,
  };
}

export async function listProjectsForOwner(ownerId: string) {
  const projects = await findProjectsByOwnerId(ownerId);
  return projects.map(mapProject);
}

export async function getProjectForOwner(projectId: string, ownerId: string) {
  const project = await findProjectByIdForOwner(projectId, ownerId);
  return project ? mapProject(project) : null;
}

export async function createProject(ownerId: string, input: CreateProjectInput) {
  const project = await createProjectForOwner(ownerId, input);
  return mapProject(project);
}

export async function updateProject(
  projectId: string,
  ownerId: string,
  input: UpdateProjectInput,
) {
  const project = await findProjectByIdForOwner(projectId, ownerId);

  if (!project) {
    return null;
  }

  const updatedProject = await updateProjectById(project.id, input);
  return mapProject(updatedProject);
}

export async function removeProject(projectId: string, ownerId: string) {
  const project = await findProjectByIdForOwner(projectId, ownerId);

  if (!project) {
    return false;
  }

  await deleteProjectById(project.id);
  return true;
}

export async function createSubtask(
  projectId: string,
  ownerId: string,
  input: CreateSubtaskInput,
) {
  const project = await findProjectByIdForOwner(projectId, ownerId);

  if (!project) {
    return null;
  }

  const subtask = await createSubtaskForProject(project.id, input);
  return mapSubtask(subtask);
}

export async function updateSubtask(
  projectId: string,
  subtaskId: string,
  ownerId: string,
  input: UpdateSubtaskInput,
) {
  const subtask = await findSubtaskByIdForOwner(projectId, subtaskId, ownerId);

  if (!subtask) {
    return null;
  }

  const updatedSubtask = await updateSubtaskById(subtask.id, input);
  return mapSubtask(updatedSubtask);
}

export async function removeSubtask(
  projectId: string,
  subtaskId: string,
  ownerId: string,
) {
  const subtask = await findSubtaskByIdForOwner(projectId, subtaskId, ownerId);

  if (!subtask) {
    return false;
  }

  await deleteSubtaskById(subtask.id);
  return true;
}

export async function createSubtaskUpdate(
  projectId: string,
  subtaskId: string,
  ownerId: string,
  input: CreateSubtaskUpdateInput,
) {
  const subtask = await findSubtaskByIdForOwner(projectId, subtaskId, ownerId);

  if (!subtask) {
    return null;
  }

  const update = await createUpdateForSubtask(subtask.id, input);
  return mapSubtaskUpdate(update);
}
