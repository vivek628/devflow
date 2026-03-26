import { GeminiGenerateContentResult } from "@/modules/ai/providers/gemini/gemini.types";

type GenerateGeminiJsonParams = {
  model: string;
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
  responseJsonSchema: Record<string, unknown>;
};

export async function generateGeminiJson({
  model,
  contents,
  responseJsonSchema,
}: GenerateGeminiJsonParams) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema,
        },
      }),
    },
  );

  const result = (await response.json()) as GeminiGenerateContentResult;

  if (!response.ok) {
    throw new Error(result.error?.message || "Gemini request failed");
  }

  return result;
}
