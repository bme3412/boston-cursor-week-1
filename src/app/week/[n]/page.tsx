import Link from "next/link";
import { notFound } from "next/navigation";
import { Video, ExternalLink, Calendar, Trophy, GitMerge, Mic, GraduationCap } from "lucide-react";
import { getWeekSubmissions, getMissingForWeek } from "@/lib/data";
import { TOTAL_PROGRAM_WEEKS } from "@/lib/week";
import { getWeekInfo, WEEKS } from "@/data/weeks";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CollapsibleSection } from "@/components/collapsible-section";

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
  const [submissions, missing] = await Promise.all([
    getWeekSubmissions(weekNum),
    getMissingForWeek(weekNum),
  ]);

  const withLoom = submissions.filter((s) => s.loomUrl).length;
  const withDeploy = submissions.filter((s) => s.deployUrl).length;

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
      {submissions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary">
            {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
          </Badge>
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
            <div
              key={sub.member.handle}
              className="rounded-lg border bg-card p-4"
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
                  <Link
                    href={`/${sub.member.handle}`}
                    className="font-semibold text-sm hover:underline"
                  >
                    {sub.member.projectName}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    @{sub.member.handle} &middot;{" "}
                    {new Date(sub.submittedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <p className="text-sm leading-relaxed">{sub.shipped}</p>
              {(sub.loomUrl || sub.deployUrl) && (
                <div className="flex gap-2 mt-3">
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
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Missing */}
      {missing.length > 0 && (
        <>
          <Separator className="my-6" />
          <CollapsibleSection
            label="Haven't submitted yet"
            count={missing.length}
            variant="warning"
          >
            <div className="flex flex-wrap gap-2">
              {missing.map((m) => (
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
    </main>
  );
}
