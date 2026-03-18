import { create } from "zustand";

export interface Problem {
  questionId: string;
  title: string;
  titleSlug: string;
  content: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topicTags: { name: string }[];
  codeSnippets: { lang: string; langSlug: string; code: string }[];
  exampleTestcases: string;
  acRate: number;
  stats: string;
}

export interface TestResult {
  input: string;
  expected: string;
  actual: string;
  status: "pass" | "fail" | "error";
  error?: string;
}

export interface Hint {
  number: number;
  content: string;
}

export interface Breakdown {
  plain_english: string;
  input_explained: string;
  output_explained: string;
  key_insight: string;
  pattern: string;
}

interface HintCodeStore {
  // Problem
  problem: Problem | null;
  setProblem: (p: Problem | null) => void;
  isLoadingProblem: boolean;
  setIsLoadingProblem: (v: boolean) => void;

  // Code Editor
  currentLang: "python3" | "java" | "cpp";
  setCurrentLang: (l: "python3" | "java" | "cpp") => void;
  userCode: { python3: string; java: string; cpp: string };
  setUserCode: (lang: "python3" | "java" | "cpp", code: string) => void;

  // Hints
  hints: Hint[];
  addHint: (h: Hint) => void;
  isLoadingHint: boolean;
  setIsLoadingHint: (v: boolean) => void;

  // Breakdown
  breakdown: Breakdown | null;
  setBreakdown: (b: Breakdown | null) => void;
  isLoadingBreakdown: boolean;
  setIsLoadingBreakdown: (v: boolean) => void;

  // Test results
  testResults: TestResult[] | null;
  setTestResults: (r: TestResult[] | null) => void;
  isRunningCode: boolean;
  setIsRunningCode: (v: boolean) => void;

  // Solution modal
  showSolutionModal: boolean;
  setShowSolutionModal: (v: boolean) => void;

  // Reset
  resetProblem: () => void;
}

export const useStore = create<HintCodeStore>((set) => ({
  problem: null,
  setProblem: (p) => set({ problem: p }),
  isLoadingProblem: false,
  setIsLoadingProblem: (v) => set({ isLoadingProblem: v }),

  currentLang: "python3",
  setCurrentLang: (l) => set({ currentLang: l }),
  userCode: { python3: "", java: "", cpp: "" },
  setUserCode: (lang, code) =>
    set((s) => ({ userCode: { ...s.userCode, [lang]: code } })),

  hints: [],
  addHint: (h) => set((s) => ({ hints: [...s.hints, h] })),
  isLoadingHint: false,
  setIsLoadingHint: (v) => set({ isLoadingHint: v }),

  breakdown: null,
  setBreakdown: (b) => set({ breakdown: b }),
  isLoadingBreakdown: false,
  setIsLoadingBreakdown: (v) => set({ isLoadingBreakdown: v }),

  testResults: null,
  setTestResults: (r) => set({ testResults: r }),
  isRunningCode: false,
  setIsRunningCode: (v) => set({ isRunningCode: v }),

  showSolutionModal: false,
  setShowSolutionModal: (v) => set({ showSolutionModal: v }),

  resetProblem: () =>
    set({
      problem: null,
      userCode: { python3: "", java: "", cpp: "" },
      hints: [],
      breakdown: null,
      testResults: null,
      showSolutionModal: false,
    }),
}));
