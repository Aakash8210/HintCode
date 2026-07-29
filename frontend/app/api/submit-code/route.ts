import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { runProblemTests, validateRunRequest } from "@/lib/code-runner";
import { createSubmission } from "@/lib/submissions";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserId();
    if ("error" in user) {
      return NextResponse.json({ error: user.error }, { status: user.status });
    }

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
      maxTests: 20,
    });

    let submission = null;
    try {
      submission = await createSubmission({
        userId: user.userId,
        questionId: problem.questionId,
        title: problem.title ?? "Untitled Problem",
        titleSlug: problem.titleSlug ?? "untitled-problem",
        language,
        code,
        results,
      });
    } catch (dbError) {
      console.warn("DB submission save skipped (DATABASE_URL not configured):", dbError);
    }

    return NextResponse.json({ results, submission });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Submission failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
