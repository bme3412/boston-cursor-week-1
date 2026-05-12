"use client";

import { useState } from "react";
import { useIdentity } from "@/components/identity-context";
import { Button } from "@/components/ui/button";

export function VoteButton({
  candidate,
  week,
}: {
  candidate: string;
  week: number;
}) {
  const { identity } = useIdentity();
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function castVote() {
    if (!identity) return;
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voter: identity.handle,
          pin: identity.pin,
          week,
          candidate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error ?? "Failed");
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg("Network error");
    }
  }

  if (status === "success") {
    return (
      <span className="text-xs text-primary font-medium">Voted!</span>
    );
  }

  if (!identity) {
    return (
      <span className="text-xs text-muted-foreground">Sign in to vote</span>
    );
  }

  if (identity.handle.toLowerCase() === candidate.toLowerCase()) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="xs"
        disabled={status === "loading"}
        onClick={castVote}
      >
        {status === "loading" ? "Voting..." : "Vote"}
      </Button>
      {status === "error" && (
        <span className="text-xs text-destructive">{errorMsg}</span>
      )}
    </div>
  );
}
