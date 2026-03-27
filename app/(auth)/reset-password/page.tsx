"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { getUserFacingErrorMessage } from "@/lib/utils/client-errors";

type ResetPasswordFormData = {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
};

type ResetPasswordErrors = Partial<Record<keyof ResetPasswordFormData, string[]>>;

const initialFormData: ResetPasswordFormData = {
  email: "",
  code: "",
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

function ResetPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState(initialFormData);
  const [fieldErrors, setFieldErrors] = useState<ResetPasswordErrors>({});
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const email = searchParams.get("email") || "";
    const code = searchParams.get("code") || "";

    setFormData((current) => ({
      ...current,
      email: email || current.email,
      code: code || current.code,
    }));
  }, [searchParams]);

  function updateField<K extends keyof ResetPasswordFormData>(
    field: K,
    value: ResetPasswordFormData[K],
  ) {
    if (field === "email" || field === "code") {
      setIsCodeVerified(false);
      setVerificationMessage("");
    }

    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setFieldErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    setGeneralError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await readApiResponse<{
        success: boolean;
        message: string;
        errors?: ResetPasswordErrors;
      }>(response);

      if (!response.ok) {
        if (result.errors) {
          setFieldErrors(result.errors);
        }

        setGeneralError(result.message || "Unable to reset password");
        return;
      }

      setSuccessMessage(result.message);
      setFormData(initialFormData);

      window.setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (error) {
      setGeneralError(
        getUserFacingErrorMessage(error, "Unable to reset password"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyCode() {
    setIsSubmitting(true);
    setFieldErrors({});
    setGeneralError("");
    setSuccessMessage("");
    setVerificationMessage("");

    try {
      const response = await fetch("/api/auth/verify-reset-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          code: formData.code,
        }),
      });

      const result = await readApiResponse<{
        success: boolean;
        message: string;
        errors?: ResetPasswordErrors;
      }>(response);

      if (!response.ok) {
        if (result.errors) {
          setFieldErrors(result.errors);
        }

        setIsCodeVerified(false);
        setGeneralError(result.message || "Unable to verify reset code");
        return;
      }

      setIsCodeVerified(true);
      setVerificationMessage(result.message);
    } catch (error) {
      setIsCodeVerified(false);
      setGeneralError(
        getUserFacingErrorMessage(error, "Unable to verify reset code"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the code from your email. It expires in 2 minutes and allows only 3 invalid attempts."
      footerText="Need a new code?"
      footerLinkText="Request another"
      footerLinkHref="/forgot-password"
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
            disabled={isCodeVerified}
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
          />
          {fieldErrors.email && (
            <p className="text-sm text-rose-300">{fieldErrors.email[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="code" className="text-sm font-medium text-slate-200">
              6-digit reset code
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-sky-300 transition hover:text-sky-200"
            >
              Resend code
            </Link>
          </div>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={formData.code}
            onChange={(event) =>
              updateField("code", event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="123456"
            disabled={isCodeVerified}
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm tracking-[0.3em] text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
          />
          {fieldErrors.code && (
            <p className="text-sm text-rose-300">{fieldErrors.code[0]}</p>
          )}
        </div>

        <button
          type="button"
          onClick={handleVerifyCode}
          disabled={isSubmitting || isCodeVerified}
          className="w-full rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm font-semibold text-sky-200 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting && !isCodeVerified ? "Verifying code..." : isCodeVerified ? "Code verified" : "Verify code"}
        </button>

        {verificationMessage && (
          <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm text-sky-200">
            {verificationMessage}
          </div>
        )}

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

        {isCodeVerified ? (
          <>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
              <p className="text-sm font-medium text-emerald-200">Step 2</p>
              <p className="mt-1 text-sm text-slate-300">
                Your reset code is verified. Set your new password now.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-200"
              >
                New password
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
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(event) =>
                  updateField("confirmPassword", event.target.value)
                }
                placeholder="Repeat your new password"
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
              />
              {fieldErrors.confirmPassword && (
                <p className="text-sm text-rose-300">
                  {fieldErrors.confirmPassword[0]}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Resetting password..." : "Reset password"}
            </button>
          </>
        ) : (
          <div>
          </div>
        )}
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
