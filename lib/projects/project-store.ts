export type Subtask = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  techStack: string;
  repoUrl: string;
  subtasks: Subtask[];
};

export const PROJECTS_STORAGE_KEY = "devflow-projects";

export const initialProjects: Project[] = [
  {
    id: "devflow-web-app",
    name: "DevFlow Web App",
    description: "Main product workspace for auth, dashboard, and project flow.",
    status: "Active",
    priority: "High",
    techStack: "Next.js, Prisma, MongoDB",
    repoUrl: "https://github.com/example/devflow",
    subtasks: [
      {
        id: "subtask-1",
        title: "Protect dashboard routes",
        description: "Allow only logged-in users to open app pages.",
        status: "In Progress",
        priority: "High",
      },
    ],
  },
];

export function loadProjects() {
  if (typeof window === "undefined") {
    return initialProjects;
  }

  const savedProjects = window.localStorage.getItem(PROJECTS_STORAGE_KEY);

  if (!savedProjects) {
    return initialProjects;
  }

  try {
    const parsed = JSON.parse(savedProjects) as Project[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialProjects;
  } catch {
    return initialProjects;
  }
}

export function saveProjects(projects: Project[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
}

export function badgeTone(value: string) {
  if (value === "High" || value === "Critical") {
    return "border-rose-400/20 bg-rose-400/10 text-rose-200";
  }

  if (value === "Active" || value === "Done") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  }

  if (value === "In Progress" || value === "Review") {
    return "border-amber-400/20 bg-amber-400/10 text-amber-200";
  }

  return "border-sky-400/20 bg-sky-400/10 text-sky-200";
}

export function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
}
