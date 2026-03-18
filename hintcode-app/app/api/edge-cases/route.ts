import { NextRequest, NextResponse } from "next/server";
import { askGemini, parseJSON } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { problem_description, example_testcases } = await req.json();

    const system = `You are a DSA expert specializing in edge cases. Generate test cases that expose common bugs and corner cases. Return ONLY valid JSON.`;

    const user = `Problem description (HTML):
${problem_description}

Existing example test cases:
${example_testcases}

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
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
