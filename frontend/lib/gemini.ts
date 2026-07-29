const DEFAULT_MODELS = [
  "gemini-flash-lite-latest",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3-flash-preview",
];
const REQUEST_TIMEOUT_MS = 12000;

function getModelCandidates() {
  const configuredModels = process.env.GEMINI_MODEL || process.env.GEMINI_MODELS;
  const models = configuredModels
    ? configuredModels
        .split(",")
        .map((model) => model.trim())
        .filter(Boolean)
    : DEFAULT_MODELS;

  return [...new Set(models)];
}

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
  let rawMessage =
    resp?.error?.message ||
    (error instanceof Error ? error.message : "") ||
    "Unknown Gemini API error";

  const rawStatus = errObj?.response?.status ?? resp?.error?.status ?? errObj?.status;
  let status =
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

  // Format Quota / Rate limit (429) errors into user-friendly messages
  if (
    status === 429 ||
    rawMessage.includes("RESOURCE_EXHAUSTED") ||
    rawMessage.includes("Quota exceeded") ||
    rawMessage.includes("rate-limits")
  ) {
    status = 429;
    const timeMatch = rawMessage.match(/retry in ([\d.]+)s/i);
    if (timeMatch && !retryAfter) {
      retryAfter = Math.ceil(parseFloat(timeMatch[1]));
    }
    const waitInfo = retryAfter ? ` Please retry in ${retryAfter} seconds.` : " Please try again in a moment.";
    rawMessage = `API rate limit reached.${waitInfo}`;
  }

  return { message: rawMessage, status, retryAfter };
}

/**
 * Single-call Gemini request — NO fallback loop.
 * Uses one model, one request. Fails fast on 429/quota errors.
 */
export async function askGemini(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    const err = new Error("GEMINI_API_KEY is not configured in .env.local") as any;
    err.status = 500;
    throw err;
  }

  const models = getModelCandidates();
  let lastError: unknown;

  for (const model of models) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            contents: [
              {
                role: "user",
                parts: [{ text: userPrompt }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
            },
          }),
          signal: controller.signal,
        },
      );
      const data = await response.json();

      if (!response.ok || data.error) {
        const err = new Error(data.error?.message || `Gemini request failed: ${response.status}`) as any;
        err.status = response.status;
        err.response = { status: response.status, data };
        throw err;
      }

      const text = data.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text || "")
        .join("")
        .trim();
      if (!text) {
        console.error("Gemini Response Error: Empty text", data);
        throw new Error("Unexpected empty response from Gemini");
      }

      return text;
    } catch (error: unknown) {
      lastError = error;
      console.error(`Gemini API Error (${model}):`, error);

      if ((error as { name?: string })?.name === "AbortError") continue;

      const { status } = getGeminiErrorMeta(error);
      if (status !== 429 && status !== 404 && status !== 503) break;
    } finally {
      clearTimeout(timeout);
    }
  }

  const { message, status, retryAfter } = getGeminiErrorMeta(lastError);
  const err = new Error(message) as any;
  err.status = status;
  if (retryAfter) err.retryAfter = retryAfter;
  throw err;
}

export function parseJSON<T>(raw: string): T {
  // Strip markdown code fences if present
  const stripped = raw
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();
  return JSON.parse(stripped) as T;
}
