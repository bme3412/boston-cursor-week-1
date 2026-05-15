"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink, MessageCircle, Rocket, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { AuthorHoverCard } from "@/components/author-hover-card";
import { FeedThread } from "@/components/feed-thread";
import { absoluteTime, relativeTime } from "@/lib/utils";
import type { FeedPost, Member } from "@/lib/types";

const POLL_INTERVAL_MS = 20_000;
const TICK_INTERVAL_MS = 60_000;

function getHost(url: string): string | null {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function LinkChip({ url }: { url: string }) {
  const host = getHost(url);
  if (!host) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
      >
        <ExternalLink className="size-3" />
        {url}
      </a>
    );
  }
  let path: string;
  try {
    const u = new URL(url);
    path = u.pathname === "/" ? "" : u.pathname;
  } catch {
    path = "";
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-md border bg-muted/30 hover:bg-muted/60 px-2 py-1 text-xs transition-colors max-w-full"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://www.google.com/s2/favicons?domain=${host}&sz=32`}
        alt=""
        width={14}
        height={14}
        className="rounded-sm shrink-0"
      />
      <span className="font-medium truncate">{host}</span>
      {path && (
        <span className="text-muted-foreground truncate">{path}</span>
      )}
      <ExternalLink className="size-3 text-muted-foreground shrink-0" />
    </a>
  );
}

export function FeedBoard({
  initialPosts,
  initialCommentCounts,
  members,
}: {
  initialPosts: FeedPost[];
  initialCommentCounts: Record<string, number>;
  members: Record<string, Member>;
}) {
  const { data: session } = useSession();
  const handle = session?.user?.handle;
  const [posts, setPosts] = useState(initialPosts);
  const [commentCounts, setCommentCounts] = useState(initialCommentCounts);
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea (3-8 rows).
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const max = 8 * 24; // ~24px per row
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
  }, [text]);

  // Tick state forces re-render so relativeTime() stays fresh without refresh.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // Poll the server for new posts so other users' posts show up automatically.
  const inFlightRef = useRef(false);
  useEffect(() => {
    async function refresh() {
      if (inFlightRef.current) return;
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const res = await fetch("/api/feed", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          posts: FeedPost[];
          commentCounts: Record<string, number>;
        };
        setPosts((prev) => {
          const serverIds = new Set(data.posts.map((p) => p.id));
          const localOnly = prev.filter((p) => !serverIds.has(p.id));
          return [...localOnly, ...data.posts].sort((a, b) =>
            b.createdAt.localeCompare(a.createdAt)
          );
        });
        if (data.commentCounts) setCommentCounts(data.commentCounts);
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
    setPosts((curr) => curr.filter((p) => p.id !== id));
    inFlightRef.current = true;
    try {
      const res = await fetch(`/api/feed/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
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

  function validateLink(): boolean {
    setLinkError("");
    if (!link.trim()) return true;
    try {
      new URL(link.trim());
      return true;
    } catch {
      setLinkError("Invalid URL");
      return false;
    }
  }

  async function submitPost() {
    if (!handle || !text.trim()) return;
    if (!validateLink()) return;
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

  function counterColor(len: number): string {
    if (len >= 490) return "text-destructive";
    if (len >= 450) return "text-amber-600 dark:text-amber-400";
    return "text-muted-foreground";
  }

  return (
    <div>
      {handle ? (
        <div className="sticky top-14 z-10 -mx-4 px-4 pb-4 mb-2 bg-background/80 backdrop-blur-sm border-b">
          <div className="rounded-lg border bg-card p-4">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  submitPost();
                }
              }}
              placeholder="What's on your mind?"
              maxLength={500}
              rows={3}
              aria-keyshortcuts="Meta+Enter Control+Enter"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none overflow-hidden"
            />
            <input
              type="url"
              value={link}
              onChange={(e) => {
                setLink(e.target.value);
                if (linkError) setLinkError("");
              }}
              onBlur={validateLink}
              placeholder="Link (optional)"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 mt-2"
            />
            {linkError && (
              <p className="text-xs text-destructive mt-1">{linkError}</p>
            )}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-3">
                <span className={`text-xs tabular-nums ${counterColor(text.length)}`}>
                  {text.length}/500
                </span>
                <span className="hidden sm:inline text-[11px] text-muted-foreground">
                  ⌘+Enter to post
                </span>
              </div>
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
          <Rocket className="size-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">No posts yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Be the first to share what you&apos;re building.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const member = members[post.author.toLowerCase()];
            const count = commentCounts[post.id] ?? 0;
            const isExpanded = expandedPostId === post.id;
            return (
              <div key={post.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-3 mb-2">
                  <AuthorHoverCard handle={post.author} member={member}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://github.com/${post.author}.png?size=64`}
                      alt={post.author}
                      width={36}
                      height={36}
                      className="rounded-full cursor-pointer"
                    />
                  </AuthorHoverCard>
                  <div className="min-w-0 flex-1">
                    <AuthorHoverCard handle={post.author} member={member}>
                      <span className="font-semibold text-sm hover:underline cursor-pointer">
                        @{post.author}
                      </span>
                    </AuthorHoverCard>
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
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.text}</p>
                {post.link && (
                  <div className="mt-2">
                    <LinkChip url={post.link} />
                  </div>
                )}
                <div className="mt-3 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedPostId(isExpanded ? null : post.id)
                    }
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 -ml-2 rounded-md hover:bg-muted/60"
                    aria-expanded={isExpanded}
                  >
                    <MessageCircle className="size-3.5" />
                    {count === 0 ? (
                      "Reply"
                    ) : (
                      <>
                        {count} {count === 1 ? "reply" : "replies"}
                      </>
                    )}
                  </button>
                </div>
                {isExpanded && (
                  <FeedThread
                    postId={post.id}
                    members={members}
                    onCountChange={(delta) =>
                      setCommentCounts((prev) => ({
                        ...prev,
                        [post.id]: Math.max(0, (prev[post.id] ?? 0) + delta),
                      }))
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
