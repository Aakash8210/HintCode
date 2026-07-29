"use client";

import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { useStore } from "@/lib/store";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

function AuthControls() {
  if (!clerkEnabled) {
    return (
      <span className="hidden sm:inline text-xs text-[#666]">
        Auth setup needed
      </span>
    );
  }

  return <ClerkAuthControls />;
}

function ClerkAuthControls() {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return null;

  return (
    <div className="flex items-center gap-2">
      {isSignedIn ? (
        <UserButton />
      ) : (
        <>
          <SignInButton mode="modal">
            <button className="text-xs text-[#888] hover:text-[#ccc] transition-colors">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="text-xs px-3 py-1.5 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-colors">
              Sign up
            </button>
          </SignUpButton>
        </>
      )}
    </div>
  );
}

export default function Navbar() {
  const { problem, resetProblem } = useStore();

  return (
    <nav className="h-11 flex items-center justify-between px-4 border-b border-[#2a2a2a] bg-[#0f0f0f] flex-shrink-0 z-10">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center">
          <span className="text-black font-bold text-xs">H</span>
        </div>
        <span className="font-bold text-sm tracking-tight">
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
      <div className="flex items-center gap-2">
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
        <AuthControls />
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
      </div>
    </nav>
  );
}
