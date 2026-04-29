import { NextRequest, NextResponse } from "next/server";
import { askGemini, getGeminiErrorMeta, parseJSON } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { problem_description, user_code, language } = await req.json();
    if (
      typeof problem_description !== "string" ||
      !problem_description.trim() ||
      typeof language !== "string" ||
      !language.trim()
    ) {
      return NextResponse.json(
        { error: "problem_description and language are required" },
        { status: 400 }
      );
    }

    const system = `You are a DSA debugging assistant. Analyze buggy code and give directional feedback only. NEVER provide the corrected or working code. Help the student understand what's wrong and point them in the right direction. Return ONLY valid JSON.`;

    const user = `Problem description (HTML):
${problem_description}

Student's ${language} code:
\`\`\`
${typeof user_code === "string" ? user_code : ""}
\`\`\`

Analyze this code and return ONLY this JSON:
{
  "correct": "what the student got right (be specific and encouraging)",
  "issue": "what the bug or logical error is (be precise but don't give the fix)",
  "direction": "a directional nudge toward fixing it — ask a question or give a hint, never write the fixed code"
}`;

    const raw = await askGemini(system, user);
    const debug = parseJSON(raw);

    return NextResponse.json({ debug });
  } catch (error) {
    const { message, status, retryAfter } = getGeminiErrorMeta(error);
    const headers: Record<string, string> = {};
    if (status === 429 && retryAfter) headers["Retry-After"] = String(retryAfter);
    return NextResponse.json(
      status === 429 && retryAfter
        ? { error: message, retryAfter }
        : { error: message },
      { status: status ?? 500, headers }
    );
  }
}
