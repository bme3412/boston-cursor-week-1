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
  MapPin,
  Hammer,
} from "lucide-react";
import { fetchUser, fetchRecentEvents } from "@/lib/github";
import { getMember } from "@/lib/data";
import { FlairPill } from "@/components/flair-pill";
import { getCurrentWeek } from "@/lib/week";
import { humanizeEvent, groupEventsByDate } from "@/lib/events";
import type { EventIcon } from "@/lib/events";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { LoomEmbed } from "@/components/loom-embed";
import { WEEKS } from "@/data/weeks";
import { EditProfileCard } from "@/components/edit-profile-card";
import { PRStatusBadge } from "@/components/pr-status-badge";
import { getPRStatusForWeek } from "@/lib/pr-source";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

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
  const prMap = await getPRStatusForWeek(currentWeek);
  const myPR = prMap.get(handle.toLowerCase());

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

      <EditProfileCard
        handle={handle}
        initial={{
          projectName: member?.projectName ?? "",
          projectDescription: member?.projectDescription ?? "",
          projectUrl: member?.projectUrl,
          repoUrl: member?.repoUrl,
          bio: member?.bio,
          location: member?.location,
          currentlyBuilding: member?.currentlyBuilding,
          flair: member?.flair,
        }}
      />

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
              <h1 className="text-2xl font-bold tracking-tight mb-0.5">
                {user.name ?? user.login}
              </h1>
              <p className="text-sm text-muted-foreground">@{user.login}</p>
              {(member?.bio || user.bio) && (
                <p className="mt-2 text-sm text-muted-foreground italic">
                  {member?.bio || user.bio}
                </p>
              )}
              {(member?.location || member?.currentlyBuilding) && (
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {member?.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" />
                      {member.location}
                    </span>
                  )}
                  {member?.currentlyBuilding && (
                    <span className="inline-flex items-center gap-1 text-primary">
                      <Hammer className="size-3.5" />
                      Building: {member.currentlyBuilding}
                    </span>
                  )}
                </div>
              )}
              {member?.flair && member.flair.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {member.flair.map((id) => (
                    <FlairPill key={id} id={id} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
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
                  id={`week-${weekInfo.week}`}
                  className={`scroll-mt-20 rounded-lg border bg-card p-4 ${
                    update
                      ? "border-l-[3px] border-l-green-500"
                      : "border-l-[3px] border-l-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/week/${weekInfo.week}#submission-${handle.toLowerCase()}`}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Week {weekInfo.week}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {weekInfo.theme}
                      </span>
                      {weekInfo.week === currentWeek && myPR && myPR.status !== "none" && (
                        <PRStatusBadge entry={myPR} size="xs" />
                      )}
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
                          {
                            month: "short",
                            day: "numeric",
                            timeZone: "America/New_York",
                          }
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
                      {(update.loomUrl || update.deployUrl || update.repoUrl) && (
                        <div className="flex gap-2 mt-3 flex-wrap">
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
                          {update.repoUrl && (
                            <a
                              href={update.repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={buttonVariants({
                                variant: "outline",
                                size: "xs",
                              })}
                            >
                              <Code2 className="size-3" />
                              Source
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
                          {relativeTime(event.created_at)}
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
