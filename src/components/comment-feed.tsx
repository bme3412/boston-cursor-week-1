"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { relativeTime } from "@/lib/utils";
import type { Comment } from "@/lib/types";

export function CommentFeed({
  week,
  initialComments,
}: {
  week: number;
  initialComments: Comment[];
}) {
  const { data: session } = useSession();
  const handle = session?.user?.handle;
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function postComment() {
    if (!handle || !text.trim()) return;
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week, text: text.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error ?? "Failed");
        return;
      }

      setComments((prev) => [data.comment, ...prev]);
      setText("");
      setStatus("idle");
    } catch {
      setStatus("error");
      setErrorMsg("Network error");
    }
  }

  return (
    <div>
      <h2 className="text-sm font-semibold mb-3">
        Discussion{" "}
        {comments.length > 0 && (
          <span className="text-muted-foreground font-normal">
            ({comments.length})
          </span>
        )}
      </h2>

      {handle ? (
        <div className="mb-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your thoughts..."
            maxLength={500}
            rows={2}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
          />
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-muted-foreground tabular-nums">
              {text.length}/500
            </span>
            <div className="flex items-center gap-2">
              {status === "error" && (
                <span className="text-xs text-destructive">{errorMsg}</span>
              )}
              <Button
                variant="default"
                size="xs"
                disabled={!text.trim() || status === "loading"}
                onClick={postComment}
              >
                {status === "loading" ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mb-4">
          Sign in to comment
        </p>
      )}

      {comments.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            No comments yet. Start the discussion.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card divide-y">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-3 px-4 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://github.com/${c.author}.png?size=64`}
                alt={c.author}
                width={32}
                height={32}
                className="rounded-full shrink-0 mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <Link
                    href={`/${c.author}`}
                    className="text-sm font-medium hover:underline"
                  >
                    @{c.author}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {relativeTime(c.createdAt)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed mt-0.5">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
