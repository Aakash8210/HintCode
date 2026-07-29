"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

interface Submission {
  id: string;
  title: string;
  titleSlug: string;
  language: string;
  code: string;
  status: "accepted" | "wrong_answer";
  passedTests: number;
  totalTests: number;
  createdAt: string;
}

interface SubmissionStats {
  totalSubmissions: number;
  acceptedSubmissions: number;
  solvedQuestions: number;
}

interface Props {
  refreshKey: number;
}

export default function SubmissionHistory({ refreshKey }: Props) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<SubmissionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadSubmissions = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/submissions", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setSubmissions([]);
        setStats(null);
        setMessage(data.error ?? "Failed to load submissions");
        return;
      }
      setSubmissions(data.submissions ?? []);
      setStats(data.stats ?? null);
    } catch {
      setMessage("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [refreshKey]);

  return (
    <div className="border-t border-[#2a2a2a] bg-[#141414] flex-shrink-0">
      <div className="px-4 py-2 border-b border-[#2a2a2a] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-medium text-[#888]">Submissions</span>
          {stats && (
            <span className="text-xs text-[#555] truncate">
              {stats.solvedQuestions} solved - {stats.acceptedSubmissions}/{stats.totalSubmissions} accepted
            </span>
          )}
        </div>
        <button
          onClick={loadSubmissions}
          disabled={loading}
          className="size-7 rounded-lg border border-[#333] text-[#777] hover:text-amber-500 hover:border-amber-500/40 transition-colors disabled:opacity-40 flex items-center justify-center"
          aria-label="Refresh submissions"
          title="Refresh submissions"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {message ? (
        <div className="px-4 py-3 text-xs text-[#777]">{message}</div>
      ) : submissions.length === 0 ? (
        <div className="px-4 py-3 text-xs text-[#666]">
          Submit code to start tracking progress.
        </div>
      ) : (
        <div className="max-h-64 overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#555] border-b border-[#222]">
                <th className="px-4 py-1.5 text-left font-medium">Problem</th>
                <th className="px-4 py-1.5 text-left font-medium">Lang</th>
                <th className="px-4 py-1.5 text-left font-medium">Tests</th>
                <th className="px-4 py-1.5 text-left font-medium">Code</th>
                <th className="px-4 py-1.5 text-left font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => (
                <tr key={submission.id} className="border-b border-[#1f1f1f]">
                  <td className="px-4 py-2 min-w-[150px]">
                    <div className="font-medium text-[#ccc]">{submission.title}</div>
                    <div
                      className={
                        submission.status === "accepted"
                          ? "text-green-500"
                          : "text-red-400"
                      }
                    >
                      {submission.status === "accepted" ? "Accepted" : "Wrong Answer"}
                    </div>
                  </td>
                  <td className="px-4 py-2 font-mono text-[#999]">{submission.language}</td>
                  <td className="px-4 py-2 font-mono text-[#bbb]">
                    {submission.passedTests}/{submission.totalTests}
                  </td>
                  <td className="px-4 py-2 min-w-[260px] max-w-[420px]">
                    <pre className="max-h-16 overflow-auto whitespace-pre-wrap break-words rounded bg-[#101010] border border-[#242424] p-2 font-mono text-[11px] text-[#888]">
                      {submission.code}
                    </pre>
                  </td>
                  <td className="px-4 py-2 text-[#777] whitespace-nowrap">
                    {new Date(submission.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
