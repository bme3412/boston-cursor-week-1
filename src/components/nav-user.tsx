"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { buttonVariants } from "@/components/ui/button";

export function NavUser() {
  const { data: session } = useSession();

  if (session?.user?.handle) {
    return (
      <Link
        href={`/${session.user.handle}`}
        className="flex items-center gap-1.5 rounded-full border px-2 py-1 hover:bg-accent transition-colors"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://github.com/${session.user.handle}.png?size=48`}
          alt=""
          width={20}
          height={20}
          className="rounded-full"
        />
        <span className="text-xs font-medium hidden sm:inline">
          {session.user.handle}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/join"
      className={buttonVariants({ variant: "outline", size: "xs" })}
    >
      Sign In
    </Link>
  );
}
