"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";

type Props = {
  handle: string;
  initial: {
    projectName: string;
    projectDescription: string;
    projectUrl?: string;
    repoUrl?: string;
  };
};

const STUB_NAME = "Untitled PM Build";
const isStubText = (s: string) => s === STUB_NAME || s.startsWith("Week ");

export function EditProfileCard({ handle, initial }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projectName, setProjectName] = useState(
    isStubText(initial.projectName) ? "" : initial.projectName
  );
  const [projectDescription, setProjectDescription] = useState(
    isStubText(initial.projectDescription) ? "" : initial.projectDescription
  );
  const [projectUrl, setProjectUrl] = useState(initial.projectUrl ?? "");
  const [repoUrl, setRepoUrl] = useState(initial.repoUrl ?? "");

  const isOwner =
    session?.user?.handle?.toLowerCase() === handle.toLowerCase();

  if (!isOwner) return null;

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: projectName.trim(),
          projectDescription: projectDescription.trim(),
          projectUrl: projectUrl.trim(),
          repoUrl: repoUrl.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border-2 border-primary/20 bg-primary/5 px-4 py-3 mb-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Badge variant="default">Your profile</Badge>
          <span className="text-sm text-muted-foreground">
            This is how others see you
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Cancel" : "Edit profile"}
          </Button>
          <Link
            href="/submit"
            className={buttonVariants({ variant: "outline", size: "xs" })}
          >
            Submit update
          </Link>
        </div>
      </div>

      {open && (
        <form onSubmit={onSave} className="mt-3 space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">
              Project name
            </label>
            <input
              type="text"
              required
              maxLength={80}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Launchpad"
              className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">
              Description
            </label>
            <textarea
              required
              maxLength={280}
              rows={3}
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="One or two sentences about what you're building."
              className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              {projectDescription.length}/280
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">
                Live URL
              </label>
              <input
                type="url"
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Repo URL
              </label>
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
