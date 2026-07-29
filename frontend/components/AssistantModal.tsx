"use client";

import { motion, AnimatePresence } from "framer-motion";
import HintPanel from "./HintPanel";
import { useEffect } from "react";

interface AssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AssistantModal({ isOpen, onClose }: AssistantModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Slide-in panel from right */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed right-0 top-0 h-screen w-full max-w-md bg-[#1a1a1a] border-l border-[#2a2a2a] z-40 flex flex-col shadow-2xl"
          >
            {/* Close button */}
            <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center justify-between flex-shrink-0">
              <span className="text-sm font-semibold text-[#999]">Assistant</span>
              <button
                onClick={onClose}
                className="text-2xl text-[#666] hover:text-[#999] transition-colors"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <HintPanel />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
