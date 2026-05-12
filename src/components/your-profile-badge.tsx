"use client";

import Link from "next/link";
import { useIdentity } from "@/components/identity-context";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export function YourProfileBadge({ handle }: { handle: string }) {
  const { identity } = useIdentity();

  if (!identity || identity.handle.toLowerCase() !== handle.toLowerCase()) {
    return null;
  }

  return (
    <div className="rounded-lg border-2 border-primary/20 bg-primary/5 px-4 py-3 flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <Badge variant="default">Your profile</Badge>
        <span className="text-sm text-muted-foreground">
          This is how others see you
        </span>
      </div>
      <Link
        href="/submit"
        className={buttonVariants({ variant: "outline", size: "xs" })}
      >
        Submit update
      </Link>
    </div>
  );
}
