import { NextRequest, NextResponse } from "next/server";
import { askGemini, getGeminiErrorMeta, parseJSON } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { problem_description, example_testcases } = await req.json();
    if (
      typeof problem_description !== "string" ||
      !problem_description.trim()
    ) {
      return NextResponse.json(
        { error: "problem_description is required" },
        { status: 400 }
      );
    }

    const system = `You are a DSA expert specializing in edge cases. Generate test cases that expose common bugs and corner cases. Return ONLY valid JSON.`;

    const user = `Problem description (HTML):
${problem_description}

Existing example test cases:
${typeof example_testcases === "string" ? example_testcases : ""}

Generate 2-3 edge cases that are NOT covered by the examples above. Focus on:
- Empty inputs
- Single element inputs  
- Negative numbers
- Very large values
- Duplicate values
- Already sorted / all same values

Return ONLY this JSON array:
[
  { "input": "the input as a string", "expected": "the expected output as a string" },
  { "input": "...", "expected": "..." }
]`;

    const raw = await askGemini(system, user);
    const edgeCases = parseJSON(raw);

    return NextResponse.json({ edgeCases });
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
