"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Rocket } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function GatePage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    const res = await fetch("/api/gate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Rocket className="size-8 text-primary mx-auto mb-3" />
          <h1 className="text-2xl font-bold tracking-tight">Launchpad</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cursor Boston &middot; Cohort 1
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="Cohort password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setStatus("idle");
              }}
              autoFocus
            />
          </div>

          {status === "error" && (
            <p className="text-xs text-destructive text-center">
              Wrong password. Try again.
            </p>
          )}

          <Button
            type="submit"
            disabled={!password || status === "loading"}
            className="w-full"
          >
            {status === "loading" ? "Checking..." : "Enter"}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Ask in the Discord if you don&apos;t have the password.
        </p>
      </div>
    </main>
  );
}
