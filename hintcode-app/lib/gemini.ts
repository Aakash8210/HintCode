import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function askGemini(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "models/gemini-flash-latest",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
      },
    });

    if (!response.text) {
      console.error("Gemini Response Error: Empty text", response);
      throw new Error("Unexpected empty response from Gemini");
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error details:", error);
    // Extract more useful error messages if available
    const errorMessage = error.response?.data?.error?.message || error.message || "Unknown Gemini API error";
    throw new Error(errorMessage);
  }
}

export function parseJSON<T>(raw: string): T {
  // Strip markdown code fences if present
  const stripped = raw
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();
  return JSON.parse(stripped) as T;
}
