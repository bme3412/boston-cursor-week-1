import Link from "next/link";
import { notFound } from "next/navigation";
import { Video, ExternalLink, Calendar, Trophy, GitMerge, Mic, GraduationCap, Code2 } from "lucide-react";
import { getWeekSubmissions, getMissingForWeek, getVoteTallies, getReactionsForWeek, getCommentsForWeek } from "@/lib/data";
import { TOTAL_PROGRAM_WEEKS } from "@/lib/week";
import { getWeekInfo, WEEKS } from "@/data/weeks";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CollapsibleSection } from "@/components/collapsible-section";
import { LoomEmbed } from "@/components/loom-embed";
import { VoteButton } from "@/components/vote-button";
import { IdentityBar } from "@/components/identity-bar";
import { WeekSubmitCard } from "@/components/week-submit-card";
import { ReactionBar } from "@/components/reaction-bar";
import { CommentFeed } from "@/components/comment-feed";
import { PRStatusBadge } from "@/components/pr-status-badge";
import { getPRStatusForWeek } from "@/lib/pr-source";

const FORMAT_LABELS = {
  vote: { label: "Vote to win", icon: Trophy },
  merge: { label: "Merge to ship", icon: GitMerge },
  "show-and-tell": { label: "Show & tell", icon: Mic },
  "demo-day": { label: "Demo day", icon: GraduationCap },
};

export default async function WeekPage({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  const weekNum = parseInt(n, 10);

  if (isNaN(weekNum) || weekNum < 1 || weekNum > TOTAL_PROGRAM_WEEKS) {
    notFound();
  }

  const weekInfo = getWeekInfo(weekNum);
  const [submissions, missing, tallies, weekReactions, weekComments, prMap] = await Promise.all([
    getWeekSubmissions(weekNum),
    getMissingForWeek(weekNum),
    getVoteTallies(weekNum),
    getReactionsForWeek(weekNum),
    getCommentsForWeek(weekNum),
    getPRStatusForWeek(weekNum),
  ]);

  const tallyMap = new Map(tallies.map((t) => [t.handle, t.votes]));
  const totalVotes = tallies.reduce((sum, t) => sum + t.votes, 0);

  const withLoom = submissions.filter((s) => s.loomUrl).length;
  const withDeploy = submissions.filter((s) => s.deployUrl).length;

  // Filter out members who already have a PR upstream (they've effectively shipped).
  const missingFiltered = missing.filter(
    (m) => !prMap.has(m.handle.toLowerCase())
  );

  let prMerged = 0;
  let prOpen = 0;
  for (const entry of prMap.values()) {
    if (entry.status === "merged") prMerged++;
    else if (entry.status === "open" || entry.status === "draft") prOpen++;
  }

  const fmt = weekInfo ? FORMAT_LABELS[weekInfo.format] : null;
  const FormatIcon = fmt?.icon ?? Trophy;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {/* Week navigation tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {WEEKS.map((w) => (
          <Link
            key={w.week}
            href={`/week/${w.week}`}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm transition-colors ${
              w.week === weekNum
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {w.week}
          </Link>
        ))}
      </div>

      <IdentityBar />
      <WeekSubmitCard week={weekNum} />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span>Week {weekNum}</span>
          {fmt && (
            <>
              <span>&middot;</span>
              <FormatIcon className="size-3.5" />
              <span>{fmt.label}</span>
            </>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {weekInfo?.title ?? `Week ${weekNum}`}
        </h1>
        {weekInfo && (
          <p className="text-sm leading-relaxed text-muted-foreground mb-4 max-w-2xl">
            {weekInfo.brief}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          {weekInfo && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="size-3.5" />
              {weekInfo.deadlineLabel}
            </div>
          )}
          {weekInfo && weekInfo.inspirations.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {weekInfo.inspirations.map((name) => (
                <Badge key={name} variant="outline">
                  {name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Submission stats */}
      {(submissions.length > 0 || prMerged + prOpen > 0) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {submissions.length > 0 && (
            <Badge variant="secondary">
              {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
            </Badge>
          )}
          {prMerged > 0 && (
            <Badge variant="secondary">{prMerged} merged PR{prMerged !== 1 ? "s" : ""}</Badge>
          )}
          {prOpen > 0 && (
            <Badge variant="secondary">{prOpen} open PR{prOpen !== 1 ? "s" : ""}</Badge>
          )}
          {withLoom > 0 && (
            <Badge variant="secondary">{withLoom} with Loom</Badge>
          )}
          {withDeploy > 0 && (
            <Badge variant="secondary">{withDeploy} with deploy</Badge>
          )}
        </div>
      )}

      {/* Submissions */}
      {submissions.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No submissions yet for this week.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => (
            <article
              key={sub.member.handle}
              id={`submission-${sub.member.handle.toLowerCase()}`}
              className="rounded-lg border bg-card p-4 scroll-mt-20"
            >
              <div className="flex items-center gap-3 mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://github.com/${sub.member.handle}.png?size=64`}
                  alt={sub.member.handle}
                  width={36}
                  height={36}
                  className="rounded-full"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/${sub.member.handle}#week-${weekNum}`}
                      className="font-semibold text-sm hover:underline"
                    >
                      {sub.member.projectName}
                    </Link>
                    {(() => {
                      const entry = prMap.get(sub.member.handle.toLowerCase());
                      return entry && entry.status !== "none" ? (
                        <PRStatusBadge entry={entry} size="xs" />
                      ) : null;
                    })()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <Link href={`/${sub.member.handle}`} className="hover:underline">
                      @{sub.member.handle}
                    </Link>
                    {" · "}
                    {new Date(sub.submittedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              {sub.member.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {sub.member.tags.slice(0, 5).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px] py-0">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between">
                <p className="text-sm leading-relaxed flex-1">{sub.shipped}</p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  {(tallyMap.get(sub.member.handle) ?? 0) > 0 && (
                    <span className="text-xs font-medium text-primary tabular-nums">
                      {tallyMap.get(sub.member.handle)} vote{(tallyMap.get(sub.member.handle) ?? 0) !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <VoteButton candidate={sub.member.handle} week={weekNum} />
              </div>
              <div className="mt-2">
                <ReactionBar
                  week={weekNum}
                  handle={sub.member.handle}
                  reactions={weekReactions.filter(
                    (r) => r.handle.toLowerCase() === sub.member.handle.toLowerCase()
                  )}
                />
              </div>
              {sub.loomUrl && (
                <div className="mt-3">
                  <LoomEmbed url={sub.loomUrl} />
                </div>
              )}
              {(sub.loomUrl || sub.deployUrl || sub.repoUrl) && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {sub.loomUrl && (
                    <a
                      href={sub.loomUrl}
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
                  {sub.deployUrl && (
                    <a
                      href={sub.deployUrl}
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
                  {sub.repoUrl && (
                    <a
                      href={sub.repoUrl}
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
            </article>
          ))}
        </div>
      )}

      {/* Leaderboard */}
      {tallies.length > 0 && (
        <>
          <Separator className="my-6" />
          <h2 className="text-sm font-semibold mb-3">
            Votes ({totalVotes} cast)
          </h2>
          <div className="space-y-2">
            {tallies.slice(0, 5).map((t, idx) => {
              const member = submissions.find(
                (s) => s.member.handle === t.handle
              )?.member;
              return (
                <div
                  key={t.handle}
                  className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2"
                >
                  <span className="text-sm font-bold text-muted-foreground w-5 text-center tabular-nums">
                    {idx + 1}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://github.com/${t.handle}.png?size=32`}
                    alt={t.handle}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                  <Link
                    href={`/${t.handle}`}
                    className="text-sm font-medium hover:underline flex-1 truncate"
                  >
                    {member?.projectName ?? t.handle}
                  </Link>
                  <span className="text-sm font-bold tabular-nums text-primary">
                    {t.votes}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Missing */}
      {missingFiltered.length > 0 && (
        <>
          <Separator className="my-6" />
          <CollapsibleSection
            label="Haven't submitted yet"
            count={missingFiltered.length}
            variant="warning"
          >
            <div className="flex flex-wrap gap-2">
              {missingFiltered.map((m) => (
                <Link
                  key={m.handle}
                  href={`/${m.handle}`}
                  className="flex items-center gap-1.5 rounded-full border bg-white px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://github.com/${m.handle}.png?size=32`}
                    alt={m.handle}
                    width={16}
                    height={16}
                    className="rounded-full"
                  />
                  {m.handle}
                </Link>
              ))}
            </div>
          </CollapsibleSection>
        </>
      )}

      {/* Discussion */}
      <Separator className="my-6" />
      <CommentFeed week={weekNum} initialComments={weekComments} />
    </main>
  );
}
