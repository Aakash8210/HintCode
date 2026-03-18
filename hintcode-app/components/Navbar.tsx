"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";

export default function Navbar() {
  const { problem, resetProblem } = useStore();

  return (
    <nav className="h-12 flex items-center justify-between px-4 border-b border-[#2a2a2a] bg-[#0f0f0f] flex-shrink-0 z-10">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
          <span className="text-black font-bold text-sm">H</span>
        </div>
        <span className="font-bold text-lg tracking-tight">
          <span className="text-amber-500">Hint</span>
          <span className="text-white">Code</span>
        </span>
        {problem && (
          <span className="ml-3 text-xs text-[#666] hidden sm:block">
            — {problem.title}
          </span>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {problem && (
          <button
            onClick={() => {
              resetProblem();
              toast.info("Problem cleared");
            }}
            className="text-xs text-[#666] hover:text-[#999] transition-colors px-2 py-1 rounded"
          >
            Clear
          </button>
        )}
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#555] hover:text-amber-500 transition-colors"
        >
          GitHub
        </a>
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
      </div>
    </nav>
  );
}
