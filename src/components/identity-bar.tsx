"use client";

import { useState } from "react";
import { useIdentity } from "@/components/identity-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function IdentityBar() {
  const { identity, signIn, signOut } = useIdentity();
  const [handle, setHandle] = useState("");
  const [pin, setPin] = useState("");

  if (identity) {
    return (
      <div className="rounded-lg border bg-card px-4 py-2.5 flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://github.com/${identity.handle}.png?size=48`}
            alt=""
            width={20}
            height={20}
            className="rounded-full"
          />
          <span className="text-sm">
            Signed in as <span className="font-medium">@{identity.handle}</span>
          </span>
        </div>
        <Button variant="ghost" size="xs" onClick={signOut}>
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card px-4 py-3 mb-6">
      <p className="text-sm text-muted-foreground mb-2">
        Sign in to vote and submit updates
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-muted-foreground">@</span>
          <Input
            placeholder="handle"
            value={handle}
            onChange={(e) => setHandle(e.target.value.trim())}
            className="h-8 w-32 text-sm"
          />
        </div>
        <Input
          type="password"
          placeholder="PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="h-8 w-24 text-sm"
        />
        <Button
          size="sm"
          disabled={!handle || !pin}
          onClick={() => signIn(handle, pin)}
        >
          Sign in
        </Button>
      </div>
    </div>
  );
}
