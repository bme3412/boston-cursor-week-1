"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  FLAIR_CATALOG,
  FLAIR_COLOR_CLASSES,
  FLAIR_GROUP_LABEL,
  FLAIR_GROUP_ORDER,
  MAX_FLAIR,
} from "@/lib/flair";

type Props = {
  handle: string;
  initial: {
    projectName: string;
    projectDescription: string;
    projectUrl?: string;
    repoUrl?: string;
    bio?: string;
    location?: string;
    currentlyBuilding?: string;
    flair?: string[];
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
  const [bio, setBio] = useState(initial.bio ?? "");
  const [location, setLocation] = useState(initial.location ?? "");
  const [currentlyBuilding, setCurrentlyBuilding] = useState(
    initial.currentlyBuilding ?? ""
  );
  const [selectedFlair, setSelectedFlair] = useState<string[]>(
    initial.flair ?? []
  );

  const isOwner =
    session?.user?.handle?.toLowerCase() === handle.toLowerCase();

  if (!isOwner) return null;

  function toggleFlair(id: string) {
    setSelectedFlair((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_FLAIR) return prev;
      return [...prev, id];
    });
  }

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
          bio: bio.trim(),
          location: location.trim(),
          currentlyBuilding: currentlyBuilding.trim(),
          flair: selectedFlair,
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

          {/* About: bio / location / currently building */}
          <div>
            <label className="block text-xs font-medium mb-1">
              Bio
            </label>
            <textarea
              maxLength={140}
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A one-liner about you — shown under your name."
              className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              {bio.length}/140
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">
                Location
              </label>
              <input
                type="text"
                maxLength={60}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Cambridge, MA"
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Currently building
              </label>
              <input
                type="text"
                maxLength={120}
                value={currentlyBuilding}
                onChange={(e) => setCurrentlyBuilding(e.target.value)}
                placeholder="Adding flair to /[handle]"
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Flair picker */}
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <label className="block text-xs font-medium">Flair</label>
              <span className="text-[10px] text-muted-foreground">
                {selectedFlair.length}/{MAX_FLAIR} — shows on your profile
              </span>
            </div>
            <div className="space-y-2 rounded-md border bg-background/50 p-3">
              {FLAIR_GROUP_ORDER.map((group) => {
                const items = FLAIR_CATALOG.filter((f) => f.group === group);
                if (items.length === 0) return null;
                return (
                  <div key={group}>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      {FLAIR_GROUP_LABEL[group]}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((f) => {
                        const isSelected = selectedFlair.includes(f.id);
                        const atCap =
                          !isSelected && selectedFlair.length >= MAX_FLAIR;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => toggleFlair(f.id)}
                            disabled={atCap}
                            aria-pressed={isSelected}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors ${
                              isSelected
                                ? FLAIR_COLOR_CLASSES[f.color]
                                : atCap
                                ? "bg-muted text-muted-foreground/50 ring-border/50 cursor-not-allowed"
                                : "bg-muted text-muted-foreground ring-border hover:bg-muted/80"
                            }`}
                          >
                            <span aria-hidden>{f.emoji}</span>
                            {f.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
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
