import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getCohort,
  getFeed,
  getFeedComments,
  getFeedCommentsByPost,
  saveFeedComments,
} from "@/lib/data";
import { getSessionHandle } from "@/lib/auth";
import type { FeedComment } from "@/lib/types";

const FeedCommentBody = z.object({
  text: z.string().min(1).max(500),
});

const RATE_LIMIT_BURST_MS = 10_000;
const RATE_LIMIT_DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;
const RATE_LIMIT_DAILY_MAX = 60;

function checkRateLimit(
  authorComments: FeedComment[],
  now: number
): { error: string; retryAfterSec: number } | null {
  const times = authorComments
    .map((c) => new Date(c.createdAt).getTime())
    .sort((a, b) => b - a);

  const latest = times[0];
  if (latest && now - latest < RATE_LIMIT_BURST_MS) {
    const retryAfterSec = Math.ceil(
      (RATE_LIMIT_BURST_MS - (now - latest)) / 1000
    );
    return {
      error: `Slow down — wait ${retryAfterSec}s before commenting again.`,
      retryAfterSec,
    };
  }

  const inLastDay = times.filter(
    (t) => now - t < RATE_LIMIT_DAILY_WINDOW_MS
  ).length;
  if (inLastDay >= RATE_LIMIT_DAILY_MAX) {
    const oldestInWindow = times
      .filter((t) => now - t < RATE_LIMIT_DAILY_WINDOW_MS)
      .at(-1)!;
    const retryAfterSec = Math.ceil(
      (RATE_LIMIT_DAILY_WINDOW_MS - (now - oldestInWindow)) / 1000
    );
    return {
      error: `Daily comment limit reached (${RATE_LIMIT_DAILY_MAX}/day). Try again later.`,
      retryAfterSec,
    };
  }

  return null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const comments = await getFeedCommentsByPost(id);
  return NextResponse.json(
    { comments },
    { headers: { "Cache-Control": "no-store" } }
  );
}

async function appendCommentSafely(comment: FeedComment): Promise<void> {
  const MAX_ATTEMPTS = 3;
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const store = await getFeedComments();
      if (store.comments.some((c) => c.id === comment.id)) return;
      store.comments.push(comment);
      await saveFeedComments(store);
      return;
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 100 * (attempt + 1)));
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to save comment after retries");
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const author = await getSessionHandle();
    if (!author) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const { id: postId } = await params;
    const body = await req.json();
    const data = FeedCommentBody.parse(body);

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

    const feed = await getFeed();
    if (!feed.posts.some((p) => p.id === postId)) {
      return NextResponse.json(
        { error: "Post not found." },
        { status: 404 }
      );
    }

    const now = Date.now();
    const currentStore = await getFeedComments();
    const authorComments = currentStore.comments.filter(
      (c) => c.author.toLowerCase() === author.toLowerCase()
    );
    const limited = checkRateLimit(authorComments, now);
    if (limited) {
      return NextResponse.json(
        { error: limited.error },
        {
          status: 429,
          headers: { "Retry-After": String(limited.retryAfterSec) },
        }
      );
    }

    const comment: FeedComment = {
      id: crypto.randomUUID(),
      postId,
      author,
      text: data.text,
      createdAt: new Date(now).toISOString(),
    };

    await appendCommentSafely(comment);

    return NextResponse.json({ ok: true, comment });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
