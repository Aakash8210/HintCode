"use client";

import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export default function HintPanel() {
  const {
    problem,
    breakdown,
    isLoadingBreakdown,
    hints,
    isLoadingHint,
    addHint,
    setIsLoadingHint,
    userCode,
    currentLang,
    setShowSolutionModal,
  } = useStore();

  const [retrySeconds, setRetrySeconds] = useState<number>(0);

  const [patternRevealed, setPatternRevealed] = useState(false);
  const realHints = hints.filter((h) => h.number !== -1);
  const realHintCount = realHints.length;

  const handleNextHint = async () => {
    if (!problem) {
      toast.error("Load a problem first");
      return;
    }
    if (realHintCount >= 5) {
      toast.info("All 5 hints already revealed");
      return;
    }
    setIsLoadingHint(true);
    try {
      const res = await fetch("/api/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem_title: problem.title,
          problem_description: problem.content,
          hint_number: realHintCount + 1,
          user_code: userCode[currentLang] || "",
        }),
      });

      if (res.status === 429) {
        // Quota exceeded — read Retry-After header or body fallback
        const ra = res.headers.get("Retry-After");
        let secs = ra ? parseInt(ra, 10) : undefined;
        const body = await res.json().catch(() => ({}));
        secs = secs || body.retryAfter || body.retry_after || body.retrySeconds || 30;
        setRetrySeconds(Number(secs));
        toast.error(`Quota exceeded. Retry in ${secs}s`);
        return;
      }

      const data = await res.json();
      if (data.hint) {
        addHint({ number: realHintCount + 1, content: data.hint });
      } else {
        toast.error(data.error ?? "Failed to get hint");
      }
    } catch {
      toast.error("Failed to get hint");
    } finally {
      setIsLoadingHint(false);
    }
  };

  useEffect(() => {
    if (!retrySeconds) return;
    const t = setInterval(() => {
      setRetrySeconds((s) => {
        if (s <= 1) {
          clearInterval(t);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [retrySeconds]);

  useEffect(() => {
    setPatternRevealed(false);
  }, [problem?.titleSlug]);

  const handleDebug = async () => {
    if (!problem) {
      toast.error("Load a problem first");
      return;
    }
    const code = userCode[currentLang];
    if (!code?.trim()) {
      toast.error("Write some code first before debugging");
      return;
    }

    const debugToast = toast.loading("Analyzing your code...");
    try {
      const res = await fetch("/api/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem_description: problem.content,
          user_code: code,
          language: currentLang,
        }),
      });
      const data = await res.json();
      if (data.debug) {
        const d = data.debug;
        toast.dismiss(debugToast);
        // Add as a special hint-like message
        addHint({
          number: -1, // special marker for debug
          content: `🐛 **Debug Analysis**\n\n✅ **What's right:** ${d.correct}\n\n❌ **Issue:** ${d.issue}\n\n💡 **Direction:** ${d.direction}`,
        });
      } else {
        toast.dismiss(debugToast);
        toast.error(data.error ?? "Debug failed");
      }
    } catch {
      toast.dismiss(debugToast);
      toast.error("Debug request failed");
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#2a2a2a] flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <div>
            <h2 className="text-sm font-bold text-white">HintCode Assistant</h2>
            <p className="text-xs text-[#555]">Socratic learning, never spoilers</p>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {!problem && (
          <div className="h-40 flex flex-col items-center justify-center text-center gap-2 text-[#444]">
            <span className="text-3xl">💡</span>
            <p className="text-xs">Load a problem to get AI-powered hints</p>
          </div>
        )}

        {/* Breakdown Card */}
        {(isLoadingBreakdown || breakdown) && problem && (
          <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                Problem Breakdown
              </span>
              {isLoadingBreakdown && (
                <span className="w-3 h-3 border border-[#333] border-t-amber-500 rounded-full animate-spin" />
              )}
            </div>

            {breakdown && (
              <>
                <div>
                  <p className="text-xs text-[#777] mb-1 uppercase tracking-wide">In plain English</p>
                  <p className="text-sm text-[#ccc] leading-relaxed">{breakdown.plain_english}</p>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="bg-[#1a1a1a] rounded-lg p-2.5">
                    <p className="text-xs text-[#666] mb-1">📥 Input</p>
                    <p className="text-xs text-[#bbb] leading-relaxed">{breakdown.input_explained}</p>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-lg p-2.5">
                    <p className="text-xs text-[#666] mb-1">📤 Output</p>
                    <p className="text-xs text-[#bbb] leading-relaxed">{breakdown.output_explained}</p>
                  </div>
                </div>
                <div className="border-l-2 border-amber-500 pl-3">
                  <p className="text-xs text-[#666] mb-1">Key Insight</p>
                  <p className="text-xs text-amber-400/80 italic leading-relaxed">{breakdown.key_insight}</p>
                </div>
                {/* Pattern — blurred */}
                <div>
                  <p className="text-xs text-[#666] mb-1">Pattern</p>
                  {patternRevealed ? (
                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded font-medium border border-amber-500/30">
                      {breakdown.pattern}
                    </span>
                  ) : (
                    <button
                      onClick={() => setPatternRevealed(true)}
                      className="text-xs flex items-center gap-1.5 bg-[#252525] border border-[#333] rounded px-2 py-1 text-[#666] hover:border-amber-500/40 transition-colors"
                    >
                      <span className="blur-sm select-none">{breakdown.pattern}</span>
                      <span className="text-amber-500 no-blur ml-1">👁 Reveal</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Hint cards */}
        <AnimatePresence>
          {hints.map((hint, idx) => (
            <motion.div
              key={`hint-${hint.number}-${idx}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-[#111] border border-[#2a2a2a] rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-amber-500 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  {hint.number === -1 ? "Debug" : `Hint ${hint.number}`}
                </span>
              </div>
              <div className="text-sm text-[#ccc] leading-relaxed whitespace-pre-wrap">
                {hint.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading hint */}
        {isLoadingHint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[#111] border border-[#2a2a2a] rounded-xl p-4 flex items-center gap-3"
          >
            <span className="w-4 h-4 border-2 border-[#333] border-t-amber-500 rounded-full animate-spin flex-shrink-0" />
            <p className="text-sm text-[#666]">Generating hint...</p>
          </motion.div>
        )}

        {realHintCount >= 5 && (
          <div className="text-center py-3">
            <p className="text-xs text-[#555]">
              All 5 hints revealed. Try coding it or view the full solution.
            </p>
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="border-t border-[#2a2a2a] p-3 space-y-2 flex-shrink-0">
        <button
          onClick={handleNextHint}
          disabled={!problem || isLoadingHint || realHintCount >= 5 || retrySeconds > 0}
          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoadingHint ? (
            <>
              <span className="w-3 h-3 border border-black border-t-transparent rounded-full animate-spin" />
              Thinking...
            </>
          ) : retrySeconds > 0 ? (
            <>⏳ Retry in {retrySeconds}s</>
          ) : (
            <>💡 {realHintCount === 0 ? "Get First Hint" : `Next Hint (${realHintCount}/5)`}</>
          )}
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleDebug}
            disabled={!problem}
            className="text-sm py-2 rounded-lg border border-[#333] text-[#888] hover:text-[#ccc] hover:border-[#444] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            🐛 Debug
          </button>
          <button
            onClick={() => setShowSolutionModal(true)}
            disabled={!problem}
            className="text-sm py-2 rounded-lg border border-red-500/20 text-red-500/70 hover:text-red-400 hover:border-red-500/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            📖 Solution
          </button>
        </div>
      </div>
    </div>
  );
}
