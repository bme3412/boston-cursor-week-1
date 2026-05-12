import { auth } from "@/auth";

/**
 * Get the authenticated user's GitHub handle from the session.
 * Returns null if not authenticated.
 */
export async function getSessionHandle(): Promise<string | null> {
  const session = await auth();
  return session?.user?.handle ?? null;
}
