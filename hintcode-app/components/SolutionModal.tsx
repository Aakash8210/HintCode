"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.default),
  { ssr: false }
);

interface Approach {
  name: string;
  explanation: string;
  time_complexity: string;
  space_complexity: string;
  code: string;
}

const LANG_MONACO: Record<string, string> = {
  python3: "python",
  java: "java",
  cpp: "cpp",
};

export default function SolutionModal() {
  const { showSolutionModal, setShowSolutionModal, problem, hints, currentLang } = useStore();
  const [confirmed, setConfirmed] = useState(false);
  const [approaches, setApproaches] = useState<Approach[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!showSolutionModal) {
      setConfirmed(false);
      setApproaches([]);
      setSelectedTab(0);
    }
  }, [showSolutionModal]);

  const handleConfirm = async () => {
    setConfirmed(true);
    setLoading(true);
    try {
      const res = await fetch("/api/solution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem_description: problem?.content,
          language: currentLang,
        }),
      });
      const data = await res.json();
      if (data.approaches) {
        setApproaches(data.approaches);
      } else {
        toast.error(data.error ?? "Failed to load solution");
        setShowSolutionModal(false);
      }
    } catch {
      toast.error("Failed to load solution");
      setShowSolutionModal(false);
    } finally {
      setLoading(false);
    }
  };

  if (!showSolutionModal || !problem) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) setShowSolutionModal(false);
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a] flex-shrink-0">
            <div>
              <h2 className="font-bold text-white text-lg">Full Solution</h2>
              <p className="text-xs text-[#666]">{problem.title}</p>
            </div>
            <button
              onClick={() => setShowSolutionModal(false)}
              className="text-[#666] hover:text-white transition-colors text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#2a2a2a]"
            >
              ×
            </button>
          </div>

          {!confirmed ? (
            /* Confirmation prompt */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-6">
              <div className="text-5xl">⚠️</div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Are you sure?
                </h3>
                <p className="text-[#888] text-sm leading-relaxed max-w-sm">
                  Seeing the full solution reduces the learning benefit.
                  {hints.length > 0
                    ? ` You've only used ${hints.filter(h => h.number !== -1).length} out of 5 hints.`
                    : " You haven't requested any hints yet."}
                  <br /><br />
                  <span className="text-amber-500/80">
                    Try getting more hints first — the "aha" moment is worth it!
                  </span>
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSolutionModal(false)}
                  className="px-6 py-2.5 rounded-xl border border-[#333] text-[#888] hover:text-white hover:border-[#444] transition-colors font-medium text-sm"
                >
                  Keep Trying
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-6 py-2.5 rounded-xl bg-red-500/80 hover:bg-red-500 text-white font-medium text-sm transition-colors"
                >
                  Show Solution
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="flex-1 flex items-center justify-center gap-3">
              <span className="w-6 h-6 border-2 border-[#333] border-t-amber-500 rounded-full animate-spin" />
              <p className="text-[#666] text-sm">Generating solutions...</p>
            </div>
          ) : (
            /* Solution tabs */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Tabs */}
              <div className="flex gap-1 px-6 pt-4 pb-0 flex-shrink-0">
                {approaches.map((a, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedTab(i)}
                    className={`text-sm px-4 py-2 rounded-t-lg font-medium transition-colors border-b-2 ${selectedTab === i
                      ? "text-amber-500 border-amber-500 bg-amber-500/5"
                      : "text-[#666] border-transparent hover:text-[#999]"
                      }`}
                  >
                    {a.name}
                  </button>
                ))}
              </div>
              <div className="border-t border-[#2a2a2a] flex-shrink-0" />

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto p-6">
                {approaches[selectedTab] && (
                  <motion.div
                    key={selectedTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <p className="text-[#ccc] text-sm leading-relaxed">
                      {approaches[selectedTab].explanation}
                    </p>

                    {/* Complexity badges */}
                    <div className="flex gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5">
                        <span className="text-xs text-blue-400 font-medium">⏱ Time</span>
                        <span className="text-xs font-mono text-blue-300">
                          {approaches[selectedTab].time_complexity}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-1.5">
                        <span className="text-xs text-purple-400 font-medium">💾 Space</span>
                        <span className="text-xs font-mono text-purple-300">
                          {approaches[selectedTab].space_complexity}
                        </span>
                      </div>
                    </div>

                    {/* Code block */}
                    <div className="rounded-xl overflow-hidden border border-[#2a2a2a]">
                      <div className="bg-[#111] px-4 py-2 flex items-center justify-between border-b border-[#2a2a2a]">
                        <span className="text-xs text-[#666]">Solution Code</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(approaches[selectedTab].code);
                            toast.success("Code copied!");
                          }}
                          className="text-xs text-[#555] hover:text-amber-500 transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                      <MonacoEditor
                        height="300px"
                        language={LANG_MONACO[currentLang]}
                        theme="vs-dark"
                        value={approaches[selectedTab].code}
                        options={{
                          readOnly: true,
                          fontSize: 13,
                          fontFamily: "'JetBrains Mono', monospace",
                          minimap: { enabled: false },
                          scrollbar: { vertical: "auto" },
                          lineNumbers: "on",
                          padding: { top: 12, bottom: 12 },
                          automaticLayout: true,
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
