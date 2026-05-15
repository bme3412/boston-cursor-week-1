import { getMembersByActivity } from "@/lib/data";
import { getPRStatusForWeek, submissionBranchForWeek } from "@/lib/pr-source";
import { getCurrentWeek } from "@/lib/week";
import { getWeekInfo } from "@/data/weeks";
import { MemberGrid } from "@/components/member-grid";
import { CohortDashboard } from "@/components/cohort-dashboard";
import { YourStatusCard } from "@/components/your-status-card";
import type { PRStatusEntry } from "@/lib/pr-source";

export default async function Home() {
  const week = getCurrentWeek();
  const weekInfo = getWeekInfo(week);
  const [members, prMap] = await Promise.all([
    getMembersByActivity(),
    getPRStatusForWeek(week),
  ]);

  // Flatten map to plain object for the client component prop.
  const prStatusByHandle: Record<string, PRStatusEntry> = {};
  for (const [k, v] of prMap.entries()) prStatusByHandle[k] = v;

  let merged = 0;
  let open = 0;
  for (const entry of prMap.values()) {
    if (entry.status === "merged") merged++;
    else if (entry.status === "open" || entry.status === "draft") open++;
  }
  const totalMembers = members.length;
  const noPR = Math.max(0, totalMembers - merged - open);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Cursor Boston Cohort 1
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          100 builders, 6 weeks, shipping from Boston. See what everyone&apos;s
          working on.
        </p>
      </div>
      {weekInfo && (
        <CohortDashboard
          week={week}
          weekTitle={weekInfo.title}
          deadline={weekInfo.deadline}
          deadlineLabel={weekInfo.deadlineLabel}
          totalMembers={totalMembers}
          merged={merged}
          open={open}
          noPR={noPR}
        />
      )}
      {weekInfo && (
        <YourStatusCard
          prStatusByHandle={prStatusByHandle}
          week={week}
          deadlineLabel={weekInfo.deadlineLabel}
          submissionBranch={submissionBranchForWeek(week)}
        />
      )}
      <MemberGrid members={members} prStatusByHandle={prStatusByHandle} />
    </main>
  );
}
