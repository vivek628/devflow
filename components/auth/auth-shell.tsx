"use client";

import Link from "next/link";
import { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
  children: ReactNode;
};

export function AuthShell({
  title,
  subtitle,
  footerText,
  footerLinkText,
  footerLinkHref,
  children,
}: AuthShellProps) {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_25%)]" />

      <div className="relative z-10 grid w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur md:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden flex-col justify-between border-r border-white/10 bg-white/5 p-10 md:flex">
          <div className="space-y-6">
            <span className="inline-flex w-fit rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-300">
              DevFlow
            </span>

            <div className="space-y-4">
              <h1 className="max-w-md text-4xl font-semibold tracking-tight text-white">
                Track projects, issues, and shipping momentum in one place.
              </h1>
              <p className="max-w-lg text-sm leading-7 text-slate-300">
                A focused workspace for developers who want project visibility
                without the overhead of a giant enterprise tool.
              </p>
            </div>
          </div>

          <div className="grid gap-4 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              Organize projects, priorities, and issue flow with a clean
              dashboard-first experience.
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-xl sm:p-8">
            <div className="mb-8 space-y-2">
              <p className="text-sm font-medium text-sky-300">Welcome back</p>
              <h2 className="text-3xl font-semibold tracking-tight text-white">
                {title}
              </h2>
              <p className="text-sm leading-6 text-slate-400">{subtitle}</p>
            </div>

            {children}

            <p className="mt-6 text-center text-sm text-slate-400">
              {footerText}{" "}
              <Link
                href={footerLinkHref}
                className="font-semibold text-sky-300 transition hover:text-sky-200"
              >
                {footerLinkText}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
