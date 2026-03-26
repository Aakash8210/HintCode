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

export function buildPythonHarness(userCode: string, testInput: string): string {
  return `from typing import *
import collections
import itertools
import functools
import math
import sys

# User-provided Solution code
${userCode}

def main():
    # Use triple-quoted string to handle newlines in testInput
    # Escape any existing triple quotes or backslashes
    input_str = r"""${testInput.replace(/\\/g, "\\\\").replace(/"""/g, '\\"\\"\\"') }"""
    lines = [L.strip() for L in input_str.strip().split('\\n') if L.strip()]
    
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
    
    try:
        # Prepare arguments
        args = []
        for line in lines:
            line = line.strip()
            if not line: continue
            
            # Simple heuristic: if line is not a literal but looks like assignment "k=v", 
            # we already tried to strip labels in JS but let's be double sure.
            # However, evaling is best for literals like [1,2,3] or 10
            try:
                args.append(eval(line))
            except:
                # If eval fails, maybe it's multiple values on one line? 
                # LeetCode sometimes does [1,2,3], 1
                try:
                    # try wrapping in tuple if it contains commas
                    args.extend(eval(f"({line},)"))
                except:
                    # fallback to raw line as string
                    args.append(line)
        
        result = func(*args)
        
        # Format result for comparison
        if result is None:
            print("null")
        elif isinstance(result, bool):
            print(str(result).lower())
        else:
            print(result)
            
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        import traceback
        # traceback.print_exc(file=sys.stderr)

if __name__ == "__main__":
    main()
`;
}
