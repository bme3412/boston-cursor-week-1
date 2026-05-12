"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import type { Reaction } from "@/lib/types";

const EMOJIS = {
  fire: "\u{1F525}",
  rocket: "\u{1F680}",
  heart: "\u2764\uFE0F",
  clap: "\u{1F44F}",
} as const;

type EmojiKey = keyof typeof EMOJIS;

export function ReactionBar({
  week,
  handle,
  reactions,
}: {
  week: number;
  handle: string;
  reactions: Reaction[];
}) {
  const { data: session } = useSession();
  const reactor = session?.user?.handle;
  const [localReactions, setLocalReactions] = useState(reactions);
  const [loading, setLoading] = useState<EmojiKey | null>(null);

  function countFor(emoji: EmojiKey) {
    return localReactions.filter((r) => r.emoji === emoji).length;
  }

  function userReacted(emoji: EmojiKey) {
    if (!reactor) return false;
    return localReactions.some(
      (r) =>
        r.emoji === emoji &&
        r.reactor.toLowerCase() === reactor.toLowerCase()
    );
  }

  async function toggle(emoji: EmojiKey) {
    if (!reactor || loading) return;

    const wasActive = userReacted(emoji);

    // Optimistic update
    if (wasActive) {
      setLocalReactions((prev) =>
        prev.filter(
          (r) =>
            !(
              r.emoji === emoji &&
              r.reactor.toLowerCase() === reactor.toLowerCase()
            )
        )
      );
    } else {
      setLocalReactions((prev) => [
        ...prev,
        {
          week,
          handle,
          emoji,
          reactor,
          reactedAt: new Date().toISOString(),
        },
      ]);
    }

    setLoading(emoji);
    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week, handle, emoji }),
      });

      if (!res.ok) {
        // Revert on failure
        setLocalReactions(reactions);
      }
    } catch {
      setLocalReactions(reactions);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-1">
      {(Object.keys(EMOJIS) as EmojiKey[]).map((emoji) => {
        const count = countFor(emoji);
        const active = userReacted(emoji);
        return (
          <button
            key={emoji}
            onClick={() => toggle(emoji)}
            disabled={!reactor || loading === emoji}
            className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs transition-colors disabled:opacity-50 ${
              active
                ? "border-primary/30 bg-primary/10 text-foreground"
                : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
            title={reactor ? emoji : "Sign in to react"}
          >
            <span>{EMOJIS[emoji]}</span>
            {count > 0 && (
              <span className="tabular-nums">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
