import { NextRequest, NextResponse } from "next/server";
import { runProblemTests, validateRunRequest } from "@/lib/code-runner";

export async function POST(req: NextRequest) {
  try {
    const { code, language, problem } = await req.json();
    const validationError = validateRunRequest(code, language, problem);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const results = await runProblemTests({
      code,
      language,
      problem,
      requestUrl: req.url,
      edgeCaseLimit: 2,
      maxTests: 8,
    });

    return NextResponse.json({ results });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
