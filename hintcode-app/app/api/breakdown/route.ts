import { NextRequest, NextResponse } from "next/server";
import { askGemini, parseJSON } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { title, description } = await req.json();

    const system = `You are a DSA tutor. Explain this problem clearly for a CS student seeing it for the first time. Never reveal the solution approach. Return ONLY valid JSON, no markdown, no explanation outside the JSON.`;

    const user = `Problem Title: ${title}

Problem Description (HTML):
${description}

Return this exact JSON structure:
{
  "plain_english": "simple 2-3 sentence explanation of what the problem is asking",
  "input_explained": "what each input means with a concrete example",
  "output_explained": "what to return and why, with an example",
  "key_insight": "the core challenge without revealing the solution approach (no spoilers)",
  "pattern": "the algorithmic pattern, e.g. Hash Map / Two Pointers / Dynamic Programming"
}`;

    const raw = await askGemini(system, user);
    const breakdown = parseJSON(raw);

    return NextResponse.json({ breakdown });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
