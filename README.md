# DevFlow

DevFlow is a full-stack project management app built for developers who want to manage projects, subtasks, due dates, progress logs, and password-protected workspaces in one place.

It combines:

- authentication and protected user workspaces
- project and subtask management
- per-subtask work updates with time logging
- project-level time tracking
- due-date visibility
- AI-assisted subtask generation
- password reset with OTP email delivery

## What The App Does

Users can sign up, log in, create projects, break projects into subtasks, assign due dates and priorities, log work updates with time spent, and track total project effort. The app also supports AI-generated subtasks from a project description and a secure forgot-password flow using email OTP verification.

## Main Features

### Authentication

- signup, login, logout, and session lookup
- password hashing with `bcryptjs`
- HTTP-only session cookie handling
- forgot-password and reset-password flow

### Password Reset

- 6-digit OTP sent through Resend
- OTP expires in 2 minutes
- stale OTP becomes cleanup-eligible after 3 minutes total
- max 3 wrong OTP attempts
- requesting a new OTP removes the previous token
- reset flow is split into:
  - verify code
  - update password

### Projects

- create, list, update, and delete projects
- store title, description, tech stack, repository URL, and status
- open a dedicated project detail page

### Subtasks

- create, edit, and delete subtasks
- track status, priority, and due date
- keep implementation work organized per project

### Progress Logs And Time Tracking

- add progress updates on each subtask
- store:
  - completed work summary
  - time spent
  - logged date/time
- show total logged time on:
  - each subtask
  - the whole project

### Due-Date Visibility

- identify overdue subtasks
- highlight due-soon work
- surface tasks with no due date

### AI Subtask Generation

- generate practical subtasks from project title, description, and tech stack
- Gemini returns implementation-focused suggestions
- user can review before saving

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma ORM
- MongoDB Atlas
- Zod
- Resend
- Gemini API

## Environment Variables

Create [`.env`](/abs/path/c:/Users/user/Desktop/devFlow/devflow/.env) with:

```env
DATABASE_URL=
GEMINI_API_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
NEXT_PUBLIC_APP_URL=
```

## Run The App

```bash
npm install
npm run prisma:generate
npm run prisma:push
npm run dev
```

App URL:

```txt
http://localhost:3000
```

## Useful Commands

```bash
npm run dev
npm run build
npm run lint
npm run prisma:generate
npm run prisma:push
```

## Project Structure

```txt
app/
  (auth)/                          Auth pages
  api/                             API routes
  dashboard/                       Main dashboard
  projects/[projectId]/            Project detail page

components/
  auth/                            Shared auth UI
  layout/                          Shared layout UI

lib/
  auth/                            Session helpers
  db/                              Prisma client
  security/                        Rate limiting helpers
  utils/                           Shared utilities

modules/
  ai/
    features/project-subtasks/     AI subtask generation
    providers/gemini/              Gemini integration
  auth/
    core/                          Login/signup/session logic
    password-reset/                Forgot/reset password logic
  projects/                        Project, subtask, and update logic

prisma/
  schema.prisma                    Database schema
```

## Architecture Pattern

The app follows a simple module-based structure:

- `page.tsx` -> UI and client-side state
- `route.ts` -> API entrypoint
- `schemas.ts` -> Zod validation
- `repository.ts` -> database queries
- `service.ts` -> business logic

This makes the codebase easier to explain:

- DB logic lives in repository files
- validation lives in schema files
- business rules live in service files
- frontend lives in page files
- HTTP handlers live in route files

## Main API Routes

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`
- `POST /api/auth/forgot-password`
- `POST /api/auth/verify-reset-code`
- `POST /api/auth/reset-password`

### Projects

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:projectId`
- `PATCH /api/projects/:projectId`
- `DELETE /api/projects/:projectId`

### Subtasks

- `POST /api/projects/:projectId/subtasks`
- `PATCH /api/projects/:projectId/subtasks/:subtaskId`
- `DELETE /api/projects/:projectId/subtasks/:subtaskId`
- `POST /api/projects/:projectId/subtasks/:subtaskId/updates`

### AI

- `POST /api/ai/project-subtasks`

## Data Model Summary

Main Prisma models:

- `User`
- `Project`
- `Subtask`
- `SubtaskUpdate`
- `PasswordResetToken`

See [schema.prisma](/abs/path/c:/Users/user/Desktop/devFlow/devflow/prisma/schema.prisma) for the full schema.

## Documentation Map

If you want to explain the app quickly:

- product and setup overview: [README.md](/abs/path/c:/Users/user/Desktop/devFlow/devflow/README.md)
- feature and implementation guide: [APP_GUIDE.md](/abs/path/c:/Users/user/Desktop/devFlow/devflow/APP_GUIDE.md)
- file and feature location map: [FILE_MAP.md](/abs/path/c:/Users/user/Desktop/devFlow/devflow/docs/FILE_MAP.md)

## Notes

- MongoDB stores canonical timestamps in UTC
- password reset tokens also store readable IST fields for easier debugging
- if Prisma editor types look stale, run:

```bash
npm run prisma:generate
```

Then restart the VS Code TypeScript server if needed.
