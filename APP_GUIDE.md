# DevFlow App Guide

## Product Overview

DevFlow is a developer-focused workspace for tracking projects, subtasks, deadlines, and progress logs. It is designed to keep implementation work organized while also making the codebase easy to understand through a clean feature-module structure.

The app is built around three main ideas:

- every user has a protected personal workspace
- every project can be broken into manageable subtasks
- every subtask can record actual work done and time spent

## Core User Journey

### 1. User Authentication

The user creates an account, logs in, and gets a session-backed workspace.

Implementation summary:

- request validation is done with Zod
- passwords are hashed with `bcryptjs`
- session information is stored in an HTTP-only cookie
- auth routes are handled in `app/api/auth`

Main files:

- [auth.schemas.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/auth/core/auth.schemas.ts)
- [auth.repository.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/auth/core/auth.repository.ts)
- [auth.service.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/auth/core/auth.service.ts)
- [login route](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/api/auth/login/route.ts)
- [signup route](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/api/auth/signup/route.ts)
- [logout route](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/api/auth/logout/route.ts)
- [session route](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/api/auth/session/route.ts)

### 2. Forgot Password And Reset Password

The forgot-password flow lets a user request a 6-digit OTP by email, verify it, and then set a new password.

Security rules:

- OTP expires in 2 minutes
- stale OTP is cleanup-eligible after 3 minutes total
- only 3 wrong attempts are allowed
- a new OTP request deletes the previous OTP for that user/email
- reset APIs are rate-limited
- email delivery uses Resend

Implementation summary:

- forgot-password creates a token record
- raw OTP is emailed, but only the hash is stored
- verify step checks code, expiry, and attempt count
- reset step only works after verification

Main files:

- [password-reset.schemas.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/auth/password-reset/password-reset.schemas.ts)
- [password-reset.repository.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/auth/password-reset/password-reset.repository.ts)
- [password-reset.service.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/auth/password-reset/password-reset.service.ts)
- [password-reset.email.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/auth/password-reset/password-reset.email.ts)
- [forgot-password route](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/api/auth/forgot-password/route.ts)
- [verify-reset-code route](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/api/auth/verify-reset-code/route.ts)
- [reset-password route](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/api/auth/reset-password/route.ts)
- [forgot-password page](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/(auth)/forgot-password/page.tsx)
- [reset-password page](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/(auth)/reset-password/page.tsx)

### 3. Project Management

Each logged-in user can create and manage projects.

Project data includes:

- title
- description
- tech stack
- repository URL
- status

Implementation summary:

- dashboard fetches the current user’s projects
- each project is tied to the authenticated owner
- repository URL is clickable in the UI
- project detail page shows deeper planning and tracking information

Main files:

- [projects.schemas.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/projects/projects.schemas.ts)
- [projects.repository.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/projects/projects.repository.ts)
- [projects.service.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/projects/projects.service.ts)
- [projects route](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/api/projects/route.ts)
- [project route](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/api/projects/[projectId]/route.ts)
- [dashboard page](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/dashboard/page.tsx)
- [project detail page](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/projects/[projectId]/page.tsx)

### 4. Subtask Management

Projects are broken into subtasks so execution can be tracked more clearly.

Each subtask supports:

- title
- description
- status
- priority
- due date

Implementation summary:

- subtasks belong to a project
- users can create, edit, and delete subtasks
- due date uses calendar input in the UI
- status and priority are managed through structured form values

Main files:

- [projects.schemas.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/projects/projects.schemas.ts)
- [projects.repository.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/projects/projects.repository.ts)
- [projects.service.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/projects/projects.service.ts)
- [subtasks route](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/api/projects/[projectId]/subtasks/route.ts)
- [subtask route](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/api/projects/[projectId]/subtasks/[subtaskId]/route.ts)
- [project detail page](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/projects/[projectId]/page.tsx)

### 5. Progress Logs And Time Tracking

This is one of the most important workflow features in the app.

Instead of storing only the current subtask status, the app keeps a running history of work updates. Each update records what was completed and how much time was spent.

Each subtask update stores:

- `summary`
- `timeLogMinutes`
- `loggedAt`

Implementation summary:

- updates are stored in a separate `SubtaskUpdate` model
- each subtask can have multiple progress logs
- total time is calculated per subtask
- project total time is the sum of all subtask update logs

Main files:

- [schema.prisma](/abs/path/c:/Users/user/Desktop/devFlow/devflow/prisma/schema.prisma)
- [projects.repository.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/projects/projects.repository.ts)
- [projects.service.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/projects/projects.service.ts)
- [subtask updates route](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/api/projects/[projectId]/subtasks/[subtaskId]/updates/route.ts)
- [project detail page](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/projects/[projectId]/page.tsx)
- [dashboard page](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/dashboard/page.tsx)

### 6. Due-Date Visibility

The project detail page groups tasks by due-date urgency so a user can quickly identify risk.

Current buckets:

- overdue
- due soon
- no due date

Implementation summary:

- subtask due dates are analyzed on the project detail page
- this gives a quick operational view without needing a separate analytics dashboard

Main file:

- [project detail page](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/projects/[projectId]/page.tsx)

### 7. AI Subtask Generation

The app can generate suggested subtasks from a project description.

Implementation summary:

- user provides title, description, and tech stack
- prompt is built for Gemini
- Gemini returns structured task suggestions
- user reviews them before saving into the project

Main files:

- [project-subtasks.prompt.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/ai/features/project-subtasks/project-subtasks.prompt.ts)
- [project-subtasks.schema.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/ai/features/project-subtasks/project-subtasks.schema.ts)
- [project-subtasks.service.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/ai/features/project-subtasks/project-subtasks.service.ts)
- [gemini.provider.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/ai/providers/gemini/gemini.provider.ts)
- [AI route](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/api/ai/project-subtasks/route.ts)

## Implementation Pattern

The codebase uses a simple and reusable structure across features.

### `page.tsx`

Responsible for:

- UI rendering
- local state
- form handling
- calling API routes

### `route.ts`

Responsible for:

- HTTP request handling
- parsing input
- sending structured responses

### `schemas.ts`

Responsible for:

- input validation
- keeping request payloads predictable

### `repository.ts`

Responsible for:

- Prisma queries
- database reads and writes

### `service.ts`

Responsible for:

- business rules
- combining repository calls
- orchestrating feature behavior

### `email.ts`

Used only where needed for:

- email generation and sending logic

## Database Design

Main models in [schema.prisma](/abs/path/c:/Users/user/Desktop/devFlow/devflow/prisma/schema.prisma):

- `User`
- `Project`
- `Subtask`
- `SubtaskUpdate`
- `PasswordResetToken`

High-level relationships:

- one user has many projects
- one project has many subtasks
- one subtask has many update logs
- one user can have password reset tokens

## API Surface

### Auth API

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`
- `POST /api/auth/forgot-password`
- `POST /api/auth/verify-reset-code`
- `POST /api/auth/reset-password`

### Project API

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:projectId`
- `PATCH /api/projects/:projectId`
- `DELETE /api/projects/:projectId`

### Subtask API

- `POST /api/projects/:projectId/subtasks`
- `PATCH /api/projects/:projectId/subtasks/:subtaskId`
- `DELETE /api/projects/:projectId/subtasks/:subtaskId`
- `POST /api/projects/:projectId/subtasks/:subtaskId/updates`

### AI API

- `POST /api/ai/project-subtasks`

## How To Explain This Repo Quickly

If someone asks where a feature lives:

- login/signup/session -> `modules/auth/core`
- forgot/reset password -> `modules/auth/password-reset`
- project and subtask logic -> `modules/projects`
- AI subtask generation -> `modules/ai/features/project-subtasks`
- Prisma schema -> `prisma/schema.prisma`
- UI pages -> `app`
- API routes -> `app/api`

For a file-by-file version, see [FILE_MAP.md](/abs/path/c:/Users/user/Desktop/devFlow/devflow/docs/FILE_MAP.md).

## Operational Notes

- MongoDB stores canonical timestamps in UTC
- password reset tokens also store IST-friendly strings for readability
- if Prisma editor types look stale, regenerate the client
- on Windows, stop the dev server before `npm run prisma:generate` if the Prisma engine file is locked

## Recommended Setup

```bash
npm install
npm run prisma:generate
npm run prisma:push
npm run dev
```

For verification:

```bash
npm run build
```
