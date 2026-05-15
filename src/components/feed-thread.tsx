"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthorHoverCard } from "@/components/author-hover-card";
import { absoluteTime, relativeTime } from "@/lib/utils";
import type { FeedComment, Member } from "@/lib/types";

export function FeedThread({
  postId,
  members,
  onCountChange,
}: {
  postId: string;
  members: Record<string, Member>;
  onCountChange?: (delta: number) => void;
}) {
  const { data: session } = useSession();
  const handle = session?.user?.handle;
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/feed/${postId}/comments`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { comments: FeedComment[] };
        if (!cancelled) {
          setComments(data.comments);
          setLoaded(true);
        }
      } catch {
        // ignore
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  async function postComment() {
    if (!handle || !text.trim()) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/feed/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error ?? "Failed");
        return;
      }
      setComments((prev) => [...prev, data.comment]);
      setText("");
      setStatus("idle");
      onCountChange?.(1);
    } catch {
      setStatus("error");
      setErrorMsg("Network error");
    }
  }

  async function deleteComment(commentId: string) {
    if (!confirm("Delete this comment?")) return;
    const prev = comments;
    setComments((curr) => curr.filter((c) => c.id !== commentId));
    onCountChange?.(-1);
    try {
      const res = await fetch(
        `/api/feed/${postId}/comments/${commentId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        setComments(prev);
        onCountChange?.(1);
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to delete");
      }
    } catch {
      setComments(prev);
      onCountChange?.(1);
      alert("Network error");
    }
  }

  return (
    <div className="mt-3 border-t pt-3">
      {loaded && comments.length === 0 && (
        <p className="text-xs text-muted-foreground mb-3">
          No replies yet.
        </p>
      )}
      {comments.length > 0 && (
        <div className="space-y-2.5 mb-3">
          {comments.map((c) => {
            const member = members[c.author.toLowerCase()];
            return (
              <div key={c.id} className="flex items-start gap-2">
                <AuthorHoverCard handle={c.author} member={member}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://github.com/${c.author}.png?size=64`}
                    alt={c.author}
                    width={24}
                    height={24}
                    className="rounded-full shrink-0 mt-0.5"
                  />
                </AuthorHoverCard>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <AuthorHoverCard handle={c.author} member={member}>
                      <span className="text-xs font-medium hover:underline cursor-pointer">
                        @{c.author}
                      </span>
                    </AuthorHoverCard>
                    <time
                      dateTime={c.createdAt}
                      title={absoluteTime(c.createdAt)}
                      className="text-[11px] text-muted-foreground cursor-help"
                    >
                      {relativeTime(c.createdAt)}
                    </time>
                    {handle?.toLowerCase() === c.author.toLowerCase() && (
                      <button
                        type="button"
                        onClick={() => deleteComment(c.id)}
                        aria-label="Delete comment"
                        title="Delete comment"
                        className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed">{c.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {handle ? (
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                postComment();
              }
            }}
            placeholder="Reply..."
            maxLength={500}
            rows={2}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
          />
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[11px] text-muted-foreground tabular-nums">
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
                {status === "loading" ? "Replying..." : "Reply"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Sign in to reply
        </p>
      )}
    </div>
  );
}
