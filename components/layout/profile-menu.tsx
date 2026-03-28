"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SessionUser = {
  userId: string;
  name: string;
  email: string;
};

async function readApiResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  const rawBody = await response.text();

  if (contentType.includes("application/json")) {
    return JSON.parse(rawBody) as T;
  }

  throw new Error("Server returned a non-JSON response");
}

export function ProfileMenu() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSessionUser() {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
        });
        const result = await readApiResponse<{
          success: boolean;
          data?: SessionUser;
        }>(response);

        if (!response.ok || !result.data) {
          return;
        }

        if (isMounted) {
          setSessionUser(result.data);
          setIsSessionLoading(false);
        }
      } catch {
        if (isMounted) {
          setSessionUser(null);
          setIsSessionLoading(false);
        }
      }
    }

    void loadSessionUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const initials = useMemo(() => {
    if (isSessionLoading) {
      return "";
    }

    const source = sessionUser?.name?.trim() || sessionUser?.email?.trim() || "U";
    return source
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }, [isSessionLoading, sessionUser]);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <div className="relative ml-auto">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:bg-white/10"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-400 text-sm font-semibold text-slate-950">
          {isSessionLoading ? (
            <span className="h-4 w-4 animate-pulse rounded-full bg-slate-950/25" />
          ) : (
            initials
          )}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block truncate text-sm font-semibold text-white">
            {isSessionLoading ? "Loading..." : sessionUser?.name || "My Profile"}
          </span>
          <span className="block truncate text-xs text-slate-400">
            {isSessionLoading ? "Please wait" : sessionUser?.email || "Account"}
          </span>
        </span>
      </button>

      {isOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed inset-x-4 top-1/2 z-50 -translate-y-1/2 rounded-[2rem] border border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur md:absolute md:inset-auto md:right-0 md:top-[calc(100%+0.75rem)] md:w-[19rem] md:translate-y-0">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
                Profile
              </p>
              <p className="mt-3 text-lg font-semibold text-white">
                {sessionUser?.name || "Signed in"}
              </p>
              <p className="mt-1 break-all text-sm text-slate-400">
                {sessionUser?.email || "Current account"}
              </p>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmOpen(true)}
                disabled={isLoggingOut}
                className="flex-1 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Logout
              </button>
            </div>
          </div>
        </>
      ) : null}

      {isConfirmOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl sm:p-7">
            <p className="text-sm font-semibold text-rose-300">Logout</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Are you sure?
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              You will be signed out of your DevFlow account on this device.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isLoggingOut}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={isLoggingOut}
                className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-5 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoggingOut ? "Logging out..." : "Yes, Logout"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
