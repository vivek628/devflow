import { z } from "zod";

export const projectStatusSchema = z.enum([
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
]);

export const subtaskStatusSchema = z.enum([
  "BACKLOG",
  "IN_PROGRESS",
  "REVIEW",
  "DONE",
]);

export const subtaskPrioritySchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

export const createProjectSchema = z.object({
  title: z.string().trim().min(2, "Project name must be at least 2 characters").max(80),
  description: z
    .string()
    .trim()
    .min(5, "Description must be at least 5 characters")
    .max(500),
  status: projectStatusSchema,
  techStack: z.array(z.string().trim().min(1)).max(20).default([]),
  repoUrl: z.string().trim().url("Enter a valid repository URL").optional(),
});

export const updateProjectSchema = createProjectSchema;

export const createSubtaskSchema = z.object({
  title: z.string().trim().min(2, "Subtask title is required").max(120),
  description: z
    .string()
    .trim()
    .min(5, "Description must be at least 5 characters")
    .max(500),
  status: subtaskStatusSchema,
  priority: subtaskPrioritySchema,
  dueDate: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
      message: "Enter a valid due date",
    }),
});

export const updateSubtaskSchema = createSubtaskSchema;

export const createSubtaskUpdateSchema = z.object({
  summary: z
    .string()
    .trim()
    .min(2, "Update summary is required")
    .max(500, "Update summary must be 500 characters or fewer"),
  timeLogMinutes: z.coerce
    .number()
    .int("Time log must be a whole number of minutes")
    .min(1, "Time log must be at least 1 minute")
    .max(1440, "Time log cannot exceed 1440 minutes"),
  loggedAt: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
      message: "Enter a valid logged date",
    }),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateSubtaskInput = z.infer<typeof createSubtaskSchema>;
export type UpdateSubtaskInput = z.infer<typeof updateSubtaskSchema>;
export type CreateSubtaskUpdateInput = z.infer<typeof createSubtaskUpdateSchema>;
