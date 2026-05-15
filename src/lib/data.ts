import { head, put } from "@vercel/blob";
import { CohortSchema, ReactionsStoreSchema, CommentsStoreSchema, FeedStoreSchema, FeedCommentsStoreSchema } from "./types";
import type { Cohort, Member, Reaction, ReactionsStore, Comment, CommentsStore, FeedPost, FeedStore, FeedComment, FeedCommentsStore } from "./types";
import cohortFallback from "@/data/cohort.json";
import { fetchCohortHandles } from "./cohort-source";
import { getPRStatusForWeek } from "./pr-source";
import type { PRStatusEntry } from "./pr-source";

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
    allowOverwrite: true,
    token,
  });
}

function stubMember(handle: string, currentWeek: number): Member {
  return {
    handle,
    projectName: handle,
    projectDescription: "",
    tags: [],
    flair: [],
    joinedWeek: currentWeek,
    updates: [],
  };
}

/**
 * Merge cohort.json/Blob members with the live GitHub roster. New handles get
 * neutral stubs; existing manual entries are preserved verbatim. We do not
 * pull project titles, descriptions, scores, or submissions from upstream —
 * that's the member's own work to share.
 */
async function getMergedMembers(): Promise<Member[]> {
  const [cohort, handles] = await Promise.all([
    getCohort(),
    fetchCohortHandles(),
  ]);

  const byHandle = new Map(
    cohort.members.map((m) => [m.handle.toLowerCase(), m])
  );
  const seen = new Set<string>();
  const merged: Member[] = [];

  for (const h of handles) {
    const key = h.toLowerCase();
    seen.add(key);
    merged.push(byHandle.get(key) ?? stubMember(h, cohort.currentWeek));
  }
  for (const m of cohort.members) {
    if (!seen.has(m.handle.toLowerCase())) merged.push(m);
  }

  return merged;
}

export async function getMember(handle: string): Promise<Member | undefined> {
  const members = await getMergedMembers();
  return members.find(
    (m) => m.handle.toLowerCase() === handle.toLowerCase()
  );
}

export async function getMembersByActivity(): Promise<Member[]> {
  const members = await getMergedMembers();
  return members.sort((a, b) => {
    const aLatest = a.updates.at(-1)?.submittedAt ?? "";
    const bLatest = b.updates.at(-1)?.submittedAt ?? "";
    if (bLatest !== aLatest) return bLatest.localeCompare(aLatest);
    return a.handle.localeCompare(b.handle);
  });
}

export type WeekSubmission = {
  member: Member;
  shipped: string;
  submittedAt: string;
  loomUrl?: string;
  deployUrl?: string;
  repoUrl?: string;
  /** True when this entry was synthesized from an upstream PR (no in-app form submission). */
  fromPR?: boolean;
  /** Matching upstream PR entry, if any. Populated for both form-submitted and PR-only entries. */
  prEntry?: PRStatusEntry;
};

export async function getWeekSubmissions(
  weekNum: number
): Promise<WeekSubmission[]> {
  const [members, prMap] = await Promise.all([
    getMergedMembers(),
    getPRStatusForWeek(weekNum),
  ]);
  const results: WeekSubmission[] = [];
  const seen = new Set<string>();

  for (const member of members) {
    const key = member.handle.toLowerCase();
    const update = member.updates.find((u) => u.week === weekNum);
    const prEntry = prMap.get(key);
    const matched = prEntry && prEntry.status !== "none" ? prEntry : undefined;

    if (update) {
      results.push({
        member,
        shipped: update.shipped,
        submittedAt: update.submittedAt,
        loomUrl: update.loomUrl,
        deployUrl: update.deployUrl,
        repoUrl: update.repoUrl,
        prEntry: matched,
      });
      seen.add(key);
    } else if (matched && matched.pr) {
      results.push({
        member,
        shipped: "",
        submittedAt: matched.pr.createdAt,
        repoUrl: matched.pr.htmlUrl,
        fromPR: true,
        prEntry: matched,
      });
      seen.add(key);
    }
  }

  // Catch PR authors who aren't (yet) in the merged roster.
  for (const [key, entry] of prMap.entries()) {
    if (seen.has(key)) continue;
    if (!entry.pr) continue;
    results.push({
      member: stubMember(entry.pr.user, weekNum),
      shipped: "",
      submittedAt: entry.pr.createdAt,
      repoUrl: entry.pr.htmlUrl,
      fromPR: true,
      prEntry: entry,
    });
  }

  return results.sort((a, b) =>
    b.submittedAt.localeCompare(a.submittedAt)
  );
}

export async function getMissingForWeek(weekNum: number): Promise<Member[]> {
  const members = await getMergedMembers();
  return members.filter(
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
    allowOverwrite: true,
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
    allowOverwrite: true,
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
    allowOverwrite: true,
    token,
  });
}

export async function getFeedPosts(): Promise<FeedPost[]> {
  const store = await getFeed();
  return store.posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ── Feed Comments ─────────────────────────────────────────────────────────────

const FEED_COMMENTS_KEY = "feed-comments.json";

export async function getFeedComments(): Promise<FeedCommentsStore> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const info = await head(FEED_COMMENTS_KEY, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      const res = await fetch(info.url, { cache: "no-store" });
      const raw = await res.json();
      return FeedCommentsStoreSchema.parse(raw);
    } catch {
      // Blob doesn't exist yet
    }
  }
  return { comments: [] };
}

export async function saveFeedComments(store: FeedCommentsStore): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN is not set");
  await put(FEED_COMMENTS_KEY, JSON.stringify(store, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    token,
  });
}

export async function getFeedCommentsByPost(postId: string): Promise<FeedComment[]> {
  const store = await getFeedComments();
  return store.comments
    .filter((c) => c.postId === postId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getFeedCommentCounts(): Promise<Record<string, number>> {
  const store = await getFeedComments();
  const counts: Record<string, number> = {};
  for (const c of store.comments) {
    counts[c.postId] = (counts[c.postId] ?? 0) + 1;
  }
  return counts;
}
