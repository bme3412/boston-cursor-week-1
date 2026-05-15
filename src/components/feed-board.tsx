"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { absoluteTime, relativeTime } from "@/lib/utils";
import type { FeedPost } from "@/lib/types";

const POLL_INTERVAL_MS = 20_000;
const TICK_INTERVAL_MS = 60_000;

export function FeedBoard({
  initialPosts,
}: {
  initialPosts: FeedPost[];
}) {
  const { data: session } = useSession();
  const handle = session?.user?.handle;
  const [posts, setPosts] = useState(initialPosts);
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Tick state forces re-render so relativeTime() stays fresh without refresh.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // Poll the server for new posts so other users' posts show up automatically.
  // Pauses while the tab is hidden, and skips while a post submission is in flight
  // (so we don't blow away an optimistic update).
  const inFlightRef = useRef(false);
  useEffect(() => {
    async function refresh() {
      if (inFlightRef.current) return;
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const res = await fetch("/api/feed", { cache: "no-store" });
        if (!res.ok) return;
        const { posts: latest } = (await res.json()) as { posts: FeedPost[] };
        setPosts((prev) => {
          // Server is authoritative, but preserve any optimistic posts the
          // server hasn't seen yet (race between POST returning and next poll).
          const serverIds = new Set(latest.map((p) => p.id));
          const localOnly = prev.filter((p) => !serverIds.has(p.id));
          return [...localOnly, ...latest].sort((a, b) =>
            b.createdAt.localeCompare(a.createdAt)
          );
        });
      } catch {
        // network errors are non-fatal; try again next tick
      }
    }
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  async function deletePost(id: string) {
    if (!confirm("Delete this post?")) return;
    const prev = posts;
    // Optimistic remove
    setPosts((curr) => curr.filter((p) => p.id !== id));
    inFlightRef.current = true;
    try {
      const res = await fetch(`/api/feed/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Roll back
        setPosts(prev);
        alert(data.error ?? "Failed to delete");
      }
    } catch {
      setPosts(prev);
      alert("Network error");
    } finally {
      inFlightRef.current = false;
    }
  }

  async function submitPost() {
    if (!handle || !text.trim()) return;
    setStatus("loading");
    setErrorMsg("");
    inFlightRef.current = true;

    try {
      const res = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          ...(link.trim() ? { link: link.trim() } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error ?? "Failed");
        return;
      }

      setPosts((prev) => [data.post, ...prev]);
      setText("");
      setLink("");
      setStatus("idle");
    } catch {
      setStatus("error");
      setErrorMsg("Network error");
    } finally {
      inFlightRef.current = false;
    }
  }

  return (
    <div>
      {handle ? (
        <div className="rounded-lg border bg-card p-4 mb-6">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's on your mind?"
            maxLength={500}
            rows={3}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
          />
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Link (optional)"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 mt-2"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground tabular-nums">
              {text.length}/500
            </span>
            <div className="flex items-center gap-2">
              {status === "error" && (
                <span className="text-xs text-destructive">{errorMsg}</span>
              )}
              <Button
                variant="default"
                size="sm"
                disabled={!text.trim() || status === "loading"}
                onClick={submitPost}
              >
                {status === "loading" ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/30 py-6 text-center mb-6">
          <p className="text-sm text-muted-foreground">
            <Link href="/join" className="text-primary hover:underline">
              Sign in
            </Link>{" "}
            to post
          </p>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No posts yet. Share what you&apos;re working on.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="rounded-lg border bg-card p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://github.com/${post.author}.png?size=64`}
                  alt={post.author}
                  width={36}
                  height={36}
                  className="rounded-full"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/${post.author}`}
                    className="font-semibold text-sm hover:underline"
                  >
                    @{post.author}
                  </Link>
                  <time
                    dateTime={post.createdAt}
                    title={absoluteTime(post.createdAt)}
                    className="block text-xs text-muted-foreground cursor-help"
                  >
                    {relativeTime(post.createdAt)}
                  </time>
                </div>
                {handle?.toLowerCase() === post.author.toLowerCase() && (
                  <button
                    type="button"
                    onClick={() => deletePost(post.id)}
                    aria-label="Delete post"
                    title="Delete post"
                    className="text-muted-foreground hover:text-destructive transition-colors p-1 -m-1 rounded"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
              <p className="text-sm leading-relaxed">{post.text}</p>
              {post.link && (
                <div className="mt-2">
                  <a
                    href={post.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({
                      variant: "outline",
                      size: "xs",
                    })}
                  >
                    <ExternalLink className="size-3" />
                    Link
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
