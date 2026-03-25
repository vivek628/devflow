const stats = [
  {
    label: "Total Projects",
    value: "4",
    change: "+1 this week",
    accent: "from-sky-400/20 to-sky-400/5 text-sky-200",
  },
  {
    label: "Open Issues",
    value: "12",
    change: "5 high priority",
    accent: "from-rose-400/20 to-rose-400/5 text-rose-200",
  },
  {
    label: "In Progress",
    value: "6",
    change: "2 in review",
    accent: "from-amber-400/20 to-amber-400/5 text-amber-200",
  },
  {
    label: "Completed",
    value: "18",
    change: "Shipping momentum looks good",
    accent: "from-emerald-400/20 to-emerald-400/5 text-emerald-200",
  },
];

const recentProjects = [
  {
    name: "DevFlow Web App",
    status: "Active",
    description: "Authentication, dashboard, and project management buildout.",
  },
  {
    name: "Portfolio Revamp",
    status: "Planning",
    description: "Refreshing case studies and developer branding.",
  },
  {
    name: "Client CRM",
    status: "On Hold",
    description: "Internal freelance tracking tool with reminders and notes.",
  },
];

const priorityIssues = [
  {
    title: "Protect dashboard routes",
    priority: "Critical",
    meta: "Auth security",
  },
  {
    title: "Connect project creation form",
    priority: "High",
    meta: "Projects module",
  },
  {
    title: "Add issue status filters",
    priority: "High",
    meta: "Issue board",
  },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.3fr_0.7fr] lg:p-10">
            <div className="space-y-5">
              <span className="inline-flex w-fit rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-300">
                DevFlow Dashboard
              </span>

              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Welcome back. You are logged in and ready to build.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  This is the first page a user sees after login. It gives a
                  quick overview of project activity, issue pressure, and the
                  most important next actions inside DevFlow.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button className="rounded-2xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300">
                  Create Project
                </button>
                <button className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10">
                  View Issues
                </button>
              </div>
            </div>

            <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/40 p-5">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-400">
                  Today&apos;s focus
                </p>
                <h2 className="text-2xl font-semibold text-white">
                  Keep high-priority work moving.
                </h2>
              </div>

              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <p className="text-sm font-medium text-emerald-200">
                  3 issues need attention today
                </p>
                <p className="mt-2 text-sm leading-6 text-emerald-100/90">
                  Review critical blockers, finish auth protection, and push the
                  dashboard data wiring next.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">
                This section will later show live user-specific stats after we
                connect the dashboard to the database.
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <article
              key={item.label}
              className={`rounded-3xl border border-white/10 bg-gradient-to-br ${item.accent} p-5 shadow-lg backdrop-blur`}
            >
              <p className="text-sm font-medium text-slate-300">{item.label}</p>
              <p className="mt-4 text-4xl font-semibold tracking-tight text-white">
                {item.value}
              </p>
              <p className="mt-3 text-sm text-slate-300">{item.change}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Recent Projects
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-white">
                  Keep your active work visible
                </h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                Static preview
              </span>
            </div>

            <div className="grid gap-4">
              {recentProjects.map((project) => (
                <div
                  key={project.name}
                  className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-white">
                        {project.name}
                      </h3>
                      <p className="text-sm leading-6 text-slate-400">
                        {project.description}
                      </p>
                    </div>
                    <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-200">
                      {project.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <div className="grid gap-6">
            <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
              <p className="text-sm font-medium text-slate-400">
                High Priority Issues
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                What needs action now
              </h2>

              <div className="mt-6 grid gap-3">
                {priorityIssues.map((issue) => (
                  <div
                    key={issue.title}
                    className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          {issue.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-400">
                          {issue.meta}
                        </p>
                      </div>
                      <span className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-xs font-medium text-rose-200">
                        {issue.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
              <p className="text-sm font-medium text-slate-400">Quick Notes</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                What comes next
              </h2>
              <ul className="mt-5 grid gap-3 text-sm leading-7 text-slate-300">
                <li className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                  Add secure cookie-based session handling
                </li>
                <li className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                  Protect dashboard and project routes
                </li>
                <li className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                  Replace static cards with real MongoDB data
                </li>
              </ul>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
