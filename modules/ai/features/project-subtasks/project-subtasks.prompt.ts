import { GenerateProjectSubtasksInput } from "@/modules/ai/features/project-subtasks/project-subtasks.schema";

export function buildProjectSubtasksPrompt(input: GenerateProjectSubtasksInput) {
  return [
    {
      parts: [
        {
          text:
            "You generate practical software project subtasks. Return concise subtasks that are realistic, implementation-focused, and useful for planning.",
        },
      ],
    },
    {
      parts: [
        {
          text: `Project title: ${input.title}
Project description: ${input.description}
Tech stack: ${input.techStack.join(", ") || "Not specified"}

Generate 5 to 8 subtasks for this project. Keep them implementation-oriented.`,
        },
      ],
    },
  ];
}

export const projectSubtasksResponseSchema = {
  type: "object",
  properties: {
    subtasks: {
      type: "array",
      minItems: 3,
      maxItems: 8,
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          priority: {
            type: "string",
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
          },
        },
        required: ["title", "description", "priority"],
        additionalProperties: false,
      },
    },
  },
  required: ["subtasks"],
  additionalProperties: false,
} as const;
