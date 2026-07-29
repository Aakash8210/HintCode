import { auth } from "@clerk/nextjs/server";

export function isClerkConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
  );
}

export async function getUserId() {
  if (!isClerkConfigured()) {
    return { error: "Authentication is not configured", status: 503 as const };
  }

  const { userId } = await auth();
  if (!userId) {
    return { error: "Sign in to submit and save progress", status: 401 as const };
  }

  return { userId };
}
