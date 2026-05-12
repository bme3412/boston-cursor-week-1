import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Code2,
  GitCommit,
  GitPullRequest,
  Star,
  GitFork,
  MessageSquare,
  Plus,
  Trash2,
  Tag,
  Circle,
  Video,
  Globe,
} from "lucide-react";
import { fetchUser, fetchRecentEvents } from "@/lib/github";
import { getMember } from "@/lib/data";
import { getCurrentWeek } from "@/lib/week";
import { humanizeEvent, groupEventsByDate } from "@/lib/events";
import type { EventIcon } from "@/lib/events";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { LoomEmbed } from "@/components/loom-embed";
import { WEEKS } from "@/data/weeks";

const EVENT_ICON_MAP: Record<EventIcon, typeof GitCommit> = {
  commit: GitCommit,
  pr: GitPullRequest,
  create: Plus,
  issue: Circle,
  comment: MessageSquare,
  star: Star,
  fork: GitFork,
  release: Tag,
  delete: Trash2,
  default: Code2,
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  let user;
  let events;

  try {
    [user, events] = await Promise.all([
      fetchUser(handle),
      fetchRecentEvents(handle),
    ]);
  } catch {
    notFound();
  }

  const member = await getMember(handle);
  const recent = events.slice(0, 10);
  const grouped = groupEventsByDate(recent);
  const currentWeek = getCurrentWeek();

  // Stats
  const weeksActive = member
    ? new Set(member.updates.map((u) => u.week)).size
    : 0;
  const streak = member
    ? (() => {
        let s = 0;
        for (let w = currentWeek; w >= 1; w--) {
          if (member.updates.some((u) => u.week === w)) s++;
          else break;
        }
        return s;
      })()
    : 0;

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="size-3.5" />
        Back to feed
      </Link>

      {/* Hero card */}
      <div className="rounded-xl border bg-card overflow-hidden mb-6">
        <div className="bg-primary/5 px-6 pt-6 pb-4">
          <div className="flex items-start gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.avatar_url}
              alt={user.login}
              width={112}
              height={112}
              className="rounded-full shrink-0 ring-4 ring-card shadow-lg"
            />
            <div className="min-w-0 pt-1">
              {member ? (
                <h1 className="text-2xl font-bold tracking-tight mb-0.5">
                  {member.projectName}
                </h1>
              ) : (
                <h1 className="text-2xl font-bold tracking-tight mb-0.5">
                  {user.name ?? user.login}
                </h1>
              )}
              <p className="font-medium text-foreground/80">
                {member ? (user.name ?? user.login) : null}
              </p>
              <p className="text-sm text-muted-foreground">@{user.login}</p>
              {user.bio && (
                <p className="mt-2 text-sm text-muted-foreground">{user.bio}</p>
              )}
              {member && (
                <p className="mt-2 text-sm leading-relaxed">
                  {member.projectDescription}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          {/* Tags */}
          {member && member.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {member.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Link buttons */}
          <div className="flex flex-wrap gap-2">
            <a
              href={user.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Code2 className="size-3.5" />
              GitHub
            </a>
            {member?.projectUrl && (
              <a
                href={member.projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <Globe className="size-3.5" />
                Live Site
              </a>
            )}
            {member?.repoUrl && (
              <a
                href={member.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <Code2 className="size-3.5" />
                Repo
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Repos", value: user.public_repos },
          { label: "Followers", value: user.followers },
          { label: "Weeks active", value: weeksActive },
          { label: "Streak", value: streak > 0 ? `${streak}w` : "—" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border bg-card p-3 text-center"
          >
            <div className="text-lg font-bold tabular-nums">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* 6-Week Timeline */}
      {member ? (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">6-Week Timeline</h2>
          <div className="space-y-3">
            {WEEKS.map((weekInfo) => {
              const update = member.updates.find(
                (u) => u.week === weekInfo.week
              );
              const latestWeek = member.updates.length > 0
                ? Math.max(...member.updates.map((u) => u.week))
                : 0;

              return (
                <div
                  key={weekInfo.week}
                  className={`rounded-lg border bg-card p-4 ${
                    update
                      ? "border-l-[3px] border-l-green-500"
                      : "border-l-[3px] border-l-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/week/${weekInfo.week}`}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Week {weekInfo.week}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {weekInfo.theme}
                      </span>
                      {update && update.week === latestWeek && (
                        <Badge variant="default" className="text-[10px] h-4">
                          Latest
                        </Badge>
                      )}
                    </div>
                    {update && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(update.submittedAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )}
                      </span>
                    )}
                  </div>

                  {update ? (
                    <>
                      <p className="text-sm leading-relaxed">
                        {update.shipped}
                      </p>
                      {update.loomUrl && (
                        <div className="mt-3">
                          <LoomEmbed url={update.loomUrl} />
                        </div>
                      )}
                      {(update.loomUrl || update.deployUrl) && (
                        <div className="flex gap-2 mt-3">
                          {update.loomUrl && (
                            <a
                              href={update.loomUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={buttonVariants({
                                variant: "outline",
                                size: "xs",
                              })}
                            >
                              <Video className="size-3" />
                              Loom
                            </a>
                          )}
                          {update.deployUrl && (
                            <a
                              href={update.deployUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={buttonVariants({
                                variant: "outline",
                                size: "xs",
                              })}
                            >
                              <ExternalLink className="size-3" />
                              Demo
                            </a>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      No submission yet
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/30 p-5 text-sm text-muted-foreground mb-8">
          This GitHub user isn&apos;t registered in the cohort yet.
        </div>
      )}

      {/* GitHub Activity */}
      <div>
        <h2 className="text-lg font-semibold mb-3">GitHub Activity</h2>
        {grouped.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No recent public events.
          </p>
        ) : (
          <div className="space-y-4">
            {grouped.map((group) => (
              <div key={group.date}>
                <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  {group.date}
                </div>
                <div className="space-y-1">
                  {group.events.map((event, i) => {
                    const iconType =
                      EVENT_ICON_MAP[
                        (
                          {
                            PushEvent: "commit",
                            PullRequestEvent: "pr",
                            CreateEvent: "create",
                            IssuesEvent: "issue",
                            IssueCommentEvent: "comment",
                            WatchEvent: "star",
                            ForkEvent: "fork",
                            ReleaseEvent: "release",
                            DeleteEvent: "delete",
                          } as Record<string, EventIcon>
                        )[event.type] ?? "default"
                      ] ?? Code2;
                    const Icon = iconType;

                    return (
                      <div
                        key={`${event.created_at}-${i}`}
                        className="flex items-center gap-2.5 py-1.5 text-sm"
                      >
                        <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate">
                          {humanizeEvent(event)}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {new Date(event.created_at).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "numeric",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
