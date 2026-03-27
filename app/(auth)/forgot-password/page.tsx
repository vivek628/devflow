"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { getUserFacingErrorMessage } from "@/lib/utils/client-errors";

type ForgotPasswordFormData = {
  email: string;
};

type ForgotPasswordErrors = Partial<Record<keyof ForgotPasswordFormData, string[]>>;

const initialFormData: ForgotPasswordFormData = {
  email: "",
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

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState(initialFormData);
  const [fieldErrors, setFieldErrors] = useState<ForgotPasswordErrors>({});
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
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await readApiResponse<{
        success: boolean;
        message: string;
        errors?: ForgotPasswordErrors;
      }>(response);

      if (!response.ok) {
        if (result.errors) {
          setFieldErrors(result.errors);
        }

        setGeneralError(result.message || "Unable to send reset code");
        return;
      }

      setSuccessMessage(result.message);

      window.setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(formData.email)}`);
      }, 1200);
    } catch (error) {
      setGeneralError(
        getUserFacingErrorMessage(error, "Unable to send reset code"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we will send a 6-digit reset code that expires in 2 minutes."
      footerText="Remembered your password?"
      footerLinkText="Back to login"
      footerLinkHref="/login"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
        >
          Back to login
        </button>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-200">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(event) => {
              setFormData({ email: event.target.value });
              setFieldErrors({});
            }}
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
          />
          {fieldErrors.email && (
            <p className="text-sm text-rose-300">{fieldErrors.email[0]}</p>
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
          {isSubmitting ? "Sending code..." : "Send reset code"}
        </button>
      </form>
    </AuthShell>
  );
}
