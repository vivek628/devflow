"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";

type LoginFormData = {
  email: string;
  password: string;
};

type LoginErrors = Partial<Record<keyof LoginFormData, string[]>>;

const initialFormData: LoginFormData = {
  email: "",
  password: "",
};

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>(initialFormData);
  const [fieldErrors, setFieldErrors] = useState<LoginErrors>({});
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    setGeneralError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = (await response.json()) as {
        success: boolean;
        message: string;
        errors?: LoginErrors;
      };

      if (!response.ok) {
        if (result.errors) {
          setFieldErrors(result.errors);
        }

        setGeneralError(result.message || "Unable to sign in");
        return;
      }

      setSuccessMessage("Login successful. Redirecting...");
      setFormData(initialFormData);

      window.setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch {
      setGeneralError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField<K extends keyof LoginFormData>(
    field: K,
    value: LoginFormData[K],
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setFieldErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  return (
    <AuthShell
      title="Login to your account"
      subtitle="Continue managing your projects, priorities, and issues from one focused workspace."
      footerText="Don't have an account?"
      footerLinkText="Create one"
      footerLinkHref="/signup"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-200">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
          />
          {fieldErrors.email && (
            <p className="text-sm text-rose-300">{fieldErrors.email[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-200"
            >
              Password
            </label>
            <Link
              href="#"
              className="text-xs font-medium text-sky-300 transition hover:text-sky-200"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={(event) => updateField("password", event.target.value)}
            placeholder="Enter your password"
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
          />
          {fieldErrors.password && (
            <p className="text-sm text-rose-300">{fieldErrors.password[0]}</p>
          )}
        </div>

        {generalError && (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {generalError}
          </div>
        )}

        {successMessage && (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            {successMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
