"use client";

import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

// Dynamic imports to avoid SSR issues with Monaco
import ProblemPanel from "@/components/ProblemPanel";
import HintPanel from "@/components/HintPanel";
import SolutionModal from "@/components/SolutionModal";

// ONLY CodeEditor needs to be dynamic to avoid Monaco's window dependency
const CodeEditor = dynamic(() => import("@/components/CodeEditor"), {
  ssr: false,
  loading: () => <PanelSkeleton label="Editor" />,
});

function PanelSkeleton({ label }: { label: string }) {
  return (
    <div className="h-full flex items-center justify-center bg-[#1a1a1a]">
      <div className="flex flex-col items-center gap-2 text-[#444]">
        <div className="w-8 h-8 border-2 border-[#333] border-t-amber-500 rounded-full animate-spin" />
        <span className="text-xs">{label}</span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex flex-col h-screen bg-[#0f0f0f] overflow-hidden">
      <Navbar />

      {/* 3-panel layout */}
      <div className="flex flex-1 overflow-hidden p-2 gap-2">
        <ResizablePanelGroup orientation="horizontal" className="h-full gap-2">
          {/* Left: Problem Panel */}
          <ResizablePanel
            defaultSize={33}
            minSize={26}
            className="min-w-[320px] rounded-xl overflow-hidden border border-[#2a2a2a] bg-[#1a1a1a]"
          >
            <ProblemPanel />
          </ResizablePanel>

          <ResizableHandle withHandle className="w-1.5 my-auto bg-[#2a2a2a] hover:bg-amber-500/40 transition-colors mx-0.5" />

          {/* Middle: Code Editor */}
          <ResizablePanel
            defaultSize={42}
            minSize={20}
            className="min-w-[360px] rounded-xl overflow-hidden border border-[#2a2a2a] bg-[#1a1a1a]"
          >
            <CodeEditor />
          </ResizablePanel>

          <ResizableHandle withHandle className="w-1.5 my-auto bg-[#2a2a2a] hover:bg-amber-500/40 transition-colors mx-0.5" />

          {/* Right: Hint Panel */}
          <ResizablePanel
            defaultSize={25}
            minSize={16}
            className="min-w-[260px] rounded-xl overflow-hidden border border-[#2a2a2a] bg-[#1a1a1a]"
          >
            <HintPanel />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Solution Modal (rendered at root level) */}
      <SolutionModal />
    </main>
  );
}
