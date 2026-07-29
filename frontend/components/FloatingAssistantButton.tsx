"use client";

import { motion } from "framer-motion";

interface FloatingAssistantButtonProps {
  onClick: () => void;
}

export default function FloatingAssistantButton({ onClick }: FloatingAssistantButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg hover:shadow-xl hover:bg-amber-400 transition-all z-50"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.3 }}
    >
      <span className="text-2xl">🤖</span>
    </motion.button>
  );
}
