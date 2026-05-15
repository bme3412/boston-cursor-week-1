"use client";

import Link from "next/link";
import { MapPin, Hammer } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { FLAIR_BY_ID, FLAIR_COLOR_CLASSES } from "@/lib/flair";
import type { Member } from "@/lib/types";

export function AuthorHoverCard({
  handle,
  member,
  children,
}: {
  handle: string;
  member?: Member;
  children: React.ReactNode;
}) {
  return (
    <HoverCard>
      <HoverCardTrigger render={<span className="inline-flex" />}>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-72 p-3" align="start">
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://github.com/${handle}.png?size=96`}
            alt={handle}
            width={40}
            height={40}
            className="rounded-full shrink-0"
          />
          <div className="min-w-0 flex-1">
            <Link
              href={`/${handle}`}
              className="text-sm font-semibold hover:underline"
            >
              @{handle}
            </Link>
            {member?.projectName && member.projectName !== handle && (
              <div className="text-xs text-muted-foreground truncate">
                {member.projectName}
              </div>
            )}
          </div>
        </div>

        {member?.bio && (
          <p className="text-xs text-foreground/80 mt-2 leading-relaxed">
            {member.bio}
          </p>
        )}

        {(member?.location || member?.currentlyBuilding) && (
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            {member?.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="size-3" />
                <span className="truncate">{member.location}</span>
              </div>
            )}
            {member?.currentlyBuilding && (
              <div className="flex items-center gap-1.5">
                <Hammer className="size-3" />
                <span className="truncate">{member.currentlyBuilding}</span>
              </div>
            )}
          </div>
        )}

        {member?.flair && member.flair.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {member.flair.map((id) => {
              const f = FLAIR_BY_ID[id];
              if (!f) return null;
              return (
                <span
                  key={id}
                  className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${FLAIR_COLOR_CLASSES[f.color]}`}
                >
                  <span aria-hidden>{f.emoji}</span>
                  <span>{f.label}</span>
                </span>
              );
            })}
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
