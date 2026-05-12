"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { buttonVariants } from "@/components/ui/button";

export function NavUser() {
  const { data: session } = useSession();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    // Clear gate cookie first
    await fetch("/api/signout", { method: "POST" });
    // Then sign out of GitHub session, redirect to gate
    signOut({ callbackUrl: "/gate" });
  }

  if (session?.user?.handle) {
    return (
      <div className="flex items-center gap-1.5">
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
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
          title="Sign out"
        >
          <LogOut className="size-3.5" />
        </button>
      </div>
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
