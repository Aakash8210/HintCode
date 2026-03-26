"use client";

import { TestResult } from "@/lib/store";

interface Props {
  results: TestResult[] | null;
  loading: boolean;
}

export default function TestResultsTable({ results, loading }: Props) {
  if (loading) {
    return (
      <div className="p-4 flex items-center gap-3 bg-[#141414]">
        <span className="w-4 h-4 border-2 border-[#333] border-t-amber-500 rounded-full animate-spin flex-shrink-0" />
        <p className="text-xs text-[#666]">Running tests...</p>
      </div>
    );
  }

  if (!results || results.length === 0) return null;

  const errors = results.filter((r) => r.status === "error" && r.error);
  const passed = results.filter((r) => r.status === "pass").length;
  const total = results.length;

  return (
    <div className="bg-[#141414]">
      {/* Summary bar */}
      <div className="px-4 py-2 border-b border-[#2a2a2a] flex items-center justify-between">
        <span className="text-xs font-medium text-[#888]">Test Results</span>
        <span
          className={`text-xs font-semibold ${
            passed === total ? "text-green-500" : "text-red-400"
          }`}
        >
          {passed}/{total} passed
        </span>
      </div>

      {/* Compile/runtime errors */}
      {errors.length > 0 && (
        <div className="mx-3 mt-2 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
          {errors.map((e, i) => (
            <p key={i} className="text-xs text-red-400 font-mono leading-relaxed">
              {e.error}
            </p>
          ))}
        </div>
      )}

      {/* Results table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[#555] border-b border-[#222]">
              <th className="px-4 py-1.5 text-left font-medium">#</th>
              <th className="px-4 py-1.5 text-left font-medium">Input</th>
              <th className="px-4 py-1.5 text-left font-medium">Expected</th>
              <th className="px-4 py-1.5 text-left font-medium">Got</th>
              <th className="px-4 py-1.5 text-center font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr
                key={i}
                className={`border-b border-[#1a1a1a] ${
                  r.status === "pass"
                    ? "bg-green-500/5"
                    : r.status === "error"
                    ? "bg-red-500/5"
                    : "bg-red-500/10"
                }`}
              >
                <td className="px-4 py-2 text-[#555] font-mono">{i + 1}</td>
                <td className="px-4 py-2 font-mono text-[#999] whitespace-pre-wrap break-all min-w-[120px]">{r.input}</td>
                <td className="px-4 py-2 font-mono text-green-400">{r.expected}</td>
                <td className="px-4 py-2 font-mono text-[#ccc]">
                  {r.actual || (r.error ? "—" : "—")}
                </td>
                <td className="px-4 py-2 text-center">
                  {r.status === "pass" ? (
                    <span className="text-green-500">✅</span>
                  ) : r.status === "error" ? (
                    <span className="text-orange-400">⚠️</span>
                  ) : (
                    <span className="text-red-400">❌</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
