import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <main className="min-h-screen bg-[#0f0f0f] text-[#e8e8e8] flex items-center justify-center p-6">
        <div className="max-w-sm rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-5 text-sm text-[#aaa]">
          Authentication is not configured yet.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-6">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </main>
  );
}
