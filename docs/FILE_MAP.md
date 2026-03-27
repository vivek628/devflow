# DevFlow File Map

This file is for quick answers when someone asks:

- where is login implemented?
- where is forgot password?
- what does this file do?
- where is database logic?

## Rule Of Thumb

### In `modules`

- `repository.ts` -> database access
- `schemas.ts` -> request validation
- `service.ts` -> business logic
- `email.ts` -> email-related logic

### In `app`

- `page.tsx` -> UI page
- `route.ts` -> API route
- `layout.tsx` -> shared layout wrapper

## Feature Map

### Authentication

Folder: [modules/auth/core](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/auth/core)

- [auth.repository.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/auth/core/auth.repository.ts): user lookup and persistence
- [auth.schemas.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/auth/core/auth.schemas.ts): login/signup validation
- [auth.service.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/auth/core/auth.service.ts): signup/login business flow

Routes:

- [login route](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/api/auth/login/route.ts)
- [signup route](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/api/auth/signup/route.ts)
- [logout route](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/api/auth/logout/route.ts)
- [session route](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/api/auth/session/route.ts)

Pages:

- [login page](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/(auth)/login/page.tsx)
- [signup page](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/(auth)/signup/page.tsx)

### Password Reset

Folder: [modules/auth/password-reset](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/auth/password-reset)

- [password-reset.repository.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/auth/password-reset/password-reset.repository.ts): password reset token reads/writes and cleanup
- [password-reset.schemas.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/auth/password-reset/password-reset.schemas.ts): forgot/verify/reset payload validation
- [password-reset.service.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/auth/password-reset/password-reset.service.ts): OTP generation, verification, limits, and password update rules
- [password-reset.email.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/auth/password-reset/password-reset.email.ts): Resend email content and delivery

Routes:

- [forgot-password route](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/api/auth/forgot-password/route.ts)
- [verify-reset-code route](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/api/auth/verify-reset-code/route.ts)
- [reset-password route](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/api/auth/reset-password/route.ts)

Pages:

- [forgot-password page](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/(auth)/forgot-password/page.tsx)
- [reset-password page](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/(auth)/reset-password/page.tsx)

### Projects

Folder: [modules/projects](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/projects)

- [projects.repository.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/projects/projects.repository.ts): project, subtask, and update database operations
- [projects.schemas.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/projects/projects.schemas.ts): project and subtask validation rules
- [projects.service.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/projects/projects.service.ts): project/subtask business logic and computed totals

Routes:

- [projects route](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/api/projects/route.ts)
- [project route](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/api/projects/[projectId]/route.ts)
- [subtasks route](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/api/projects/[projectId]/subtasks/route.ts)
- [subtask route](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/api/projects/[projectId]/subtasks/[subtaskId]/route.ts)
- [subtask updates route](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/api/projects/[projectId]/subtasks/[subtaskId]/updates/route.ts)

Pages:

- [dashboard page](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/dashboard/page.tsx)
- [project detail page](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/projects/[projectId]/page.tsx)

### AI Subtask Generation

Folder: [modules/ai/features/project-subtasks](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/ai/features/project-subtasks)

- [project-subtasks.prompt.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/ai/features/project-subtasks/project-subtasks.prompt.ts): Gemini prompt instructions
- [project-subtasks.schema.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/ai/features/project-subtasks/project-subtasks.schema.ts): expected AI output shape
- [project-subtasks.service.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/ai/features/project-subtasks/project-subtasks.service.ts): AI orchestration

Provider:

- [gemini.provider.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/modules/ai/providers/gemini/gemini.provider.ts): Gemini API integration

Route:

- [AI route](/abs/path/c:/Users/user/Desktop/devFlow/devflow/app/api/ai/project-subtasks/route.ts)

## Shared Infrastructure

- [schema.prisma](/abs/path/c:/Users/user/Desktop/devFlow/devflow/prisma/schema.prisma): database models and enums
- [prisma.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/lib/db/prisma.ts): Prisma client singleton
- [get-session-user.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/lib/auth/get-session-user.ts): resolve the current logged-in user from the session
- [session.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/lib/auth/session.ts): session token helpers
- [rate-limit.ts](/abs/path/c:/Users/user/Desktop/devFlow/devflow/lib/security/rate-limit.ts): request rate limiting

## If Someone Asks "Where Is X?"

- login/signup -> `modules/auth/core`
- forgot password -> `modules/auth/password-reset`
- project create/update/delete -> `modules/projects`
- subtask updates and time logs -> `modules/projects`
- AI-generated subtasks -> `modules/ai/features/project-subtasks`
- database schema -> `prisma/schema.prisma`
- frontend pages -> `app`
- API endpoints -> `app/api`
