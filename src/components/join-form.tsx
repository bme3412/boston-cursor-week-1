"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const TAG_OPTIONS = [
  "ai",
  "analytics",
  "api",
  "automation",
  "build-in-public",
  "ci-cd",
  "community",
  "design-system",
  "devtools",
  "education",
  "fintech",
  "gamification",
  "nextjs",
  "pm",
  "productivity",
  "real-time",
  "ui",
];

export function JoinForm() {
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSubmit() {
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: handle.trim(),
          projectName: projectName.trim(),
          projectDescription: description.trim(),
          ...(projectUrl.trim() && { projectUrl: projectUrl.trim() }),
          ...(repoUrl.trim() && { repoUrl: repoUrl.trim() }),
          tags,
          pin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error ?? "Something went wrong");
        return;
      }

      setStatus("success");
      // Redirect to their new profile after a moment
      setTimeout(() => router.push(`/${handle.trim()}`), 1500);
    } catch {
      setStatus("error");
      setErrorMsg("Network error — try again");
    }
  }

  const ready =
    handle.trim() && projectName.trim() && description.trim() && pin.length >= 4 && status !== "loading";

  if (status === "success") {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <div className="text-2xl mb-2">You're in.</div>
        <p className="text-sm text-muted-foreground">
          Redirecting to your profile...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Handle */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          GitHub username <span className="text-destructive">*</span>
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

      {/* Project name */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          Project name <span className="text-destructive">*</span>
        </label>
        <Input
          placeholder="My PM Tool"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          One-line description <span className="text-destructive">*</span>
        </label>
        <Input
          placeholder="A kanban board that tracks who shipped what each week."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* URLs */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Deployed URL
          </label>
          <Input
            placeholder="https://my-app.vercel.app"
            value={projectUrl}
            onChange={(e) => setProjectUrl(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Repo URL
          </label>
          <Input
            placeholder="https://github.com/you/repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          Tags (pick up to 3)
        </label>
        <div className="flex flex-wrap gap-2">
          {TAG_OPTIONS.map((tag) => {
            const selected = tags.includes(tag);
            const disabled = !selected && tags.length >= 3;
            return (
              <button
                key={tag}
                type="button"
                disabled={disabled}
                onClick={() => toggleTag(tag)}
                className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  selected
                    ? "border-foreground bg-foreground text-background"
                    : disabled
                      ? "border-border text-muted-foreground/40 cursor-not-allowed"
                      : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* PIN */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          PIN <span className="text-destructive">*</span>
        </label>
        <Input
          type="password"
          placeholder="At least 4 characters"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="max-w-48"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          You&apos;ll need this to submit weekly updates. Don&apos;t lose it.
        </p>
      </div>

      {/* Error */}
      {status === "error" && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {errorMsg}
        </div>
      )}

      {/* Submit */}
      <div className="pt-2">
        <Button
          disabled={!ready}
          onClick={handleSubmit}
          className="w-full sm:w-auto"
        >
          {status === "loading" ? "Joining..." : "Join the cohort"}
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          Your profile will appear on the feed instantly.
        </p>
      </div>
    </div>
  );
}
