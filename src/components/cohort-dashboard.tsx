import Link from "next/link";
import { Calendar, GitPullRequest, Check } from "lucide-react";
import { DeadlineCountdown } from "@/components/deadline-countdown";

type Props = {
  week: number;
  weekTitle: string;
  deadline: string;
  deadlineLabel: string;
  totalMembers: number;
  merged: number;
  open: number;
  noPR: number;
};

export function CohortDashboard({
  week,
  weekTitle,
  deadline,
  deadlineLabel,
  totalMembers,
  merged,
  open,
  noPR,
}: Props) {
  const shipped = merged + open;
  const pct = totalMembers > 0 ? Math.round((shipped / totalMembers) * 100) : 0;

  return (
    <div className="rounded-xl border bg-card p-4 mb-6">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Week {week}
          </span>
          <Link
            href={`/week/${week}`}
            className="text-sm font-semibold truncate hover:underline"
          >
            {weekTitle}
          </Link>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Calendar className="size-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">{deadlineLabel}</span>
          <span className="text-muted-foreground">·</span>
          <DeadlineCountdown deadline={deadline} />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-medium tabular-nums text-muted-foreground shrink-0">
          {shipped}/{totalMembers} shipped
        </span>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        <span className="inline-flex items-center gap-1 text-green-700">
          <Check className="size-3" />
          <span className="tabular-nums font-medium">{merged}</span> merged
        </span>
        <span className="inline-flex items-center gap-1 text-blue-700">
          <GitPullRequest className="size-3" />
          <span className="tabular-nums font-medium">{open}</span> PR open
        </span>
        <span className="inline-flex items-center gap-1 text-amber-700">
          <span className="size-2 rounded-full bg-amber-400 inline-block" />
          <span className="tabular-nums font-medium">{noPR}</span> no PR yet
        </span>
      </div>
    </div>
  );
}
