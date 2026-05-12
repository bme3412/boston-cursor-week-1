"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberCard } from "@/components/member-card";
import { useSession } from "next-auth/react";
import type { Member } from "@/lib/types";

const PAGE_SIZE = 24;

export function MemberGrid({ members }: { members: Member[] }) {
  const { data: session } = useSession();
  const handle = session?.user?.handle;
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const q = query.toLowerCase().trim();

  const filtered = useMemo(
    () =>
      q
        ? members.filter(
            (m) =>
              m.handle.toLowerCase().includes(q) ||
              m.projectName.toLowerCase().includes(q) ||
              m.projectDescription.toLowerCase().includes(q) ||
              m.tags.some((t) => t.toLowerCase().includes(q))
          )
        : members,
    [members, q]
  );

  const shown = filtered.slice(0, query ? filtered.length : visible);
  const hasMore = !query && visible < filtered.length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            placeholder="Search people, projects, or tags..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setVisible(PAGE_SIZE);
            }}
            className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <span className="shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
          {filtered.length} member{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>
      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          No members match &ldquo;{query}&rdquo;
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((m) => (
            <MemberCard
              key={m.handle}
              member={m}
              isYou={handle?.toLowerCase() === m.handle.toLowerCase()}
            />
          ))}
        </div>
      )}
      {hasMore && (
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
          >
            Show more ({filtered.length - visible} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}
