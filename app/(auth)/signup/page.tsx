"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { getUserFacingErrorMessage } from "@/lib/utils/client-errors";

type SignupFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type SignupErrors = Partial<Record<keyof SignupFormData, string[]>>;

const initialFormData: SignupFormData = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
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

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<SignupFormData>(initialFormData);
  const [fieldErrors, setFieldErrors] = useState<SignupErrors>({});
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
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await readApiResponse<{
        success: boolean;
        message: string;
        errors?: SignupErrors;
      }>(response);

      if (!response.ok) {
        if (result.errors) {
          setFieldErrors(result.errors);
        }

        setGeneralError(result.message || "Unable to create your account");
        return;
      }

      setSuccessMessage("Account created successfully. Redirecting to login...");
      setFormData(initialFormData);

      window.setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (error) {
      setGeneralError(
        getUserFacingErrorMessage(error, "Unable to create your account"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField<K extends keyof SignupFormData>(
    field: K,
    value: SignupFormData[K],
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
      title="Create your DevFlow account"
      subtitle="Set up your workspace and start organizing projects, tasks, and delivery progress."
      footerText="Already have an account?"
      footerLinkText="Login"
      footerLinkHref="/login"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-slate-200">
            Full name
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="John developer"
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
          />
          {fieldErrors.name && (
            <p className="text-sm text-rose-300">{fieldErrors.name[0]}</p>
          )}
        </div>

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
          <label
            htmlFor="password"
            className="text-sm font-medium text-slate-200"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={(event) => updateField("password", event.target.value)}
            placeholder="Create a strong password"
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
          />
          {fieldErrors.password && (
            <p className="text-sm text-rose-300">{fieldErrors.password[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-slate-200"
          >
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(event) =>
              updateField("confirmPassword", event.target.value)
            }
            placeholder="Repeat your password"
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
          />
          {fieldErrors.confirmPassword && (
            <p className="text-sm text-rose-300">
              {fieldErrors.confirmPassword[0]}
            </p>
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
          className="w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
