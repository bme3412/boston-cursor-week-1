"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function IdentityBar() {
  const { data: session } = useSession();

  if (!session?.user?.handle) {
    return (
      <div className="rounded-lg border bg-card px-4 py-3 mb-6">
        <p className="text-sm text-muted-foreground">
          <Link href="/join" className="text-primary hover:underline">
            Sign in with GitHub
          </Link>{" "}
          to vote, react, and submit updates.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card px-4 py-2.5 flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://github.com/${session.user.handle}.png?size=48`}
          alt=""
          width={20}
          height={20}
          className="rounded-full"
        />
        <span className="text-sm">
          Signed in as{" "}
          <span className="font-medium">@{session.user.handle}</span>
        </span>
      </div>
      <Button variant="ghost" size="xs" onClick={() => signOut()}>
        Sign out
      </Button>
    </div>
  );
}
