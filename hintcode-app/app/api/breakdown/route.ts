import { NextRequest, NextResponse } from "next/server";
import { askGemini, getGeminiErrorMeta, parseJSON } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { title, description } = await req.json();
    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      return NextResponse.json(
        { error: "title and description are required" },
        { status: 400 }
      );
    }

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
    let breakdown = parseJSON<any>(raw);
    
    // Normalize to strings to prevent React 'Objects are not valid as a React child' errors
    if (breakdown && typeof breakdown === 'object') {
      for (const key in breakdown) {
        if (typeof breakdown[key] !== 'string') {
          breakdown[key] = JSON.stringify(breakdown[key]);
        }
      }
    }

    return NextResponse.json({ breakdown });
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
