"use client";

import { useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { motion } from "framer-motion";
import TestResultsTable from "./TestResultsTable";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.default),
  { ssr: false, loading: () => <EditorSkeleton /> }
);

function EditorSkeleton() {
  return (
    <div className="flex-1 bg-[#1e1e1e] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#333] border-t-amber-500 rounded-full animate-spin" />
    </div>
  );
}

const LANG_DISPLAY: Record<string, string> = {
  python3: "Python3",
  java: "Java",
  cpp: "C++",
};

const LANG_MONACO: Record<string, string> = {
  python3: "python",
  java: "java",
  cpp: "cpp",
};

const LANG_SNIPPET_KEY: Record<string, string> = {
  python3: "python3",
  java: "java",
  cpp: "cpp",
};

export default function CodeEditor() {
  const {
    problem,
    currentLang,
    setCurrentLang,
    userCode,
    setUserCode,
    isRunningCode,
    setIsRunningCode,
    setTestResults,
    testResults,
  } = useStore();

  // Auto-populate starter code when problem or lang changes
  useEffect(() => {
    if (!problem) return;
    const key = LANG_SNIPPET_KEY[currentLang];
    if (userCode[currentLang]) return; // Don't override if user already typed

    const snippet = problem.codeSnippets.find(
      (s) => s.langSlug === key
    );
    if (snippet) {
      setUserCode(currentLang, snippet.code);
    }
  }, [problem, currentLang]);

  const handleLangChange = (lang: "python3" | "java" | "cpp") => {
    setCurrentLang(lang);
    if (problem && !userCode[lang]) {
      const snippet = problem.codeSnippets.find(
        (s) => s.langSlug === LANG_SNIPPET_KEY[lang]
      );
      if (snippet) {
        setUserCode(lang, snippet.code);
      }
    }
  };

  const handleRunCode = useCallback(async () => {
    if (!problem) {
      toast.error("Load a problem first");
      return;
    }
    if (!userCode[currentLang].trim()) {
      toast.error("Write some code first");
      return;
    }

    setIsRunningCode(true);
    setTestResults(null);

    try {
      const res = await fetch("/api/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: userCode[currentLang],
          language: currentLang,
          problem: {
            title: problem.title,
            content: problem.content,
            exampleTestcases: problem.exampleTestcases,
            titleSlug: problem.titleSlug,
          },
        }),
      });
      const data = await res.json();
      if (data.results) {
        setTestResults(data.results);
        const passed = data.results.filter((r: { status: string }) => r.status === "pass").length;
        const total = data.results.length;
        if (passed === total) {
          toast.success(`All ${total} tests passed! 🎉`);
        } else {
          toast.error(`${passed}/${total} tests passed`);
        }
      } else {
        toast.error(data.error ?? "Execution failed");
      }
    } catch {
      toast.error("Failed to run code. Check your connection.");
    } finally {
      setIsRunningCode(false);
    }
  }, [problem, userCode, currentLang]);

  const handleReset = () => {
    if (!problem) return;
    const snippet = problem.codeSnippets.find(
      (s) => s.langSlug === LANG_SNIPPET_KEY[currentLang]
    );
    if (snippet) {
      setUserCode(currentLang, snippet.code);
      setTestResults(null);
      toast.info("Code reset to starter template");
    }
  };

  // Keyboard shortcut: Ctrl+Enter to run
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRunCode();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleRunCode]);

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a]">
      {/* Top bar: lang tabs + buttons */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2a2a] flex-shrink-0">
        {/* Language tabs */}
        <div className="flex items-center gap-1 bg-[#111] rounded-lg p-1">
          {(["python3", "java", "cpp"] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => handleLangChange(lang)}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                currentLang === lang
                  ? "bg-amber-500 text-black"
                  : "text-[#888] hover:text-[#ccc]"
              }`}
            >
              {LANG_DISPLAY[lang]}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            disabled={!problem}
            className="text-xs px-3 py-1.5 rounded-lg border border-[#333] text-[#888] hover:text-[#ccc] hover:border-[#444] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Reset
          </button>
          <button
            onClick={handleRunCode}
            disabled={isRunningCode || !problem}
            className="text-xs px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {isRunningCode ? (
              <>
                <span className="w-3 h-3 border border-black border-t-transparent rounded-full animate-spin" />
                Running...
              </>
            ) : (
              <>▶ Run Code</>
            )}
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0 relative">
        {!problem ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3 text-[#444]">
            <div className="text-3xl">⌨️</div>
            <p className="text-sm">Search a problem to start coding →</p>
          </div>
        ) : (
          <MonacoEditor
            height="100%"
            language={LANG_MONACO[currentLang]}
            theme="vs-dark"
            value={userCode[currentLang]}
            onChange={(v) => setUserCode(currentLang, v ?? "")}
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontLigatures: true,
              minimap: { enabled: false },
              scrollbar: { vertical: "auto", horizontal: "auto" },
              lineNumbers: "on",
              renderLineHighlight: "line",
              cursorBlinking: "smooth",
              smoothScrolling: true,
              padding: { top: 12, bottom: 12 },
              wordWrap: "on",
              tabSize: 4,
              automaticLayout: true,
            }}
          />
        )}
      </div>

      {/* Test Results */}
      {(testResults || isRunningCode) && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="border-t border-[#2a2a2a] max-h-56 overflow-y-auto flex-shrink-0"
        >
          <TestResultsTable results={testResults} loading={isRunningCode} />
        </motion.div>
      )}
    </div>
  );
}
