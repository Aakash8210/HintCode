const PISTON_EXECUTE = "https://emkc.org/api/v2/piston/execute";

export const PISTON_LANGS: Record<string, { language: string; version: string; filename: string }> = {
  python3: { language: "python", version: "*", filename: "main.py" },
  java: { language: "java", version: "*", filename: "Main.java" },
  cpp: { language: "c++", version: "*", filename: "main.cpp" },
};

interface PistonRunResponse {
  language: string;
  version: string;
  run: {
    stdout: string;
    stderr: string;
    output: string;
    code: number;
    signal: string | null;
  };
  compile?: {
    stdout: string;
    stderr: string;
    output: string;
    code: number;
    signal: string | null;
  };
}

export async function submitPistonCode(
  source_code: string,
  langKey: "python3" | "java" | "cpp",
  stdin: string
): Promise<PistonRunResponse> {
  const langConfig = PISTON_LANGS[langKey];
  if (!langConfig) throw new Error(`Unsupported Piston language key: ${langKey}`);

  const payload = {
    language: langConfig.language,
    version: langConfig.version,
    files: [
      {
        name: langConfig.filename,
        content: source_code,
      },
    ],
    stdin,
  };

  const res = await fetch(PISTON_EXECUTE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Piston execute failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<PistonRunResponse>;
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
