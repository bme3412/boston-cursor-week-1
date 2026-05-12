import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ActivityIndicator } from "@/components/activity-indicator";
import { getCurrentWeek } from "@/lib/week";
import type { Member } from "@/lib/types";

export function MemberCard({ member }: { member: Member }) {
  const currentWeek = getCurrentWeek();
  const shippedThisWeek = member.updates.some((u) => u.week === currentWeek);

  return (
    <Link href={`/${member.handle}`} className="block group">
      <Card
        className={`h-full transition-all group-hover:shadow-md group-hover:border-primary/30 ${
          shippedThisWeek ? "border-l-[3px] border-l-green-500" : ""
        }`}
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
              className="rounded-full shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-sm">
                {member.projectName}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  @{member.handle}
                </span>
                <ActivityIndicator member={member} />
              </div>
            </div>
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed">
            {member.projectDescription}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
