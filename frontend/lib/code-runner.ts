import { parseExampleTestcasesFromHTML } from "@/lib/leetcode";
import {
  buildBatchedPythonHarness,
  buildPythonHarness,
  JDOODLE_LANGS,
  submitJDoodleCode,
} from "@/lib/jdoodle";
import type { TestResult } from "@/lib/store";

export type SupportedLanguage = "python3" | "java" | "cpp";

export interface RunnerProblem {
  title?: string;
  titleSlug?: string;
  questionId?: string;
  content: string;
  exampleTestcases?: string;
}

interface RunProblemTestsOptions {
  code: string;
  language: string;
  problem: RunnerProblem;
  requestUrl: string;
  edgeCaseLimit?: number;
  maxTests?: number;
}

export function validateRunRequest(code: unknown, language: unknown, problem: unknown) {
  if (typeof code !== "string" || !code.trim()) {
    return "Code is required";
  }
  if (typeof language !== "string" || !JDOODLE_LANGS[language]) {
    return "Unsupported language";
  }
  if (!problem || typeof (problem as RunnerProblem).content !== "string") {
    return "Problem content is required";
  }
  if (
    language === "java" &&
    !/\b(?:public\s+)?static\s+void\s+main\s*\(/.test(code)
  ) {
    return "Java execution needs a full runnable program with main(). Use Python for LeetCode class-only snippets.";
  }
  if (language === "cpp" && !/\bint\s+main\s*\(/.test(code)) {
    return "C++ execution needs a full runnable program with main(). Use Python for LeetCode class-only snippets.";
  }
  return null;
}

const edgeCaseCache = new Map<string, any[]>();

async function fetchEdgeCases(
  problem: RunnerProblem,
  requestUrl: string,
  edgeCaseLimit?: number
) {
  const cacheKey = problem.titleSlug || problem.questionId || problem.title || "";
  if (cacheKey && edgeCaseCache.has(cacheKey)) {
    const cached = edgeCaseCache.get(cacheKey)!;
    return typeof edgeCaseLimit === "number" ? cached.slice(0, edgeCaseLimit) : cached;
  }

  try {
    const edgeCaseRes = await fetch(new URL("/api/edge-cases", requestUrl).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problem_description: problem.content,
        example_testcases: problem.exampleTestcases,
      }),
    });
    const data = await edgeCaseRes.json();
    const edgeCases = Array.isArray(data.edgeCases) ? data.edgeCases : [];
    if (cacheKey && edgeCases.length > 0) {
      edgeCaseCache.set(cacheKey, edgeCases);
    }
    return typeof edgeCaseLimit === "number"
      ? edgeCases.slice(0, edgeCaseLimit)
      : edgeCases;
  } catch {
    return [];
  }
}

function normalizeOutput(value: string) {
  return value
    .replace(/\s+/g, "")
    .replace(/True/g, "true")
    .replace(/False/g, "false")
    .replace(/None/g, "null");
}

function hasExecutionError(output: string) {
  const errorPatterns = [
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
    "error:",
    "Exception in thread",
    "Error:",
  ];
  return errorPatterns.some((pattern) =>
    output.toLowerCase().includes(pattern.toLowerCase())
  );
}

function toTestResult(
  test: { input: string; expected?: string; output?: string },
  actual: string,
  error?: string | null
): TestResult {
  const expected = String(test.expected ?? test.output ?? "").trim();

  if (error || hasExecutionError(actual)) {
    const message = error || actual;
    return {
      input: test.input,
      expected,
      actual,
      status: "error",
      error: message || "Execution failed",
    };
  }

  const passed = normalizeOutput(actual) === normalizeOutput(expected);
  return {
    input: test.input,
    expected,
    actual,
    status: passed ? "pass" : "fail",
  };
}

function parseBatchedPythonOutput(output: string) {
  const marker = "__HINTCODE_BATCH_RESULTS__";
  const markerIndex = output.lastIndexOf(marker);
  if (markerIndex === -1) {
    throw new Error(output.trim() || "Python batch execution did not return results");
  }

  const jsonText = output.slice(markerIndex + marker.length).trim();
  const firstLine = jsonText.split(/\r?\n/, 1)[0];
  const parsed = JSON.parse(firstLine);
  if (!Array.isArray(parsed)) {
    throw new Error("Python batch execution returned invalid results");
  }
  return parsed as { actual?: unknown; error?: unknown }[];
}

async function runPythonBatch(
  code: string,
  tests: { input: string; expected?: string; output?: string }[]
): Promise<TestResult[]> {
  try {
    const finalCode = buildBatchedPythonHarness(code, tests);
    const outcome = await submitJDoodleCode(finalCode, "python3", "");
    const results = parseBatchedPythonOutput(outcome.output || "");

    return tests.map((test, index) =>
      toTestResult(
        test,
        String(results[index]?.actual ?? "").trim(),
        typeof results[index]?.error === "string" ? results[index].error : null
      )
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Execution failed";
    return tests.map((test) => ({
      input: test.input,
      expected: String(test.expected ?? test.output ?? "").trim(),
      actual: "",
      status: "error",
      error: message,
    }));
  }
}

async function runSingleTest(
  code: string,
  language: SupportedLanguage,
  test: { input: string; expected?: string; output?: string }
): Promise<TestResult> {
  try {
    const finalCode = language === "python3" ? buildPythonHarness(code, test.input) : code;
    const outcome = await submitJDoodleCode(finalCode, language, test.input);
    const output = (outcome.output || "").trim();
    return toTestResult(test, output);
  } catch (error) {
    return {
      input: test.input,
      expected: String(test.expected ?? test.output ?? "").trim(),
      actual: "",
      status: "error",
      error: error instanceof Error ? error.message : "Execution failed",
    };
  }
}

export async function runProblemTests({
  code,
  language,
  problem,
  requestUrl,
  edgeCaseLimit,
  maxTests = 8,
}: RunProblemTestsOptions): Promise<TestResult[]> {
  const examples = parseExampleTestcasesFromHTML(problem.content);
  const edgeCases = await fetchEdgeCases(problem, requestUrl, edgeCaseLimit);
  const tests = [...examples, ...edgeCases].slice(0, maxTests);

  if (tests.length === 0) {
    return [
      {
        input: "N/A",
        expected: "N/A",
        actual: "Code submitted",
        status: "pass",
      },
    ];
  }

  if (language === "python3") {
    return runPythonBatch(code, tests);
  }

  return Promise.all(
    tests.map((test) => runSingleTest(code, language as SupportedLanguage, test))
  );
}
