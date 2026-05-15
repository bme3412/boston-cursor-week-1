import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActivityIndicator } from "@/components/activity-indicator";
import { PRStatusBadge } from "@/components/pr-status-badge";
import type { PRStatusEntry } from "@/lib/pr-source";
import type { Member } from "@/lib/types";

export function MemberCard({
  member,
  isYou = false,
  prStatus,
}: {
  member: Member;
  isYou?: boolean;
  prStatus?: PRStatusEntry;
}) {
  const shippedThisWeek = !!prStatus && prStatus.status !== "none";
  // Treat legacy stub entries ("Untitled PM Build" / "Week N project...") as empty.
  const isStub =
    member.projectName === "Untitled PM Build" ||
    member.projectDescription.startsWith("Week ") ||
    member.projectDescription.trim().length === 0;
  const hasProject = !isStub;

  return (
    <Link href={`/${member.handle}`} className="block group">
      <Card
        className={`h-full transition-all group-hover:shadow-md group-hover:border-primary/30 ${
          shippedThisWeek ? "border-l-[3px] border-l-green-500" : ""
        } ${isYou ? "ring-2 ring-primary/30" : ""}`}
        size="sm"
      >
        <CardContent>
          <div className="flex items-center gap-3 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://github.com/${member.handle}.png?size=96`}
              alt={member.handle}
              width={48}
              height={48}
              className={`rounded-full shrink-0 ${isYou ? "ring-2 ring-primary" : ""}`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-semibold text-sm">
                  {hasProject ? member.projectName : `@${member.handle}`}
                </span>
                {isYou && (
                  <Badge variant="default" className="text-[10px] h-4 shrink-0">
                    You
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">
                  @{member.handle}
                </span>
                {prStatus ? (
                  <PRStatusBadge entry={prStatus} size="xs" />
                ) : (
                  <ActivityIndicator member={member} />
                )}
              </div>
            </div>
          </div>
          {hasProject && (
            <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed">
              {member.projectDescription}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
