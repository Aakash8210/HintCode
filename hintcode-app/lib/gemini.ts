import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export interface GeminiErrorMeta {
  message: string;
  status?: number;
  retryAfter?: number;
}

export function getGeminiErrorMeta(error: unknown): GeminiErrorMeta {
  if (error instanceof SyntaxError) {
    return { message: "Invalid JSON body", status: 400 };
  }

  const errObj = error as Record<string, any> | undefined;
  const resp = errObj?.response?.data ?? errObj?.response ?? null;
  const message =
    resp?.error?.message ||
    (error instanceof Error ? error.message : "") ||
    "Unknown Gemini API error";
  const rawStatus = errObj?.response?.status ?? resp?.error?.status ?? errObj?.status;
  const status =
    typeof rawStatus === "number"
      ? rawStatus
      : rawStatus === "RESOURCE_EXHAUSTED"
        ? 429
        : undefined;

  let retryAfter: number | undefined;
  const details = resp?.error?.details || [];
  if (Array.isArray(details)) {
    for (const detail of details) {
      if (
        detail &&
        detail["@type"] === "type.googleapis.com/google.rpc.RetryInfo" &&
        detail.retryDelay
      ) {
        const match = String(detail.retryDelay).match(/([\d.]+)s/);
        if (match) retryAfter = Math.ceil(parseFloat(match[1]));
      }
    }
  }

  return { message, status, retryAfter };
}

export async function askGemini(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
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
  } catch (error: unknown) {
    console.error("Gemini API Error details:", error);
    const { message, status, retryAfter } = getGeminiErrorMeta(error);

    const err = new Error(message) as any;
    err.status = status;
    if (retryAfter) err.retryAfter = retryAfter;
    throw err;
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
