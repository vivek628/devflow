"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { ProfileMenu } from "@/components/layout/profile-menu";
import { badgeTone } from "@/lib/projects/project-store";
import { getUserFacingErrorMessage } from "@/lib/utils/client-errors";

type Subtask = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string | null;
  totalTimeLogMinutes: number;
  updates: SubtaskUpdate[];
};

type SubtaskUpdate = {
  id: string;
  summary: string;
  timeLogMinutes: number;
  loggedAt: string;
};

type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
  techStack: string[];
  repoUrl: string;
  totalTimeLogMinutes: number;
  subtasks: Subtask[];
};

type ProjectFormState = {
  title: string;
  description: string;
  status: string;
  techStack: string;
  repoUrl: string;
};

const emptySubtaskForm = {
  title: "",
  description: "",
  status: "BACKLOG",
  priority: "MEDIUM",
  dueDate: "",
};

const emptySubtaskUpdateForm = {
  summary: "",
  timeLog: "00:30",
  loggedDate: new Date().toISOString().slice(0, 10),
  loggedTime: new Date().toTimeString().slice(0, 5),
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

function getDueDateBuckets(subtasks: Subtask[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue: Subtask[] = [];
  const dueSoon: Subtask[] = [];
  const noDueDate: Subtask[] = [];

  for (const subtask of subtasks) {
    if (!subtask.dueDate) {
      noDueDate.push(subtask);
      continue;
    }

    const dueDate = new Date(subtask.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilDue < 0) {
      overdue.push(subtask);
    } else if (daysUntilDue <= 3) {
      dueSoon.push(subtask);
    }
  }

  return { overdue, dueSoon, noDueDate };
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

function parseTimeLogToMinutes(value: string) {
  const [hoursText = "0", minutesText = "0"] = value.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return 0;
  }

  return hours * 60 + minutes;
}

function combineDateAndTime(date: string, time: string) {
  if (!date) {
    return "";
  }

  return `${date}T${time || "00:00"}`;
}

type PickerInputProps = {
  label: string;
  type: "date" | "time";
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  step?: string;
};

function PickerInput({
  label,
  type,
  value,
  onChange,
  required = false,
  step,
}: PickerInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const icon = type === "date" ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M7 3.5V7" />
      <path d="M17 3.5V7" />
      <path d="M3.5 9.5H20.5" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12L15.5 14" />
    </svg>
  );

  function openPicker() {
    const element = inputRef.current;

    if (!element) {
      return;
    }

    const pickerElement = element as HTMLInputElement & {
      showPicker?: () => void;
    };

    if (pickerElement.showPicker) {
      pickerElement.showPicker();
      return;
    }

    element.focus();
    element.click();
  }

  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <div className="relative">
        <input
          ref={inputRef}
          required={required}
          type={type}
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="dark-picker-input w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 pr-12 text-sm text-white outline-none"
        />
        <button
          type="button"
          aria-label={`Open ${label}`}
          onClick={openPicker}
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <span className="pointer-events-none h-4 w-4">{icon}</span>
        </button>
      </div>
    </label>
  );
}

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [deleteTargetSubtask, setDeleteTargetSubtask] = useState<Subtask | null>(null);
  const [updateTargetSubtask, setUpdateTargetSubtask] = useState<Subtask | null>(null);
  const [isDeleteProjectModalOpen, setIsDeleteProjectModalOpen] = useState(false);
  const [subtaskForm, setSubtaskForm] = useState(emptySubtaskForm);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [subtaskUpdateForm, setSubtaskUpdateForm] = useState(emptySubtaskUpdateForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dueDateBuckets = project
    ? getDueDateBuckets(project.subtasks)
    : { overdue: [], dueSoon: [], noDueDate: [] };

  useEffect(() => {
    let isMounted = true;

    async function fetchProject() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(`/api/projects/${params.projectId}`, {
          credentials: "include",
        });
        const result = await readApiResponse<{
          success: boolean;
          message?: string;
          data?: Project;
        }>(response);

        if (!response.ok || !result.data) {
          throw new Error(result.message || "Unable to load project");
        }

        if (isMounted) {
          setProject(result.data);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(getUserFacingErrorMessage(error, "Unable to load project"));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void fetchProject();

    return () => {
      isMounted = false;
    };
  }, [params.projectId]);

  function updateSubtaskForm(
    field: keyof typeof emptySubtaskForm,
    value: string,
  ) {
    setSubtaskForm((current) => ({ ...current, [field]: value }));
  }

  function updateProjectForm(
    field: keyof ProjectFormState,
    value: string,
  ) {
    setProjectForm((current) => ({ ...current, [field]: value }));
  }

  function updateSubtaskUpdateForm(
    field: keyof typeof emptySubtaskUpdateForm,
    value: string,
  ) {
    setSubtaskUpdateForm((current) => ({ ...current, [field]: value }));
  }

  function openEditProjectModal() {
    if (!project) {
      return;
    }

    setProjectForm({
      title: project.name,
      description: project.description,
      status: project.status,
      techStack: project.techStack.join(", "),
      repoUrl: project.repoUrl,
    });
    setIsProjectModalOpen(true);
  }

  function closeProjectModal() {
    setProjectForm(emptyProjectForm);
    setIsProjectModalOpen(false);
  }

  function openCreateSubtask() {
    setEditingSubtaskId(null);
    setSubtaskForm(emptySubtaskForm);
    setIsSubtaskModalOpen(true);
  }

  function openEditSubtask(subtask: Subtask) {
    setEditingSubtaskId(subtask.id);
    setSubtaskForm({
      title: subtask.title,
      description: subtask.description,
      status: subtask.status,
      priority: subtask.priority,
      dueDate: subtask.dueDate ? subtask.dueDate.slice(0, 10) : "",
    });
    setIsSubtaskModalOpen(true);
  }

  function closeSubtaskModal() {
    setEditingSubtaskId(null);
    setSubtaskForm(emptySubtaskForm);
    setIsSubtaskModalOpen(false);
  }

  function openSubtaskUpdateModal(subtask: Subtask) {
    setUpdateTargetSubtask(subtask);
    setSubtaskUpdateForm({
      summary: "",
      timeLog: "00:30",
      loggedDate: new Date().toISOString().slice(0, 10),
      loggedTime: new Date().toTimeString().slice(0, 5),
    });
  }

  function closeSubtaskUpdateModal() {
    setUpdateTargetSubtask(null);
    setSubtaskUpdateForm(emptySubtaskUpdateForm);
  }

  async function handleUpdateProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!project) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
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
      });

      const result = await readApiResponse<{
        success: boolean;
        message?: string;
        data?: Project;
      }>(response);

      if (!response.ok || !result.data) {
        throw new Error(result.message || "Unable to update project");
      }

      setProject(result.data);
      closeProjectModal();
    } catch (error) {
      setErrorMessage(getUserFacingErrorMessage(error, "Unable to update project"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteProject() {
    if (!project) {
      return;
    }

    setErrorMessage("");

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await readApiResponse<{
        success: boolean;
        message?: string;
      }>(response);

      if (!response.ok) {
        throw new Error(result.message || "Unable to delete project");
      }

      router.push("/dashboard");
    } catch (error) {
      setErrorMessage(getUserFacingErrorMessage(error, "Unable to delete project"));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!project) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const endpoint = editingSubtaskId
        ? `/api/projects/${project.id}/subtasks/${editingSubtaskId}`
        : `/api/projects/${project.id}/subtasks`;
      const method = editingSubtaskId ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(subtaskForm),
      });

      const result = await readApiResponse<{
        success: boolean;
        message?: string;
        data?: Subtask;
      }>(response);

      if (!response.ok || !result.data) {
        throw new Error(result.message || "Unable to save subtask");
      }

      setProject((current) => {
        if (!current) {
          return current;
        }

        if (editingSubtaskId) {
          return {
            ...current,
            subtasks: current.subtasks.map((subtask) =>
              subtask.id === editingSubtaskId ? result.data! : subtask,
            ),
          };
        }

        return {
          ...current,
          subtasks: [result.data!, ...current.subtasks],
        };
      });

      closeSubtaskModal();
    } catch (error) {
      setErrorMessage(getUserFacingErrorMessage(error, "Unable to save subtask"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteSubtask(subtaskId: string) {
    if (!project) {
      return;
    }

    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/projects/${project.id}/subtasks/${subtaskId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const result = await readApiResponse<{
        success: boolean;
        message?: string;
      }>(response);

      if (!response.ok) {
        throw new Error(result.message || "Unable to delete subtask");
      }

      setProject((current) =>
        current
          ? {
              ...current,
              subtasks: current.subtasks.filter((subtask) => subtask.id !== subtaskId),
            }
          : current,
      );
      setDeleteTargetSubtask(null);
    } catch (error) {
      setErrorMessage(getUserFacingErrorMessage(error, "Unable to delete subtask"));
    }
  }

  async function handleCreateSubtaskUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!project || !updateTargetSubtask) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/projects/${project.id}/subtasks/${updateTargetSubtask.id}/updates`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            summary: subtaskUpdateForm.summary,
            timeLogMinutes: parseTimeLogToMinutes(subtaskUpdateForm.timeLog),
            loggedAt: combineDateAndTime(
              subtaskUpdateForm.loggedDate,
              subtaskUpdateForm.loggedTime,
            ),
          }),
        },
      );

      const result = await readApiResponse<{
        success: boolean;
        message?: string;
        data?: SubtaskUpdate;
      }>(response);

      if (!response.ok || !result.data) {
        throw new Error(result.message || "Unable to save task update");
      }

      setProject((current) =>
        current
          ? {
              ...current,
              totalTimeLogMinutes:
                current.totalTimeLogMinutes + result.data!.timeLogMinutes,
              subtasks: current.subtasks.map((subtask) =>
                subtask.id === updateTargetSubtask.id
                  ? {
                      ...subtask,
                      totalTimeLogMinutes:
                        subtask.totalTimeLogMinutes + result.data!.timeLogMinutes,
                      updates: [result.data!, ...subtask.updates],
                    }
                  : subtask,
              ),
            }
          : current,
      );

      closeSubtaskUpdateModal();
    } catch (error) {
      setErrorMessage(getUserFacingErrorMessage(error, "Unable to save task update"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="scrollbar-hidden w-full overflow-x-hidden min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-screen-2xl space-y-6">
        <section className="relative z-20 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <div className="absolute right-4 top-4 sm:right-8 sm:top-8">
            <ProfileMenu />
          </div>

          <div className="pr-20 sm:pr-48 lg:pr-56">
            <Link
              href="/dashboard"
              className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300"
            >
              Back to Dashboard
            </Link>
          </div>

          {errorMessage ? (
            <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
              {errorMessage}
            </div>
          ) : null}

          {isLoading ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-slate-950/30 px-4 py-8 text-center text-sm text-slate-400">
              Loading project...
            </div>
          ) : project ? (
            <>
              <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    {project.name}
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                    {project.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={openEditProjectModal}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                >
                  Update Project
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteProjectModalOpen(true)}
                  className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/20"
                >
                  Delete Project
                </button>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${badgeTone(project.status)}`}
                >
                  {formatLabel(project.status)}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  {project.subtasks.length} subtasks
                </span>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                  Total logged: {formatTimeLog(project.totalTimeLogMinutes)}
                </span>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-sm font-medium text-slate-400">Tech stack</p>
                  <p className="mt-2 text-sm leading-6 text-white">
                    {project.techStack.length
                      ? project.techStack.join(", ")
                      : "Not added yet"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-sm font-medium text-slate-400">Repository</p>
                  {project.repoUrl ? (
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block break-all text-sm leading-6 text-sky-300 transition hover:text-sky-200 hover:underline"
                    >
                      {project.repoUrl}
                    </a>
                  ) : (
                    <p className="mt-2 break-all text-sm leading-6 text-white">
                      Not added yet
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-slate-950/30 px-4 py-8 text-center text-sm text-slate-400">
              Project not found.
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-400">Due Date Matrix</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                Tasks close to deadline
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4">
              <p className="text-sm font-medium text-rose-200">Overdue</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {dueDateBuckets.overdue.length}
              </p>
              <div className="mt-4 grid gap-2">
                {dueDateBuckets.overdue.length ? (
                  dueDateBuckets.overdue.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="rounded-2xl border border-rose-400/20 bg-slate-950/40 px-3 py-2 text-sm text-slate-200"
                    >
                      {subtask.title}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-300">No overdue tasks.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
              <p className="text-sm font-medium text-amber-200">Due Soon</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {dueDateBuckets.dueSoon.length}
              </p>
              <div className="mt-4 grid gap-2">
                {dueDateBuckets.dueSoon.length ? (
                  dueDateBuckets.dueSoon.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="rounded-2xl border border-amber-400/20 bg-slate-950/40 px-3 py-2 text-sm text-slate-200"
                    >
                      {subtask.title}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-300">No tasks due soon.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-400/20 bg-white/5 p-4">
              <p className="text-sm font-medium text-slate-300">No Due Date</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {dueDateBuckets.noDueDate.length}
              </p>
              <div className="mt-4 grid gap-2">
                {dueDateBuckets.noDueDate.length ? (
                  dueDateBuckets.noDueDate.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-200"
                    >
                      {subtask.title}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-300">All tasks have due dates.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-400">Subtasks</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                Create, update, and delete subtasks
              </h2>
            </div>

            <button
              type="button"
              onClick={openCreateSubtask}
              className="rounded-2xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
            >
              Add Subtask
            </button>
          </div>

          {isLoading ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-slate-950/30 px-4 py-8 text-center text-sm text-slate-400">
              Loading subtasks...
            </div>
          ) : (
            <div className="mt-6 grid gap-3">
              {project?.subtasks.length ? (
                project.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {subtask.title}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-slate-400">
                          {subtask.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${badgeTone(
                            subtask.status,
                          )}`}
                        >
                          {formatLabel(subtask.status)}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${badgeTone(
                            subtask.priority,
                          )}`}
                        >
                          {formatLabel(subtask.priority)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      {subtask.dueDate ? (
                        <span className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                          Due: {new Date(subtask.dueDate).toLocaleDateString()}
                        </span>
                      ) : null}
                      <span className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                        {subtask.updates.length} updates logged
                      </span>
                      <span className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200">
                        Total time: {formatTimeLog(subtask.totalTimeLogMinutes)}
                      </span>
                      <button
                        type="button"
                        onClick={() => openSubtaskUpdateModal(subtask)}
                        className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
                      >
                        Add Update
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditSubtask(subtask)}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTargetSubtask(subtask)}
                        className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/20"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-slate-300">Progress log</p>
                        <p className="text-xs text-slate-500">
                          Track feature work and time spent
                        </p>
                      </div>

                      <div className="mt-3 grid gap-3">
                        {subtask.updates.length ? (
                          subtask.updates.map((update) => (
                            <div
                              key={update.id}
                              className="rounded-2xl border border-white/10 bg-white/5 p-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                                  {formatTimeLog(update.timeLogMinutes)}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {new Date(update.loggedAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="mt-3 text-sm leading-6 text-slate-200">
                                {update.summary}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-400">
                            No updates yet. Log the first feature update for this subtask.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 px-4 py-8 text-center text-sm text-slate-400">
                  No subtasks yet. Create the first one for this project.
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {isSubtaskModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-950 shadow-2xl">
            <form className="grid gap-5 p-6 sm:p-8" onSubmit={handleSubmit}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-sky-300">
                    {editingSubtaskId ? "Update Subtask" : "Create Subtask"}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-white">
                    {editingSubtaskId ? "Edit subtask details" : "Add a new subtask"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeSubtaskModal}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300"
                >
                  Close
                </button>
              </div>

              <input
                required
                value={subtaskForm.title}
                onChange={(event) => updateSubtaskForm("title", event.target.value)}
                placeholder="Subtask title"
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              />
              <textarea
                required
                rows={3}
                value={subtaskForm.description}
                onChange={(event) =>
                  updateSubtaskForm("description", event.target.value)
                }
                placeholder="Describe this subtask"
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              />
              <div className="grid gap-4 md:grid-cols-2">
                <select
                  value={subtaskForm.status}
                  onChange={(event) => updateSubtaskForm("status", event.target.value)}
                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="BACKLOG">Backlog</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REVIEW">Review</option>
                  <option value="DONE">Done</option>
                </select>
                <select
                  value={subtaskForm.priority}
                  onChange={(event) =>
                    updateSubtaskForm("priority", event.target.value)
                  }
                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <PickerInput
                label="Due date"
                type="date"
                value={subtaskForm.dueDate}
                onChange={(value) => updateSubtaskForm("dueDate", value)}
              />

              <div className="flex justify-end gap-3 border-t border-white/10 pt-5">
                <button
                  type="button"
                  onClick={closeSubtaskModal}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-2xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingSubtaskId
                      ? "Update Subtask"
                      : "Save Subtask"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isProjectModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-950 shadow-2xl">
            <form className="grid gap-5 p-6 sm:p-8" onSubmit={handleUpdateProject}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-sky-300">Update Project</p>
                  <h2 className="mt-1 text-2xl font-semibold text-white">
                    Edit project details
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeProjectModal}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300"
                >
                  Close
                </button>
              </div>

              <input
                required
                value={projectForm.title}
                onChange={(event) => updateProjectForm("title", event.target.value)}
                placeholder="Project name"
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              />
              <textarea
                required
                rows={3}
                value={projectForm.description}
                onChange={(event) =>
                  updateProjectForm("description", event.target.value)
                }
                placeholder="Short description"
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
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

              <div className="flex justify-end gap-3 border-t border-white/10 pt-5">
                <button
                  type="button"
                  onClick={closeProjectModal}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-2xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Saving..." : "Update Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTargetSubtask ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl sm:p-8">
            <p className="text-sm font-medium text-rose-300">Delete Subtask</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Are you sure?
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              This will permanently delete{" "}
              <span className="font-semibold text-white">
                {deleteTargetSubtask.title}
              </span>
              .
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTargetSubtask(null)}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSubtask(deleteTargetSubtask.id)}
                className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-5 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isDeleteProjectModalOpen && project ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl sm:p-8">
            <p className="text-sm font-medium text-rose-300">Delete Project</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Are you sure?
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              This will permanently delete{" "}
              <span className="font-semibold text-white">{project.name}</span> and
              all of its subtasks.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteProjectModalOpen(false)}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsDeleteProjectModalOpen(false);
                  await handleDeleteProject();
                }}
                className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-5 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {updateTargetSubtask ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-950 shadow-2xl">
            <form className="grid gap-5 p-6 sm:p-8" onSubmit={handleCreateSubtaskUpdate}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-emerald-300">Task Update</p>
                  <h2 className="mt-1 text-2xl font-semibold text-white">
                    Log work for {updateTargetSubtask.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeSubtaskUpdateModal}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300"
                >
                  Close
                </button>
              </div>

              <textarea
                required
                rows={4}
                value={subtaskUpdateForm.summary}
                onChange={(event) =>
                  updateSubtaskUpdateForm("summary", event.target.value)
                }
                placeholder="What feature or progress did you complete?"
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <PickerInput
                  label="Time log"
                  type="time"
                  required
                  step="60"
                  value={subtaskUpdateForm.timeLog}
                  onChange={(value) => updateSubtaskUpdateForm("timeLog", value)}
                />
                <PickerInput
                  label="Logged date"
                  type="date"
                  value={subtaskUpdateForm.loggedDate}
                  onChange={(value) => updateSubtaskUpdateForm("loggedDate", value)}
                />
              </div>

              <PickerInput
                label="Logged time"
                type="time"
                step="60"
                value={subtaskUpdateForm.loggedTime}
                onChange={(value) => updateSubtaskUpdateForm("loggedTime", value)}
              />

              <p className="text-xs text-slate-500">
                Use the picker controls for duration, date, and time instead of typing minutes manually.
              </p>

              <div className="flex justify-end gap-3 border-t border-white/10 pt-5">
                <button
                  type="button"
                  onClick={closeSubtaskUpdateModal}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Saving..." : "Save Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

    </main>
  );
}
