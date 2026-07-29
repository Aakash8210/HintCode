import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { listSubmissions } from "@/lib/submissions";

export async function GET() {
  try {
    const user = await getUserId();
    if ("error" in user) {
      return NextResponse.json({ error: user.error }, { status: user.status });
    }

    const data = await listSubmissions(user.userId);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load submissions";
    const status = message.includes("DATABASE_URL") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
