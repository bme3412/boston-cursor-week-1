import { head, put } from "@vercel/blob";
import { CohortSchema, ReactionsStoreSchema, CommentsStoreSchema, FeedStoreSchema } from "./types";
import type { Cohort, Member, Reaction, ReactionsStore, Comment, CommentsStore, FeedPost, FeedStore } from "./types";
import cohortFallback from "@/data/cohort.json";

const BLOB_KEY = "cohort.json";

/** Read cohort data from Vercel Blob, falling back to the local JSON file. */
export async function getCohort(): Promise<Cohort> {
  // Try Blob first (only works when BLOB_READ_WRITE_TOKEN is set)
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const info = await head(BLOB_KEY, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      const res = await fetch(info.url, { cache: "no-store" });
      const raw = await res.json();
      return CohortSchema.parse(raw);
    } catch {
      // Blob doesn't exist yet or token invalid — fall through to local file
    }
  }

  return CohortSchema.parse(cohortFallback);
}

/** Write cohort data to Vercel Blob. */
export async function saveCohort(cohort: Cohort): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set");
  }

  await put(BLOB_KEY, JSON.stringify(cohort, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    token,
  });
}

export async function getMember(handle: string): Promise<Member | undefined> {
  const cohort = await getCohort();
  return cohort.members.find(
    (m) => m.handle.toLowerCase() === handle.toLowerCase()
  );
}

export async function getMembersByActivity(): Promise<Member[]> {
  const cohort = await getCohort();
  return [...cohort.members].sort((a, b) => {
    const aLatest = a.updates.at(-1)?.submittedAt ?? "";
    const bLatest = b.updates.at(-1)?.submittedAt ?? "";
    if (bLatest !== aLatest) return bLatest.localeCompare(aLatest);
    return a.handle.localeCompare(b.handle);
  });
}

export async function getWeekSubmissions(
  weekNum: number
): Promise<
  {
    member: Member;
    shipped: string;
    submittedAt: string;
    loomUrl?: string;
    deployUrl?: string;
  }[]
> {
  const cohort = await getCohort();
  const results: {
    member: Member;
    shipped: string;
    submittedAt: string;
    loomUrl?: string;
    deployUrl?: string;
  }[] = [];

  for (const member of cohort.members) {
    const update = member.updates.find((u) => u.week === weekNum);
    if (update) {
      results.push({
        member,
        shipped: update.shipped,
        submittedAt: update.submittedAt,
        loomUrl: update.loomUrl,
        deployUrl: update.deployUrl,
      });
    }
  }

  return results.sort((a, b) =>
    b.submittedAt.localeCompare(a.submittedAt)
  );
}

export async function getMissingForWeek(weekNum: number): Promise<Member[]> {
  const cohort = await getCohort();
  return cohort.members.filter(
    (m) => !m.updates.some((u) => u.week === weekNum)
  );
}

/** Vote tallies for a given week, sorted by most votes. */
export async function getVoteTallies(
  weekNum: number
): Promise<{ handle: string; votes: number }[]> {
  const cohort = await getCohort();
  const weekVotes = cohort.votes.filter((v) => v.week === weekNum);

  const counts = new Map<string, number>();
  for (const v of weekVotes) {
    counts.set(v.candidate, (counts.get(v.candidate) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([handle, votes]) => ({ handle, votes }))
    .sort((a, b) => b.votes - a.votes);
}

// ── Reactions ─────────────────────────────────────────────────────────────────

const REACTIONS_KEY = "reactions.json";

export async function getReactions(): Promise<ReactionsStore> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const info = await head(REACTIONS_KEY, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      const res = await fetch(info.url, { cache: "no-store" });
      const raw = await res.json();
      return ReactionsStoreSchema.parse(raw);
    } catch {
      // Blob doesn't exist yet
    }
  }
  return { reactions: [] };
}

export async function saveReactions(store: ReactionsStore): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN is not set");
  await put(REACTIONS_KEY, JSON.stringify(store, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    token,
  });
}

export async function getReactionsForWeek(week: number): Promise<Reaction[]> {
  const store = await getReactions();
  return store.reactions.filter((r) => r.week === week);
}

// ── Comments ──────────────────────────────────────────────────────────────────

const COMMENTS_KEY = "comments.json";

export async function getComments(): Promise<CommentsStore> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const info = await head(COMMENTS_KEY, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      const res = await fetch(info.url, { cache: "no-store" });
      const raw = await res.json();
      return CommentsStoreSchema.parse(raw);
    } catch {
      // Blob doesn't exist yet
    }
  }
  return { comments: [] };
}

export async function saveComments(store: CommentsStore): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN is not set");
  await put(COMMENTS_KEY, JSON.stringify(store, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    token,
  });
}

export async function getCommentsForWeek(week: number): Promise<Comment[]> {
  const store = await getComments();
  return store.comments
    .filter((c) => c.week === week)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ── Feed ──────────────────────────────────────────────────────────────────────

const FEED_KEY = "feed.json";

export async function getFeed(): Promise<FeedStore> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const info = await head(FEED_KEY, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      const res = await fetch(info.url, { cache: "no-store" });
      const raw = await res.json();
      return FeedStoreSchema.parse(raw);
    } catch {
      // Blob doesn't exist yet
    }
  }
  return { posts: [] };
}

export async function saveFeed(store: FeedStore): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN is not set");
  await put(FEED_KEY, JSON.stringify(store, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    token,
  });
}

export async function getFeedPosts(): Promise<FeedPost[]> {
  const store = await getFeed();
  return store.posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
