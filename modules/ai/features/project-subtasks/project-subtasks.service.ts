import {
  buildProjectSubtasksPrompt,
  projectSubtasksResponseSchema,
} from "@/modules/ai/features/project-subtasks/project-subtasks.prompt";
import { GenerateProjectSubtasksInput } from "@/modules/ai/features/project-subtasks/project-subtasks.schema";
import { generateGeminiJson } from "@/modules/ai/providers/gemini/gemini.provider";

type GeneratedProjectSubtasksPayload = {
  subtasks?: {
    title: string;
    description: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  }[];
};

export async function generateProjectSubtasks(
  input: GenerateProjectSubtasksInput,
) {
  const model = process.env.GEMINI_PROJECT_MODEL || "gemini-3-flash-preview";
  const result = await generateGeminiJson({
    model,
    contents: buildProjectSubtasksPrompt(input),
    responseJsonSchema: projectSubtasksResponseSchema,
  });

  const rawText =
    result.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text || "{}";

  const parsedOutput = JSON.parse(rawText) as GeneratedProjectSubtasksPayload;

  return (parsedOutput.subtasks || []).map((subtask) => ({
    title: subtask.title.trim(),
    description: subtask.description.trim(),
    status: "BACKLOG" as const,
    priority: subtask.priority,
    dueDate: "",
  }));
}
