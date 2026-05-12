import { getCurrentWeek } from "@/lib/week";
import type { Member } from "@/lib/types";

type Status = "active" | "recent" | "inactive";

function getStatus(member: Member): Status {
  const currentWeek = getCurrentWeek();
  const hasCurrentWeek = member.updates.some((u) => u.week === currentWeek);
  if (hasCurrentWeek) return "active";

  const hasPriorWeek = member.updates.some((u) => u.week === currentWeek - 1);
  if (hasPriorWeek) return "recent";

  return "inactive";
}

const dotColor: Record<Status, string> = {
  active: "bg-green-500",
  recent: "bg-yellow-500",
  inactive: "bg-gray-300",
};

function relativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function ActivityIndicator({ member }: { member: Member }) {
  const status = getStatus(member);
  const latest = member.updates.at(-1);

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`inline-block size-2 rounded-full ${dotColor[status]}`} />
      {latest ? (
        <span>Shipped {relativeTime(latest.submittedAt)}</span>
      ) : (
        <span>No updates yet</span>
      )}
    </div>
  );
}
