const JDOODLE_ENDPOINT = "https://api.jdoodle.com/v1/execute";

export const JDOODLE_LANGS: Record<string, { language: string; versionIndex: string }> = {
  python3: { language: "python3", versionIndex: "4" }, // Python 3.9.9
  java: { language: "java", versionIndex: "4" },       // JDK 17
  cpp: { language: "cpp", versionIndex: "5" },         // g++ 11
};

export interface JDoodleResponse {
  output: string;
  statusCode: number;
  memory: string;
  cpuTime: string;
  error?: string;
}

export async function submitJDoodleCode(
  script: string,
  langKey: "python3" | "java" | "cpp",
  stdin: string
): Promise<JDoodleResponse> {
  const langConfig = JDOODLE_LANGS[langKey];
  if (!langConfig) throw new Error(`Unsupported JDoodle language key: ${langKey}`);

  const payload = {
    clientId: process.env.JDOODLE_CLIENT_ID,
    clientSecret: process.env.JDOODLE_CLIENT_SECRET,
    script,
    language: langConfig.language,
    versionIndex: langConfig.versionIndex,
    stdin,
  };

  const res = await fetch(JDOODLE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  
  if (!res.ok || data.error) {
    throw new Error(data.error || `JDoodle execution failed: ${res.status}`);
  }

  return data as JDoodleResponse;
}

export function buildPythonHarness(userCode: string, _testInput: string): string {
  return `from typing import *
import ast
import collections
import itertools
import functools
import math
import sys

# User-provided Solution code
${userCode}

def main():
    raw = sys.stdin.read()
    lines = [L.strip() for L in raw.strip().split('\\n') if L.strip()]
    
    sol = Solution()
    
    # Identify which method to call
    methods = [m for m in dir(sol) if not m.startswith('_') and callable(getattr(sol, m))]
    if not methods:
        print("Error: No solution method found in Class Solution", file=sys.stderr)
        return
    
    # Prefer the first non-main method
    method_name = methods[0]
    for m in methods:
        if m != 'main':
            method_name = m
            break
            
    func = getattr(sol, method_name)
    
    def parse_input(line: str):
        try:
            return ast.literal_eval(line)
        except Exception:
            return line
    
    try:
        args = []
        for line in lines:
            line = line.strip()
            if not line: continue
            args.append(parse_input(line))
        
        result = func(*args)
        
        if result is None:
            print("null")
        elif isinstance(result, bool):
            print(str(result).lower())
        else:
            print(result)
            
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)

if __name__ == "__main__":
    main()
`;
}

export function buildBatchedPythonHarness(
  userCode: string,
  tests: { input: string; expected?: string; output?: string }[]
): string {
  return `from typing import *
import ast
import collections
import contextlib
import functools
import io
import itertools
import json
import math
import sys

${userCode}

TESTS = ${JSON.stringify(tests)}
RESULT_MARKER = "__HINTCODE_BATCH_RESULTS__"

def format_result(value):
    if value is None:
        return "null"
    if isinstance(value, bool):
        return str(value).lower()
    return str(value)

def parse_input(line: str):
    try:
        return ast.literal_eval(line)
    except Exception:
        return line

def find_method(sol):
    methods = [m for m in dir(sol) if not m.startswith("_") and callable(getattr(sol, m))]
    if not methods:
        raise Exception("No solution method found in Class Solution")
    for method_name in methods:
        if method_name != "main":
            return getattr(sol, method_name)
    return getattr(sol, methods[0])

def run_test(test):
    try:
        lines = [line.strip() for line in test.get("input", "").strip().split("\\n") if line.strip()]
        args = [parse_input(line) for line in lines]
        sol = Solution()
        func = find_method(sol)
        captured_stdout = io.StringIO()
        with contextlib.redirect_stdout(captured_stdout):
            result = func(*args)
        printed = captured_stdout.getvalue().strip()
        output = printed if result is None and printed else format_result(result)
        return {"actual": output, "error": None}
    except Exception as exc:
        return {"actual": "", "error": f"Error: {exc}"}

def main():
    results = [run_test(test) for test in TESTS]
    print(RESULT_MARKER)
    print(json.dumps(results))

if __name__ == "__main__":
    main()
`;
}
