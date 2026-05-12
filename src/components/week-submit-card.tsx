"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useIdentity } from "@/components/identity-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function WeekSubmitCard({ week }: { week: number }) {
  const { identity } = useIdentity();
  const router = useRouter();
  const [shipped, setShipped] = useState("");
  const [loomUrl, setLoomUrl] = useState("");
  const [deployUrl, setDeployUrl] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (!identity) return null;

  async function handleSubmit() {
    if (!identity) return;
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: identity.handle,
          pin: identity.pin,
          week,
          shipped: shipped.trim(),
          ...(loomUrl.trim() && { loomUrl: loomUrl.trim() }),
          ...(deployUrl.trim() && { deployUrl: deployUrl.trim() }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error ?? "Something went wrong");
        return;
      }

      setStatus("success");
      router.refresh();
    } catch {
      setStatus("error");
      setErrorMsg("Network error — try again");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-lg border-2 border-green-500/30 bg-green-50 p-4 text-center mb-6">
        <p className="text-sm font-medium">
          Week {week} update submitted.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 mb-6">
      <p className="text-sm font-medium mb-3">
        Submit your Week {week} update
      </p>
      <div className="space-y-3">
        <textarea
          placeholder="What did you ship this week?"
          value={shipped}
          onChange={(e) => setShipped(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="Loom URL (optional)"
            value={loomUrl}
            onChange={(e) => setLoomUrl(e.target.value)}
          />
          <Input
            placeholder="Deploy URL (optional)"
            value={deployUrl}
            onChange={(e) => setDeployUrl(e.target.value)}
          />
        </div>

        {status === "error" && (
          <p className="text-xs text-destructive">{errorMsg}</p>
        )}

        <Button
          size="sm"
          disabled={!shipped.trim() || status === "loading"}
          onClick={handleSubmit}
        >
          {status === "loading" ? "Submitting..." : "Ship it"}
        </Button>
      </div>
    </div>
  );
}
