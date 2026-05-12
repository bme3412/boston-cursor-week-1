"use client";

import { useState } from "react";
import { useIdentity } from "@/components/identity-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function IdentityBar() {
  const { identity, signIn, signOut } = useIdentity();
  const [handle, setHandle] = useState("");
  const [pin, setPin] = useState("");
  const [mode, setMode] = useState<"signin" | "claim">("signin");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSignIn() {
    // Verify the PIN works by hitting a lightweight check
    // For now, just save it — the next API call will validate
    signIn(handle, pin);
  }

  async function handleClaim() {
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: handle.trim(), pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error ?? "Something went wrong");
        return;
      }

      // Claim succeeded — sign in
      signIn(handle.trim(), pin);
      setStatus("idle");
    } catch {
      setStatus("error");
      setErrorMsg("Network error — try again");
    }
  }

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
            Signed in as{" "}
            <span className="font-medium">@{identity.handle}</span>
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
      {mode === "signin" ? (
        <>
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
              disabled={!handle || pin.length < 4}
              onClick={handleSignIn}
            >
              Sign in
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            First time?{" "}
            <button
              className="text-primary hover:underline"
              onClick={() => setMode("claim")}
            >
              Claim your account
            </button>{" "}
            to set a PIN.
          </p>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-2">
            Claim your account — set a PIN for the first time
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
              placeholder="Choose a PIN (4+ chars)"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="h-8 w-44 text-sm"
            />
            <Button
              size="sm"
              disabled={!handle || pin.length < 4 || status === "loading"}
              onClick={handleClaim}
            >
              {status === "loading" ? "Claiming..." : "Set PIN & sign in"}
            </Button>
          </div>
          {status === "error" && (
            <p className="text-xs text-destructive mt-2">{errorMsg}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Already have a PIN?{" "}
            <button
              className="text-primary hover:underline"
              onClick={() => {
                setMode("signin");
                setStatus("idle");
                setErrorMsg("");
              }}
            >
              Sign in instead
            </button>
          </p>
        </>
      )}
    </div>
  );
}
