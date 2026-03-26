import { z } from "zod";

export const generateProjectSubtasksSchema = z.object({
  title: z.string().trim().min(2).max(80),
  description: z.string().trim().min(5).max(500),
  techStack: z.array(z.string().trim().min(1)).max(20).default([]),
});

export type GenerateProjectSubtasksInput = z.infer<
  typeof generateProjectSubtasksSchema
>;
