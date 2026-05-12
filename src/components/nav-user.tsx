"use client";

import Link from "next/link";
import { useIdentity } from "@/components/identity-context";
import { buttonVariants } from "@/components/ui/button";

export function NavUser() {
  const { identity } = useIdentity();

  if (identity) {
    return (
      <Link
        href={`/${identity.handle}`}
        className="flex items-center gap-1.5 rounded-full border px-2 py-1 hover:bg-accent transition-colors"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://github.com/${identity.handle}.png?size=48`}
          alt=""
          width={20}
          height={20}
          className="rounded-full"
        />
        <span className="text-xs font-medium hidden sm:inline">
          {identity.handle}
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
