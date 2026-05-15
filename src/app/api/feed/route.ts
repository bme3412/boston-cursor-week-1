import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getCohort,
  getFeed,
  getFeedCommentCounts,
  getFeedPosts,
  saveFeed,
} from "@/lib/data";
import { getSessionHandle } from "@/lib/auth";
import type { FeedPost } from "@/lib/types";

const FeedPostBody = z.object({
  text: z.string().min(1).max(500),
  link: z.string().url().optional(),
});

// Rate limits per author. Backed by post timestamps in the feed itself, so this
// holds across serverless instances without needing an external store.
const RATE_LIMIT_BURST_MS = 10_000; // min gap between posts
const RATE_LIMIT_DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;
const RATE_LIMIT_DAILY_MAX = 20;

function checkRateLimit(
  authorPosts: FeedPost[],
  now: number
): { error: string; retryAfterSec: number } | null {
  const authorTimes = authorPosts
    .map((p) => new Date(p.createdAt).getTime())
    .sort((a, b) => b - a);

  const latest = authorTimes[0];
  if (latest && now - latest < RATE_LIMIT_BURST_MS) {
    const retryAfterSec = Math.ceil(
      (RATE_LIMIT_BURST_MS - (now - latest)) / 1000
    );
    return {
      error: `Slow down — wait ${retryAfterSec}s before posting again.`,
      retryAfterSec,
    };
  }

  const inLastDay = authorTimes.filter(
    (t) => now - t < RATE_LIMIT_DAILY_WINDOW_MS
  ).length;
  if (inLastDay >= RATE_LIMIT_DAILY_MAX) {
    const oldestInWindow = authorTimes
      .filter((t) => now - t < RATE_LIMIT_DAILY_WINDOW_MS)
      .at(-1)!;
    const retryAfterSec = Math.ceil(
      (RATE_LIMIT_DAILY_WINDOW_MS - (now - oldestInWindow)) / 1000
    );
    return {
      error: `Daily post limit reached (${RATE_LIMIT_DAILY_MAX}/day). Try again later.`,
      retryAfterSec,
    };
  }

  return null;
}

export async function GET() {
  const [posts, commentCounts] = await Promise.all([
    getFeedPosts(),
    getFeedCommentCounts(),
  ]);
  return NextResponse.json(
    { posts, commentCounts },
    // Belt-and-suspenders: GET handlers aren't cached by default in Next 16,
    // but make it explicit for a polling endpoint.
    { headers: { "Cache-Control": "no-store" } }
  );
}

/**
 * Append a post to the feed with light concurrency protection.
 *
 * Vercel Blob has no compare-and-set, so this isn't fully atomic across
 * concurrent writers. We do two things to reduce data loss:
 *   1. Re-fetch the store inside the retry loop so we merge against the
 *      latest known state (don't clobber posts added during our handler).
 *   2. Retry on write failure with backoff.
 *
 * For real multi-user concurrency, move this storage to a DB (Postgres /
 * Upstash list / etc.) with atomic append semantics.
 */
async function appendPostSafely(post: FeedPost): Promise<void> {
  const MAX_ATTEMPTS = 3;
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const store = await getFeed();
      if (store.posts.some((p) => p.id === post.id)) return; // already saved
      store.posts.push(post);
      await saveFeed(store);
      return;
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 100 * (attempt + 1)));
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to save post after retries");
}

export async function POST(req: Request) {
  try {
    const author = await getSessionHandle();
    if (!author) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const body = await req.json();
    const data = FeedPostBody.parse(body);

    const cohort = await getCohort();
    const member = cohort.members.find(
      (m) => m.handle.toLowerCase() === author.toLowerCase()
    );
    if (!member) {
      return NextResponse.json(
        { error: "User not found in cohort." },
        { status: 404 }
      );
    }

    // Rate-limit check against current feed state. There's a small race here
    // (two concurrent requests can both pass), but the worst case is a couple
    // extra posts — not abusable.
    const now = Date.now();
    const currentStore = await getFeed();
    const authorPosts = currentStore.posts.filter(
      (p) => p.author.toLowerCase() === author.toLowerCase()
    );
    const limited = checkRateLimit(authorPosts, now);
    if (limited) {
      return NextResponse.json(
        { error: limited.error },
        {
          status: 429,
          headers: { "Retry-After": String(limited.retryAfterSec) },
        }
      );
    }

    const post: FeedPost = {
      id: crypto.randomUUID(),
      author,
      text: data.text,
      link: data.link,
      createdAt: new Date(now).toISOString(),
    };

    await appendPostSafely(post);

    return NextResponse.json({ ok: true, post });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
