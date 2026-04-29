import { NextRequest, NextResponse } from "next/server";
import { parseExampleTestcasesFromHTML } from "@/lib/leetcode";
import { submitJDoodleCode, JDOODLE_LANGS, buildPythonHarness } from "@/lib/jdoodle";

export async function POST(req: NextRequest) {
  try {
    const { code, language, problem } = await req.json();
    if (typeof code !== "string" || !code.trim()) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }
    if (typeof language !== "string" || !JDOODLE_LANGS[language]) {
      return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
    }
    if (!problem || typeof problem.content !== "string") {
      return NextResponse.json({ error: "Problem content is required" }, { status: 400 });
    }

    // LeetCode snippets for Java/C++ usually omit entrypoint; prevent misleading test failures.
    if (
      language === "java" &&
      !/\b(?:public\s+)?static\s+void\s+main\s*\(/.test(code)
    ) {
      return NextResponse.json(
        {
          error:
            "Java execution needs a full runnable program with main(). Use Python for LeetCode class-only snippets.",
        },
        { status: 400 }
      );
    }
    if (language === "cpp" && !/\bint\s+main\s*\(/.test(code)) {
      return NextResponse.json(
        {
          error:
            "C++ execution needs a full runnable program with main(). Use Python for LeetCode class-only snippets.",
        },
        { status: 400 }
      );
    }

    const exampleTestcases = parseExampleTestcasesFromHTML(problem.content ?? "");

    // Edge cases (fire and forget)
    let edgeCases: { input: string; expected: string }[] = [];
    try {
      const ecRes = await fetch(
        new URL("/api/edge-cases", req.url).toString(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            problem_description: problem.content,
            example_testcases: problem.exampleTestcases,
          }),
        }
      );
      const ecData = await ecRes.json();
      if (ecData.edgeCases) edgeCases = ecData.edgeCases.slice(0, 2);
    } catch {
      // optional
    }

    const allTests = [...exampleTestcases, ...edgeCases].slice(0, 8);

    if (allTests.length === 0) {
      return NextResponse.json({
        results: [
          {
            input: "N/A", expected: "N/A", actual: "Code submitted", status: "pass",
          },
        ],
      });
    }

    // Run tests with JDoodle
    const results = await Promise.all(
      allTests.map(async (test) => {
        try {
          // Wrap the code if it's Python
          const finalCode = language === "python3" ? buildPythonHarness(code, test.input) : code;

          const outcome = await submitJDoodleCode(finalCode, language as any, test.input);

          // JDoodle returns 200 statusCode for successful run *environment*, but compilation errors exist in output
          const output = (outcome.output || "").trim();
          
          const ERROR_PATTERNS = [
            "Compile Error",
            "SyntaxError",
            "Traceback (most recent call last)",
            "NameError:",
            "TypeError:",
            "ValueError:",
            "AttributeError:",
            "IndexError:",
            "KeyError:",
            "RuntimeError:",
            "ZeroDivisionError:",
            "error:",          // C++ / Java compile errors
            "Exception in thread",
            "Error:",
          ];
          const hasError = ERROR_PATTERNS.some((p) =>
            output.toLowerCase().includes(p.toLowerCase())
          );

          if (hasError) {
            const expectedValue = (test as any).expected ?? (test as any).output ?? "";
            return {
              input: test.input,
              expected: String(expectedValue).trim(),
              actual: output,
              status: "error" as const,
              error: output,
            };
          }

          const expectedValue = (test as any).expected ?? (test as any).output ?? "";
          const expected = String(expectedValue).trim();

          // Normalize for comparison: strip whitespace, handle Python bool/None casing
          const normalize = (s: string) =>
            s
              .replace(/\s+/g, "")
              .replace(/True/g, "true")
              .replace(/False/g, "false")
              .replace(/None/g, "null");

          const isPass = normalize(output) === normalize(expected);

          return {
            input: test.input,
            expected,
            actual: output,
            status: isPass ? ("pass" as const) : ("fail" as const),
          };
        } catch (err) {
          const expectedValue = (test as any).expected ?? (test as any).output ?? "";
          return {
            input: test.input,
            expected: String(expectedValue).trim(),
            actual: "",
            status: "error" as const,
            error: err instanceof Error ? err.message : "Execution failed",
          };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
