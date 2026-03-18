"use client";

import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { parseProblemContent } from "@/lib/leetcode";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors: Record<string, string> = {
    Easy: "text-green-500 bg-green-500/10 border-green-500/20",
    Medium: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    Hard: "text-red-500 bg-red-500/10 border-red-500/20",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
        colors[difficulty] ?? "text-gray-400 bg-gray-500/10 border-gray-500/20"
      }`}
    >
      {difficulty}
    </span>
  );
}

function ProblemSkeleton() {
  return (
    <div className="p-4 space-y-3 animate-pulse">
      <div className="h-4 bg-[#2a2a2a] rounded w-1/4" />
      <div className="h-6 bg-[#2a2a2a] rounded w-3/4" />
      <div className="h-4 bg-[#2a2a2a] rounded w-1/2" />
      <div className="space-y-2 mt-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`h-3 bg-[#2a2a2a] rounded ${i % 3 === 2 ? "w-3/4" : "w-full"}`} />
        ))}
      </div>
    </div>
  );
}

export default function ProblemPanel() {
  const { problem, setProblem, isLoadingProblem, setIsLoadingProblem, setBreakdown, setIsLoadingBreakdown } =
    useStore();
  const [query, setQuery] = useState("");
  const [constraintsOpen, setConstraintsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setIsLoadingProblem(true);
    setBreakdown(null);
    try {
      const res = await fetch("/api/fetch-problem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error ?? "Problem not found");
        return;
      }

      setProblem(data.problem);
      toast.success(`Loaded: ${data.problem.title}`);

      // Auto-fetch breakdown
      fetchBreakdown(data.problem);
    } catch {
      toast.error("Failed to fetch problem. Check your connection.");
    } finally {
      setIsLoadingProblem(false);
    }
  };

  const fetchBreakdown = async (p: typeof problem) => {
    if (!p) return;
    setIsLoadingBreakdown(true);
    try {
      const res = await fetch("/api/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: p.title,
          description: p.content,
        }),
      });
      const data = await res.json();
      if (data.breakdown) {
        useStore.getState().setBreakdown(data.breakdown);
      }
    } catch {
      // non-critical, silently fail
    } finally {
      setIsLoadingBreakdown(false);
    }
  };

  // Extract constraints from content
  const getConstraints = (content: string) => {
    const match = content.match(/<p><strong>Constraints:<\/strong><\/p>([\s\S]*?)(?=<p><strong>|$)/i);
    if (match) return match[0];
    return null;
  };

  const renderContent = (content: string) => {
    const sanitized = parseProblemContent(content);
    // Remove constraints section from main content
    return sanitized.replace(/<p><strong>Constraints:<\/strong><\/p>[\s\S]*$/i, "");
  };

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a]">
      {/* Search bar */}
      <div className="p-3 border-b border-[#2a2a2a] flex-shrink-0">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder='Search by number "1" or title "two sum"'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoadingProblem}
            className="flex-1 bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-[#e8e8e8] placeholder-[#555] focus:outline-none focus:border-amber-500/60 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoadingProblem || !query.trim()}
            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {isLoadingProblem ? "..." : "Go"}
          </button>
        </form>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingProblem && <ProblemSkeleton />}

        {!isLoadingProblem && !problem && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-3">
            <div className="text-4xl">🔍</div>
            <p className="text-[#555] text-sm leading-relaxed">
              Search for a LeetCode problem to get started.
              <br />
              <span className="text-amber-500/70">Try "1" for Two Sum or "121" for Stock Prices</span>
            </p>
          </div>
        )}

        {!isLoadingProblem && problem && (
          <AnimatePresence mode="wait">
            <motion.div
              key={problem.titleSlug}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-4"
            >
              {/* Problem header */}
              <div className="mb-4">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs text-[#666] font-mono">#{problem.questionId}</span>
                  <DifficultyBadge difficulty={problem.difficulty} />
                  <span className="text-xs text-[#555] ml-auto">
                    {Number(problem.acRate).toFixed(1)}% accepted
                  </span>
                </div>
                <h1 className="text-lg font-bold text-[#e8e8e8] leading-tight">{problem.title}</h1>
                {/* Topic tags */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {problem.topicTags.slice(0, 5).map((tag) => (
                    <span
                      key={tag.name}
                      className="text-xs px-2 py-0.5 bg-[#252525] text-[#888] rounded border border-[#333]"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Problem description */}
              <div
                className="problem-content text-sm leading-relaxed text-[#ccc]"
                dangerouslySetInnerHTML={{
                  __html: renderContent(problem.content),
                }}
              />

              {/* Constraints (collapsible) */}
              {getConstraints(problem.content) && (
                <div className="mt-4 border border-[#2a2a2a] rounded-lg overflow-hidden">
                  <button
                    onClick={() => setConstraintsOpen(!constraintsOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-[#888] hover:text-[#aaa] hover:bg-[#222] transition-colors"
                  >
                    <span>Constraints</span>
                    <span className="text-[#555]">{constraintsOpen ? "▲" : "▼"}</span>
                  </button>
                  {constraintsOpen && (
                    <div
                      className="p-3 problem-content text-xs border-t border-[#2a2a2a]"
                      dangerouslySetInnerHTML={{
                        __html: parseProblemContent(getConstraints(problem.content) ?? ""),
                      }}
                    />
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
