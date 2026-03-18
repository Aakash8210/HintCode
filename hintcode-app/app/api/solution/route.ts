import { NextRequest, NextResponse } from "next/server";
import { askGemini, parseJSON } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { problem_description, language } = await req.json();

    const langDisplay: Record<string, string> = {
      python3: "Python 3",
      java: "Java",
      cpp: "C++",
    };
    const lang = langDisplay[language] ?? language;

    const system = `You are an expert DSA engineer and educator. Explain 2-3 solution approaches from brute force to optimal. Always include full, correct, runnable code. Return ONLY valid JSON, no markdown outside the JSON.`;

    const user = `Problem description (HTML):
${problem_description}

Language: ${lang}

Return a JSON array of 2-3 solution approaches, ordered from brute force to optimal:
[
  {
    "name": "approach name, e.g. 'Brute Force' or 'Hash Map' or 'Two Pointers'",
    "explanation": "clear explanation of the approach in 2-4 sentences",
    "time_complexity": "e.g. O(n²)",
    "space_complexity": "e.g. O(1)",
    "code": "complete, runnable ${lang} code as a string (use \\n for newlines)"
  }
]

Return ONLY the JSON array.`;

    const raw = await askGemini(system, user);
    const approaches = parseJSON(raw);

    return NextResponse.json({ approaches });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
