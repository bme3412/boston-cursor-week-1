import { getCohort, getFeedCommentCounts, getFeedPosts } from "@/lib/data";
import { FeedBoard } from "@/components/feed-board";
import type { Member } from "@/lib/types";

export default async function FeedPage() {
  const [posts, commentCounts, cohort] = await Promise.all([
    getFeedPosts(),
    getFeedCommentCounts(),
    getCohort(),
  ]);

  const members: Record<string, Member> = {};
  for (const m of cohort.members) {
    members[m.handle.toLowerCase()] = m;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Feed</h1>
        <p className="text-sm text-muted-foreground">
          What&apos;s happening in the cohort.
        </p>
      </div>
      <FeedBoard
        initialPosts={posts}
        initialCommentCounts={commentCounts}
        members={members}
      />
    </main>
  );
}
