import { NextRequest, NextResponse } from "next/server";
import { fetchProblemBySlug, fetchProblemByNumber } from "@/lib/leetcode";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }

    const trimmed = query.trim();
    let problem;

    // Check if query is a number
    if (/^\d+$/.test(trimmed)) {
      problem = await fetchProblemByNumber(parseInt(trimmed));
    } else {
      // Convert title to slug: "Two Sum" → "two-sum"
      const slug = trimmed
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      problem = await fetchProblemBySlug(slug);
    }

    return NextResponse.json({ problem });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
