import { NextRequest, NextResponse } from "next/server";
import { askGemini } from "@/lib/gemini";

const HINT_INSTRUCTIONS = [
  "Hint 1: Ask a pure conceptual question that makes them think about what the problem is really asking. Do NOT mention any data structures or algorithms.",
  "Hint 2: Guide them toward which data structure might help. Ask a question like 'What if you had a way to look up values instantly?'. Do NOT give the answer.",
  "Hint 3: Point them in the direction of the algorithm. Describe the high-level approach as a question. Do NOT write code.",
  "Hint 4: Give pseudocode-level guidance (in plain English steps, NOT actual code). Help them see the structure of the solution.",
  "Hint 5: Provide partial code with key logic replaced by blanks (use # TODO or ...). The student must fill in the blanks. Never complete the blanks for them.",
];

export async function POST(req: NextRequest) {
  try {
    const { problem_title, problem_description, hint_number, user_code } =
      await req.json();

    const hintIdx = Math.min(Math.max(1, hint_number), 5) - 1;

    const system = `You are a Socratic DSA tutor. NEVER give working code or direct answers. Guide with questions and gentle nudges only. Be concise — 3 to 6 lines maximum. Be encouraging and never condescending.
    
${HINT_INSTRUCTIONS[hintIdx]}`;

    const user = `Problem: ${problem_title}

Problem description (HTML):
${problem_description}

Student's current code:
${user_code || "(no code written yet)"}

Generate hint ${hint_number} following your system instructions exactly. Be concise and Socratic.`;

    const hint = await askGemini(system, user);

    return NextResponse.json({ hint: hint.trim() });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
