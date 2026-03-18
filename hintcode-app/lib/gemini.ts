import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function askGemini(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.2,
    },
  });

  if (!response.text) {
    throw new Error("Unexpected empty response from Gemini");
  }

  return response.text;
}

export function parseJSON<T>(raw: string): T {
  // Strip markdown code fences if present
  const stripped = raw
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();
  return JSON.parse(stripped) as T;
}
