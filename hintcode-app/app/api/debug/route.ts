import { NextRequest, NextResponse } from "next/server";
import { askGemini, parseJSON } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { problem_description, user_code, language } = await req.json();

    const system = `You are a DSA debugging assistant. Analyze buggy code and give directional feedback only. NEVER provide the corrected or working code. Help the student understand what's wrong and point them in the right direction. Return ONLY valid JSON.`;

    const user = `Problem description (HTML):
${problem_description}

Student's ${language} code:
\`\`\`
${user_code}
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
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
