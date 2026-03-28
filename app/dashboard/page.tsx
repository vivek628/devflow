"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ProfileMenu } from "@/components/layout/profile-menu";
import { badgeTone } from "@/lib/projects/project-store";
import { getUserFacingErrorMessage } from "@/lib/utils/client-errors";

type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
  techStack: string[];
  repoUrl: string;
  totalTimeLogMinutes: number;
  subtasks: {
    id: string;
    status: string;
    dueDate?: string | null;
  }[];
};

type ProjectFormState = {
  title: string;
  description: string;
  status: string;
  techStack: string;
  repoUrl: string;
};

type GeneratedSubtask = {
  title: string;
  description: string;
  status: "BACKLOG";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  dueDate: string;
};

const emptyProjectForm: ProjectFormState = {
  title: "",
  description: "",
  status: "PLANNING",
  techStack: "",
  repoUrl: "",
};

async function readApiResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  const rawBody = await response.text();

  if (contentType.includes("application/json")) {
    return JSON.parse(rawBody) as T;
  }

  const compactBody = rawBody.replace(/\s+/g, " ").trim();
  throw new Error(
    compactBody
      ? `Server returned a non-JSON response: ${compactBody.slice(0, 180)}`
      : "Server returned a non-JSON response",
  );
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatTimeLog(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours && remainingMinutes) {
    return `${hours}h ${remainingMinutes}m`;
  }

  if (hours) {
    return `${hours}h`;
  }

  return `${remainingMinutes}m`;
}

function formatCountLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function buildAnalytics(projects: Project[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let totalTasks = 0;
  let openTasks = 0;
  let closedTasks = 0;
  let overdueTasks = 0;

  for (const project of projects) {
    totalTasks += project.subtasks.length;

    for (const subtask of project.subtasks) {
      const isClosed = subtask.status === "DONE";

      if (isClosed) {
        closedTasks += 1;
      } else {
        openTasks += 1;
      }

      if (!isClosed && subtask.dueDate) {
        const dueDate = new Date(subtask.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        if (dueDate < today) {
          overdueTasks += 1;
        }
      }
    }
  }

  return [
    {
      label: "Total Projects",
      value: projects.length,
      tone: "border-sky-400/20 bg-sky-400/10 text-sky-200",
    },
    {
      label: "Total Tasks",
      value: totalTasks,
      tone: "border-white/10 bg-white/5 text-slate-200",
    },
    {
      label: "Open Tasks",
      value: openTasks,
      tone: "border-amber-400/20 bg-amber-400/10 text-amber-200",
    },
    {
      label: "Closed Tasks",
      value: closedTasks,
      tone: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    },
    {
      label: "Overdue Tasks",
      value: overdueTasks,
      tone: "border-rose-400/20 bg-rose-400/10 text-rose-200",
    },
  ];
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectPendingDelete, setProjectPendingDelete] = useState<Project | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);
  const [generatedSubtasks, setGeneratedSubtasks] = useState<GeneratedSubtask[]>([]);
  const [areGeneratedSubtasksConfirmed, setAreGeneratedSubtasksConfirmed] =
    useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const analytics = buildAnalytics(projects);

  async function refreshProjects(showLoader = false) {
    if (showLoader) {
      setIsLoading(true);
    }

    const response = await fetch("/api/projects", {
      credentials: "include",
    });
    const result = await readApiResponse<{
      success: boolean;
      message?: string;
      data?: Project[];
    }>(response);

    if (!response.ok) {
      throw new Error(result.message || "Unable to load projects");
    }

    setProjects(result.data ?? []);
  }

  useEffect(() => {
    let isMounted = true;

    async function fetchProjects() {
      try {
        setErrorMessage("");
        await refreshProjects(true);
      } catch (error) {
        if (isMounted) {
          setErrorMessage(getUserFacingErrorMessage(error, "Unable to load projects"));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void fetchProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  function updateProjectForm(field: keyof typeof emptyProjectForm, value: string) {
    setProjectForm((current) => ({ ...current, [field]: value }));
  }

  function openCreateProjectModal() {
    setEditingProjectId(null);
    setProjectForm(emptyProjectForm);
    setGeneratedSubtasks([]);
    setAreGeneratedSubtasksConfirmed(false);
    setIsProjectModalOpen(true);
  }

  function openEditProjectModal(project: Project) {
    setEditingProjectId(project.id);
    setProjectForm({
      title: project.name,
      description: project.description,
      status: project.status,
      techStack: project.techStack.join(", "),
      repoUrl: project.repoUrl,
    });
    setGeneratedSubtasks([]);
    setAreGeneratedSubtasksConfirmed(false);
    setIsProjectModalOpen(true);
  }

  function updateGeneratedSubtask(
    index: number,
    field: keyof GeneratedSubtask,
    value: string,
  ) {
    setGeneratedSubtasks((current) =>
      current.map((subtask, currentIndex) =>
        currentIndex === index ? { ...subtask, [field]: value } : subtask,
      ),
    );
    setAreGeneratedSubtasksConfirmed(false);
  }

  function removeGeneratedSubtask(index: number) {
    setGeneratedSubtasks((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
    setAreGeneratedSubtasksConfirmed(false);
  }

  function addGeneratedSubtask() {
    setGeneratedSubtasks((current) => [
      ...current,
      {
        title: "",
        description: "",
        status: "BACKLOG",
        priority: "MEDIUM",
        dueDate: "",
      },
    ]);
    setAreGeneratedSubtasksConfirmed(false);
  }

  async function handleGenerateSubtasks() {
    setIsGeneratingSubtasks(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/ai/project-subtasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: projectForm.title,
          description: projectForm.description,
          techStack: projectForm.techStack
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });

      const result = await readApiResponse<{
        success: boolean;
        message?: string;
        data?: {
          subtasks: GeneratedSubtask[];
        };
      }>(response);

      if (!response.ok || !result.data) {
        throw new Error(result.message || "Unable to generate AI subtasks");
      }

      setGeneratedSubtasks(result.data.subtasks);
      setAreGeneratedSubtasksConfirmed(false);
    } catch (error) {
      setErrorMessage(
        getUserFacingErrorMessage(error, "Unable to generate AI subtasks"),
      );
    } finally {
      setIsGeneratingSubtasks(false);
    }
  }

  async function handleSaveProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (
      !editingProjectId &&
      generatedSubtasks.length > 0 &&
      !areGeneratedSubtasksConfirmed
    ) {
      setErrorMessage(
        "Confirm the AI subtasks before saving, or remove them if you do not want to include them.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        editingProjectId ? `/api/projects/${editingProjectId}` : "/api/projects",
        {
          method: editingProjectId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            title: projectForm.title,
            description: projectForm.description,
            status: projectForm.status,
            techStack: projectForm.techStack
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            repoUrl: projectForm.repoUrl.trim() || undefined,
          }),
        },
      );

      const result = await readApiResponse<{
        success: boolean;
        message?: string;
        data?: Project;
      }>(response);

      if (!response.ok || !result.data) {
        throw new Error(
          result.message ||
            (editingProjectId ? "Unable to update project" : "Unable to create project"),
        );
      }

      const projectId = result.data.id;

      if (
        !editingProjectId &&
        areGeneratedSubtasksConfirmed &&
        generatedSubtasks.length > 0
      ) {
        const subtaskResponses = await Promise.all(
          generatedSubtasks
            .filter(
              (subtask) =>
                subtask.title.trim().length > 0 &&
                subtask.description.trim().length > 0,
            )
            .map((subtask) =>
              fetch(`/api/projects/${projectId}/subtasks`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(subtask),
              }),
            ),
        );

        const failedSubtaskResponse = subtaskResponses.find(
          (subtaskResponse) => !subtaskResponse.ok,
        );

        if (failedSubtaskResponse) {
          const failedResult = await readApiResponse<{ message?: string }>(
            failedSubtaskResponse,
          );
          throw new Error(
            failedResult.message || "Project was created, but AI subtasks could not be saved",
          );
        }
      }

      await refreshProjects();
      setProjectForm(emptyProjectForm);
      setEditingProjectId(null);
      setGeneratedSubtasks([]);
      setAreGeneratedSubtasksConfirmed(false);
      setIsProjectModalOpen(false);
    } catch (error) {
      setErrorMessage(
        getUserFacingErrorMessage(
          error,
          editingProjectId ? "Unable to update project" : "Unable to create project",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteProject(projectId: string) {
    setErrorMessage("");

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const result = await readApiResponse<{
        success: boolean;
        message?: string;
      }>(response);

      if (!response.ok) {
        throw new Error(result.message || "Unable to delete project");
      }

      await refreshProjects();
    } catch (error) {
      setErrorMessage(getUserFacingErrorMessage(error, "Unable to delete project"));
    }
  }

  function confirmDeleteProject(project: Project) {
    setProjectPendingDelete(project);
  }

  return (
    <main className="scrollbar-hidden w-full overflow-x-hidden min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-screen-2xl space-y-6">
        <section className="relative z-20 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <div className="absolute right-4 top-4 sm:right-8 sm:top-8">
            <ProfileMenu />
          </div>

          <div className="pr-20 sm:pr-48 lg:pr-56">
            <div>
              <p className="inline-flex rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-300">
                DevFlow Dashboard
              </p>
              <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Create a project, then open it to manage subtasks.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                {projects.length === 0
                  ? "Create your first project to organize your work, manage tasks step by step, and use AI to generate subtasks from your project description."
                  : "Open a project to track progress, manage subtasks, log work updates, and keep your development workflow organized in one place."}
              </p>
            </div>
          </div>

          {errorMessage ? (
            <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openCreateProjectModal}
              className="rounded-2xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
            >
              Create Project
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-400">Analytics</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                Project and task overview
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {analytics.map((item) => (
              <div
                key={item.label}
                className={`rounded-2xl border p-4 ${item.tone}`}
              >
                <p className="text-sm font-medium text-slate-300">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-400">Projects</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                Open a project
              </h2>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              {formatCountLabel(projects.length, "project", "projects")}
            </span>
          </div>

          {isLoading ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-slate-950/30 px-4 py-8 text-center text-sm text-slate-400">
              Loading projects...
            </div>
          ) : (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(`/projects/${project.id}`);
                    }
                  }}
                  className="cursor-pointer rounded-2xl border border-white/10 bg-slate-950/40 p-4 transition hover:border-sky-400/30 hover:bg-slate-950/60 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/projects/${project.id}`} className="block min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-white">
                        {project.name}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        {project.description}
                      </p>
                    </Link>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${badgeTone(
                        project.status,
                      )}`}
                    >
                      {formatLabel(project.status)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      {formatCountLabel(
                        project.subtasks.length,
                        "subtask",
                        "subtasks",
                      )}
                    </span>
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 font-medium text-emerald-200">
                      {formatTimeLog(project.totalTimeLogMinutes)} logged
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      {project.techStack.length
                        ? project.techStack.join(", ")
                        : "No tech stack"}
                    </span>
                  </div>

                  {project.repoUrl ? (
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className="mt-4 block break-all text-sm text-sky-300 transition hover:text-sky-200 hover:underline"
                    >
                      {project.repoUrl}
                    </a>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href={`/projects/${project.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="rounded-2xl bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
                    >
                      Open
                    </Link>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openEditProjectModal(project);
                      }}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                    >
                      Update
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        confirmDeleteProject(project);
                      }}
                      className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {isProjectModalOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 px-4 py-4 backdrop-blur-sm sm:py-8">
          <div className="flex min-h-full items-start justify-center">
            <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-3xl min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl sm:max-h-[calc(100vh-4rem)]">
              <form className="flex min-h-0 h-full flex-col" onSubmit={handleSaveProject}>
              <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5 sm:px-8">
                <div>
                  <p className="text-sm font-medium text-sky-300">
                    {editingProjectId ? "Update Project" : "Create Project"}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-white">
                    {editingProjectId ? "Edit project details" : "Add a new project"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsProjectModalOpen(false);
                    setEditingProjectId(null);
                    setProjectForm(emptyProjectForm);
                    setGeneratedSubtasks([]);
                    setAreGeneratedSubtasksConfirmed(false);
                  }}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300"
                >
                  Close
                </button>
              </div>

              <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto px-6 py-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:px-8">
                <input
                  required
                  value={projectForm.title}
                  onChange={(event) => updateProjectForm("title", event.target.value)}
                  placeholder="Project name"
                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                />
                <textarea
                  required
                  rows={4}
                  value={projectForm.description}
                  onChange={(event) =>
                    updateProjectForm("description", event.target.value)
                  }
                  placeholder="Short description"
                  className="min-h-28 resize-y rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-500"
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <select
                    value={projectForm.status}
                    onChange={(event) => updateProjectForm("status", event.target.value)}
                    className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                  <input
                    value={projectForm.techStack}
                    onChange={(event) =>
                      updateProjectForm("techStack", event.target.value)
                    }
                    placeholder="Next.js, Prisma, MongoDB"
                    className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                  />
                </div>
                <input
                  type="url"
                  value={projectForm.repoUrl}
                  onChange={(event) => updateProjectForm("repoUrl", event.target.value)}
                  placeholder="Repository URL"
                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                />

                {!editingProjectId ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">
                          AI subtask suggestions
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          Generate subtasks from the project description, edit
                          them, then confirm the list you want to save.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleGenerateSubtasks}
                        disabled={
                          isGeneratingSubtasks ||
                          !projectForm.title.trim() ||
                          !projectForm.description.trim()
                        }
                        className="rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-sm font-semibold text-sky-200 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isGeneratingSubtasks
                          ? "Generating..."
                          : "Generate Subtasks with Gemini AI"}
                      </button>
                    </div>

                    {generatedSubtasks.length ? (
                      <div className="mt-4 grid gap-3">
                        {generatedSubtasks.map((subtask, index) => (
                          <div
                            key={`${subtask.title}-${index}`}
                            className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                          >
                            <div className="grid gap-3">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-white">
                                  Suggested subtask {index + 1}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => removeGeneratedSubtask(index)}
                                  className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-xs font-semibold text-rose-200 transition hover:bg-rose-400/20"
                                >
                                  Remove
                                </button>
                              </div>

                              <input
                                value={subtask.title}
                                onChange={(event) =>
                                  updateGeneratedSubtask(
                                    index,
                                    "title",
                                    event.target.value,
                                  )
                                }
                                placeholder="Subtask title"
                                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                              />

                              <textarea
                                rows={3}
                                value={subtask.description}
                                onChange={(event) =>
                                  updateGeneratedSubtask(
                                    index,
                                    "description",
                                    event.target.value,
                                  )
                                }
                                placeholder="Subtask description"
                                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                              />

                              <div className="grid gap-3 md:grid-cols-2">
                                <select
                                  value={subtask.priority}
                                  onChange={(event) =>
                                    updateGeneratedSubtask(
                                      index,
                                      "priority",
                                      event.target.value,
                                    )
                                  }
                                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                                >
                                  <option value="LOW">Low</option>
                                  <option value="MEDIUM">Medium</option>
                                  <option value="HIGH">High</option>
                                  <option value="CRITICAL">Critical</option>
                                </select>

                                <input
                                  type="date"
                                  value={subtask.dueDate}
                                  onChange={(event) =>
                                    updateGeneratedSubtask(
                                      index,
                                      "dueDate",
                                      event.target.value,
                                    )
                                  }
                                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        <div className="flex flex-wrap justify-between gap-3">
                          <button
                            type="button"
                            onClick={addGeneratedSubtask}
                            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                          >
                            Add Another Suggestion
                          </button>

                          <button
                            type="button"
                            onClick={() => setAreGeneratedSubtasksConfirmed(true)}
                            className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
                          >
                            Confirm AI Subtasks
                          </button>
                        </div>

                        <div
                          className={`rounded-2xl border px-4 py-3 text-sm ${
                            areGeneratedSubtasksConfirmed
                              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                              : "border-amber-400/20 bg-amber-400/10 text-amber-200"
                          }`}
                        >
                          {areGeneratedSubtasksConfirmed
                            ? "Confirmed. These subtasks will be created when you save the project."
                            : "Review and confirm these AI subtasks before saving the project. Unconfirmed suggestions cannot be saved."}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="flex justify-end gap-3 border-t border-white/10 bg-slate-950 px-6 py-5 sm:px-8">
                <button
                  type="button"
                  onClick={() => {
                    setIsProjectModalOpen(false);
                    setEditingProjectId(null);
                    setProjectForm(emptyProjectForm);
                    setGeneratedSubtasks([]);
                    setAreGeneratedSubtasksConfirmed(false);
                  }}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    (!editingProjectId &&
                      generatedSubtasks.length > 0 &&
                      !areGeneratedSubtasksConfirmed)
                  }
                  className="rounded-2xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting
                    ? editingProjectId
                      ? "Saving changes..."
                      : "Saving project..."
                    : editingProjectId
                      ? "Update Project"
                      : areGeneratedSubtasksConfirmed && generatedSubtasks.length > 0
                        ? "Save Project and AI Subtasks"
                        : "Save Project"}
                </button>
              </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {projectPendingDelete ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl sm:p-7">
            <p className="text-sm font-semibold text-rose-300">Delete Project</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              Are you sure?
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              This will permanently delete{" "}
              <span className="font-semibold text-white">
                {projectPendingDelete.name}
              </span>{" "}
              and all of its subtasks.
            </p>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setProjectPendingDelete(null)}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const projectId = projectPendingDelete.id;
                  setProjectPendingDelete(null);
                  void handleDeleteProject(projectId);
                }}
                className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-5 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
