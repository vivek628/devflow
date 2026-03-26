import {
  createProjectForOwner,
  createSubtaskForProject,
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
  UpdateProjectInput,
  UpdateSubtaskInput,
} from "@/modules/projects/projects.schemas";

export function mapSubtask(subtask: {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: Date | null;
}) {
  return {
    id: subtask.id,
    title: subtask.title,
    description: subtask.description,
    status: subtask.status,
    priority: subtask.priority,
    dueDate: subtask.dueDate?.toISOString() ?? null,
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
  }>;
}) {
  return {
    id: project.id,
    name: project.title,
    description: project.description,
    status: project.status,
    techStack: project.techStack,
    repoUrl: project.repoUrl ?? "",
    subtasks: project.subtasks.map(mapSubtask),
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
