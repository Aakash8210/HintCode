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

${userCode}

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
            func = getattr(sol, method_name)
            
            # If the AI generated test case gave us exactly one dict, unpack it as kwargs
            if len(args) == 1 and isinstance(args[0], dict):
                result = func(**args[0])
            else:
                result = func(*args)
                
            print(result)
        else:
            print("Implementation not found")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)

main()
`;
}
