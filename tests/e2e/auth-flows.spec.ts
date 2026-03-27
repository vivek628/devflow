import { expect, test } from "@playwright/test";

import { authCookie, createSessionToken } from "../../lib/auth/session";

process.env.JWT_SECRET = "playwright-test-secret";

test("user can sign in from the login page and land on the dashboard", async ({
  page,
}) => {
  const sessionToken = await createSessionToken({
    userId: "user-1",
    name: "Test User",
    email: "test@example.com",
  });

  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Set-Cookie": `${authCookie.name}=${sessionToken}; Path=/; HttpOnly; SameSite=Lax`,
      },
      body: JSON.stringify({
        success: true,
        message: "Login successful. Redirecting...",
      }),
    });
  });

  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          userId: "user-1",
          name: "Test User",
          email: "test@example.com",
        },
      }),
    });
  });

  await page.route("**/api/projects", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: [],
      }),
    });
  });

  await page.goto("/login");
  await page.getByLabel("Email address").fill("test@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(
    page.getByText(/login successful\. redirecting\.\.\./i),
  ).toBeVisible();
  await page.waitForURL("**/dashboard");
  await expect(
    page.getByRole("heading", {
      name: /create a project, then open it to manage subtasks/i,
    }),
  ).toBeVisible();
});

test("user can request a reset code, verify it, and submit a new password", async ({
  page,
}) => {
  await page.route("**/api/auth/forgot-password", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "We sent a 6-digit reset code to your email.",
      }),
    });
  });

  await page.goto("/forgot-password");
  await page.getByLabel("Email address").fill("test@example.com");
  await page.getByRole("button", { name: "Send reset code" }).click();

  await page.waitForURL("**/reset-password?email=test%40example.com");
  await expect(
    page.getByRole("heading", { name: /reset your password/i }),
  ).toBeVisible();
  await expect(page.getByLabel("Email address")).toHaveValue("test@example.com");

  await page.route("**/api/auth/verify-reset-code", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "Reset code verified. You can set a new password now.",
      }),
    });
  });

  await page.route("**/api/auth/reset-password", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "Password reset successful. Redirecting to login.",
      }),
    });
  });

  await page.getByLabel("6-digit reset code").fill("123456");
  await page.getByRole("button", { name: "Verify code" }).click();
  await expect(page.getByText(/step 2/i)).toBeVisible();

  await page.getByLabel(/^New password$/).fill("newpassword123");
  await page.getByLabel(/^Confirm new password$/).fill("newpassword123");
  await page.getByRole("button", { name: "Reset password" }).click();

  await expect(
    page.getByText(/password reset successful\. redirecting to login\./i),
  ).toBeVisible();
  await page.waitForURL("**/login");
});
