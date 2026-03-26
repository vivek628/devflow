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
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

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
        }
      } catch {
        if (isMounted) {
          setSessionUser(null);
        }
      }
    }

    void loadSessionUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const initials = useMemo(() => {
    const source = sessionUser?.name?.trim() || sessionUser?.email?.trim() || "U";
    return source
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }, [sessionUser]);

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
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:bg-white/10"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-400 text-sm font-semibold text-slate-950">
          {initials}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block truncate text-sm font-semibold text-white">
            {sessionUser?.name || "My Profile"}
          </span>
          <span className="block truncate text-xs text-slate-400">
            {sessionUser?.email || "Account"}
          </span>
        </span>
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-40 w-72 rounded-3xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
              Profile
            </p>
            <p className="mt-3 text-lg font-semibold text-white">
              {sessionUser?.name || "Signed in"}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {sessionUser?.email || "Current account"}
            </p>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
              className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
