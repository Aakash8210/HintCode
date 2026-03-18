const JUDGE0_BASE = "https://judge0-ce.p.rapidapi.com";

const HEADERS = {
  "Content-Type": "application/json",
  "X-RapidAPI-Key": process.env.JUDGE0_API_KEY ?? "",
  "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
};

export const LANG_IDS: Record<string, number> = {
  python3: 71,
  java: 62,
  cpp: 54,
};

interface SubmitResult {
  token: string;
}

interface PollResult {
  status: {
    id: number;
    description: string;
  };
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  time: string | null;
  memory: number | null;
}

export async function submitCode(
  source_code: string,
  language_id: number,
  stdin: string
): Promise<string> {
  const res = await fetch(`${JUDGE0_BASE}/submissions?base64_encoded=false&wait=false`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ source_code, language_id, stdin }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Judge0 submit failed: ${res.status} ${text}`);
  }

  const data: SubmitResult = await res.json();
  return data.token;
}

export async function pollResult(token: string, maxAttempts = 10): Promise<PollResult> {
  let delay = 500;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(delay * 1.5, 3000);

    const res = await fetch(
      `${JUDGE0_BASE}/submissions/${token}?base64_encoded=false&fields=status,stdout,stderr,compile_output,time,memory`,
      { headers: HEADERS }
    );

    if (!res.ok) continue;

    const data: PollResult = await res.json();

    // Status 1 = In Queue, 2 = Processing
    if (data.status.id > 2) {
      return data;
    }
  }

  throw new Error("Execution timed out");
}

export function buildPythonHarness(userCode: string, testInput: string): string {
  return `${userCode}

import sys

def main():
    input_data = """${testInput.replace(/"/g, '\\"')}"""
    lines = input_data.strip().split('\\n')
    
    sol = Solution()
    
    try:
        args = [eval(line) for line in lines]
        import inspect
        methods = [m for m in dir(sol) if not m.startswith('_')]
        if set(methods) - {"main"}:
            method_name = list(set(methods) - {"main"})[0]
            result = getattr(sol, method_name)(*args)
            print(result)
        else:
            print("Implementation not found")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)

main()
`;
}

