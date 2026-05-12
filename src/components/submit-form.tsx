"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { IdentityBar } from "@/components/identity-bar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getCurrentWeek } from "@/lib/week";

export function SubmitForm() {
  const currentWeek = getCurrentWeek();
  const { data: session } = useSession();
  const handle = session?.user?.handle;
  const [week, setWeek] = useState(currentWeek);
  const [shipped, setShipped] = useState("");
  const [loomUrl, setLoomUrl] = useState("");
  const [deployUrl, setDeployUrl] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit() {
    if (!handle) return;
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
    } catch {
      setStatus("error");
      setErrorMsg("Network error — try again");
    }
  }

  const ready = handle && shipped.trim() && status !== "loading";

  if (status === "success") {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <div className="text-2xl mb-2">Shipped.</div>
        <p className="text-sm text-muted-foreground mb-4">
          Week {week} update saved for @{handle}.
        </p>
        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setStatus("idle");
              setShipped("");
              setLoomUrl("");
              setDeployUrl("");
            }}
          >
            Submit another
          </Button>
          <Button
            onClick={() =>
              (window.location.href = `/${handle}`)
            }
          >
            View profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <IdentityBar />

      {!handle && (
        <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Sign in above to submit your weekly update.
        </div>
      )}

      {handle && (
        <>
          {/* Week selector */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Week</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWeek(w)}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    w === week
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* What you shipped */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              What did you ship? <span className="text-destructive">*</span>
            </label>
            <textarea
              placeholder="Built the auth flow, deployed to prod, added unit tests..."
              value={shipped}
              onChange={(e) => setShipped(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          {/* Links */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Loom URL
              </label>
              <Input
                placeholder="https://www.loom.com/share/..."
                value={loomUrl}
                onChange={(e) => setLoomUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Deploy URL
              </label>
              <Input
                placeholder="https://my-app.vercel.app"
                value={deployUrl}
                onChange={(e) => setDeployUrl(e.target.value)}
              />
            </div>
          </div>

          {/* Error */}
          {status === "error" && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-2 text-sm text-destructive">
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <Button
            disabled={!ready}
            onClick={handleSubmit}
            className="w-full sm:w-auto"
          >
            {status === "loading" ? "Submitting..." : `Submit Week ${week}`}
          </Button>
        </>
      )}
    </div>
  );
}
