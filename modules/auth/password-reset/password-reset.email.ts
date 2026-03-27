import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail =
  process.env.RESEND_FROM_EMAIL || "DevFlow <onboarding@resend.dev>";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

let resendClient: Resend | null = null;

function getResendClient() {
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  if (!resendClient) {
    resendClient = new Resend(resendApiKey);
  }

  return resendClient;
}

export async function sendPasswordResetEmail(input: {
  name: string;
  email: string;
  code: string;
}) {
  const resetUrl = `${appUrl}/reset-password?email=${encodeURIComponent(
    input.email,
  )}&code=${encodeURIComponent(input.code)}`;

  await getResendClient().emails.send({
    from: resendFromEmail,
    to: input.email,
    subject: `${input.name}, reset your DevFlow password`,
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #0f172a; line-height: 1.6;">
        <h2 style="margin-bottom: 12px;">Password reset request</h2>
        <p>Hi ${input.name},</p>
        <p>We received a request to reset your DevFlow password.</p>
        <p>Your 6-digit reset code is:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 16px 0;">${input.code}</p>
        <p>This code will expire in <strong>2 minutes</strong> and can only be entered incorrectly <strong>3 times</strong>.</p>
        <p>You can also open the reset screen directly:</p>
        <p><a href="${resetUrl}" style="color: #0ea5e9;">Reset your password</a></p>
        <p>If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
