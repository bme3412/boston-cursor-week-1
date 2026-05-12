"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useIdentity } from "@/components/identity-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { JoinForm } from "@/components/join-form";

export function SignInPage() {
  const router = useRouter();
  const { identity, signIn, signOut } = useIdentity();
  const [handle, setHandle] = useState("");
  const [pin, setPin] = useState("");
  const [mode, setMode] = useState<"signin" | "claim" | "register">("signin");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (identity) {
    return (
      <main className="mx-auto max-w-xl px-4 py-8">
        <div className="rounded-lg border bg-card p-8 text-center">
          <div className="text-lg font-medium mb-1">
            Signed in as <span className="font-bold">@{identity.handle}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            You&apos;re all set. Go back to the feed or sign out.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={() => router.push("/")}>
              Back to feed
            </Button>
            <Button variant="ghost" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
      </main>
    );
  }

  function handleSignIn() {
    signIn(handle.trim(), pin);
    router.push("/");
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

      signIn(handle.trim(), pin);
      router.push("/");
    } catch {
      setStatus("error");
      setErrorMsg("Network error — try again");
    }
  }

  if (mode === "register") {
    return (
      <main className="mx-auto max-w-xl px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">
          Join the cohort
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Add yourself to the Cursor Boston feed. Takes 30 seconds &mdash; your
          profile goes live instantly.
        </p>
        <JoinForm />
        <p className="text-xs text-muted-foreground mt-6 text-center">
          Already have an account?{" "}
          <button
            className="text-primary hover:underline"
            onClick={() => {
              setMode("signin");
              setStatus("idle");
              setErrorMsg("");
            }}
          >
            Sign in
          </button>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight mb-1">Sign in</h1>
      <p className="text-sm text-muted-foreground mb-8">
        {mode === "signin"
          ? "Enter your handle and PIN to sign in."
          : "First time? Set a PIN to claim your account."}
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            GitHub username
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">@</span>
            <Input
              placeholder="your-handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value.trim())}
            />
          </div>
          {handle && (
            <div className="mt-2 flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://github.com/${handle}.png?size=48`}
                alt=""
                width={24}
                height={24}
                className="rounded-full"
              />
              <span className="text-xs text-muted-foreground">
                Looks right?
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            {mode === "claim" ? "Choose a PIN (4+ characters)" : "PIN"}
          </label>
          <Input
            type="password"
            placeholder={
              mode === "claim" ? "Choose a PIN" : "Enter your PIN"
            }
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="max-w-48"
          />
        </div>

        {status === "error" && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-2 text-sm text-destructive">
            {errorMsg}
          </div>
        )}

        <div className="pt-2">
          {mode === "signin" ? (
            <Button
              disabled={!handle.trim() || pin.length < 4}
              onClick={handleSignIn}
              className="w-full sm:w-auto"
            >
              Sign in
            </Button>
          ) : (
            <Button
              disabled={!handle.trim() || pin.length < 4 || status === "loading"}
              onClick={handleClaim}
              className="w-full sm:w-auto"
            >
              {status === "loading" ? "Claiming..." : "Set PIN & sign in"}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-2 text-xs text-muted-foreground text-center">
        {mode === "signin" ? (
          <>
            <p>
              Existing member without a PIN?{" "}
              <button
                className="text-primary hover:underline"
                onClick={() => {
                  setMode("claim");
                  setStatus("idle");
                  setErrorMsg("");
                }}
              >
                Claim your account
              </button>
            </p>
            <p>
              New here?{" "}
              <button
                className="text-primary hover:underline"
                onClick={() => {
                  setMode("register");
                  setStatus("idle");
                  setErrorMsg("");
                }}
              >
                Join the cohort
              </button>
            </p>
          </>
        ) : (
          <p>
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
        )}
      </div>
    </main>
  );
}
