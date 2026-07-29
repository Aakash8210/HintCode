"use client";

import { useStore } from "@/lib/store";
import { useHintCooldown } from "@/hooks/useHintCooldown";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export default function HintPanel() {
  const {
    problem,
    breakdown,
    isLoadingBreakdown,
    setBreakdown,
    setIsLoadingBreakdown,
    hints,
    isLoadingHint,
    addHint,
    setIsLoadingHint,
    userCode,
    currentLang,
    setShowSolutionModal,
  } = useStore();

  const cooldown = useHintCooldown(problem?.titleSlug);
  const [patternRevealed, setPatternRevealed] = useState(false);
  const [retrySeconds, setRetrySeconds] = useState<number>(0);

  // Filter hints to only include actual hints (not debug messages)
  const actualHints = hints.filter((h) => h.number !== -1);
  const debugMessages = hints.filter((h) => h.number === -1);

  // Reset pattern reveal when problem changes
  useEffect(() => {
    setPatternRevealed(false);
  }, [problem?.titleSlug]);

  // Retry countdown
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

  const handleGetHint = async (hintNumber: 1 | 2 | 3 | 4) => {
    if (!problem) {
      toast.error("Load a problem first");
      return;
    }

    // Check if this hint is unlocked
    const status = cooldown.getHintStatus(hintNumber);
    if (!status.isUnlocked) {
      toast.error("This hint is not unlocked yet");
      return;
    }

    // Check if we already have this hint
    if (actualHints.some((h) => h.number === hintNumber)) {
      toast.info(`You already have hint ${hintNumber}`);
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
          hint_number: hintNumber,
          user_code: userCode[currentLang] || "",
        }),
      });

      if (res.status === 429) {
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
        addHint({ number: hintNumber, content: data.hint });
        // Request cooldown for the next hint
        if (hintNumber < 4) {
          cooldown.requestHint(hintNumber as any);
        }
      } else {
        toast.error(data.error ?? "Failed to get hint");
      }
    } catch {
      toast.error("Failed to get hint");
    } finally {
      setIsLoadingHint(false);
    }
  };

  const fetchBreakdown = async () => {
    if (!problem || isLoadingBreakdown) return;
    setIsLoadingBreakdown(true);
    try {
      const res = await fetch("/api/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: problem.title,
          description: problem.content,
        }),
      });
      const data = await res.json();
      if (data.breakdown) {
        setBreakdown(data.breakdown);
      } else {
        toast.error(data.error ?? "Failed to load breakdown");
      }
    } catch {
      toast.error("Failed to load breakdown");
    } finally {
      setIsLoadingBreakdown(false);
    }
  };

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
          <span className="text-xl">🤖</span>
          <div>
            <h2 className="text-sm font-bold text-white">HintCode Assistant</h2>
            <p className="text-xs text-[#555]">Learn by exploring hints</p>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {!problem && (
          <div className="h-40 flex flex-col items-center justify-center text-center gap-2 text-[#444]">
            <span className="text-3xl">💡</span>
            <p className="text-xs">Load a problem to get hints</p>
          </div>
        )}

        {/* Breakdown Card */}
        {problem && !breakdown && !isLoadingBreakdown && (
          <button
            onClick={fetchBreakdown}
            className="w-full bg-[#111] rounded-lg p-3 text-left hover:bg-[#1a1a1a] transition-colors group border border-[#2a2a2a] hover:border-amber-500/40"
          >
            <span className="text-xs font-semibold text-[#666] group-hover:text-amber-500 uppercase tracking-wide">
              🧩 Problem Breakdown
            </span>
            <p className="text-xs text-[#555] mt-1">Plain English explanation</p>
          </button>
        )}

        {(isLoadingBreakdown || breakdown) && problem && (
          <div className="bg-[#111] rounded-lg p-3 space-y-2 border border-[#2a2a2a]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                Breakdown
              </span>
              {isLoadingBreakdown && (
                <span className="w-3 h-3 border border-[#333] border-t-amber-500 rounded-full animate-spin" />
              )}
            </div>

            {breakdown && (
              <>
                <div>
                  <p className="text-xs text-[#777] mb-1 uppercase tracking-wide font-semibold">In Plain English</p>
                  <p className="text-xs text-[#ccc] leading-relaxed">{breakdown.plain_english}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#1a1a1a] rounded p-2">
                    <p className="text-xs text-[#666] mb-1">📥 Input</p>
                    <p className="text-xs text-[#bbb] leading-relaxed">{breakdown.input_explained}</p>
                  </div>
                  <div className="bg-[#1a1a1a] rounded p-2">
                    <p className="text-xs text-[#666] mb-1">📤 Output</p>
                    <p className="text-xs text-[#bbb] leading-relaxed">{breakdown.output_explained}</p>
                  </div>
                </div>
                <div className="border-l-2 border-amber-500 pl-2">
                  <p className="text-xs text-[#666] mb-1 font-semibold">💡 Key Insight</p>
                  <p className="text-xs text-amber-400/80 italic leading-relaxed">{breakdown.key_insight}</p>
                </div>
                {/* Pattern */}
                <div>
                  <p className="text-xs text-[#666] mb-1 font-semibold">🎯 Pattern</p>
                  {patternRevealed ? (
                    <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-medium border border-amber-500/30 block">
                      {breakdown.pattern}
                    </span>
                  ) : (
                    <button
                      onClick={() => setPatternRevealed(true)}
                      className="text-xs flex items-center gap-1 bg-[#252525] border border-[#333] rounded px-1.5 py-0.5 text-[#666] hover:border-amber-500/40 transition-colors"
                    >
                      <span className="blur-sm select-none text-[10px]">{breakdown.pattern}</span>
                      <span className="text-amber-500 no-blur">👁</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* 4 Hint Cards with Cooldown */}
        {problem && (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((hintNum) => {
              const status = cooldown.getHintStatus(hintNum as any);
              const hasHint = actualHints.some((h) => h.number === hintNum);

              return (
                <motion.div
                  key={`hint-button-${hintNum}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`rounded-lg p-2.5 border transition-all ${
                    hasHint
                      ? "bg-green-500/10 border-green-500/30"
                      : status.isUnlocked
                        ? "bg-amber-500/10 border-amber-500/30 cursor-pointer hover:border-amber-500/60"
                        : "bg-[#111] border-[#2a2a2a] cursor-not-allowed opacity-50"
                  }`}
                >
                  <button
                    onClick={() => handleGetHint(hintNum as any)}
                    disabled={!status.isUnlocked || isLoadingHint || hasHint}
                    className="w-full text-left disabled:cursor-not-allowed transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {hasHint ? "✓" : status.isUnlocked ? "💡" : "🔒"}
                        </span>
                        <div>
                          <span className="text-xs font-semibold text-white">
                            Hint {hintNum}
                          </span>
                          {hasHint && (
                            <span className="text-xs text-green-500 ml-2">Revealed</span>
                          )}
                        </div>
                      </div>
                      {status.isOnCooldown && (
                        <span className="text-xs font-mono text-amber-500">
                          {String(Math.floor(status.countdown / 60)).padStart(2, "0")}:
                          {String(status.countdown % 60).padStart(2, "0")}
                        </span>
                      )}
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Actual hint content cards */}
        <AnimatePresence>
          {actualHints.map((hint, idx) => (
            <motion.div
              key={`hint-content-${hint.number}-${idx}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-green-500/5 border border-green-500/20 rounded-lg p-2.5"
            >
              <div className="text-xs text-[#ccc] leading-relaxed whitespace-pre-wrap">
                {hint.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Debug messages */}
        <AnimatePresence>
          {debugMessages.map((msg, idx) => (
            <motion.div
              key={`debug-${idx}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[#111] border border-[#2a2a2a] rounded-lg p-2.5"
            >
              <div className="text-xs text-[#ccc] leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading hint */}
        {isLoadingHint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[#111] border border-[#2a2a2a] rounded-lg p-2.5 flex items-center gap-2"
          >
            <span className="w-3 h-3 border-2 border-[#333] border-t-amber-500 rounded-full animate-spin flex-shrink-0" />
            <p className="text-xs text-[#666]">Generating hint...</p>
          </motion.div>
        )}
      </div>

      {/* Action bar */}
      <div className="border-t border-[#2a2a2a] p-2.5 space-y-2 flex-shrink-0">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleDebug}
            disabled={!problem}
            className="text-xs py-2 rounded-lg border border-[#333] text-[#888] hover:text-[#ccc] hover:border-[#444] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            🐛 Debug
          </button>
          <button
            onClick={() => setShowSolutionModal(true)}
            disabled={!problem}
            className="text-xs py-2 rounded-lg border border-red-500/20 text-red-500/70 hover:text-red-400 hover:border-red-500/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            📖 Solution
          </button>
        </div>
      </div>
    </div>
  );
}
