import { Check, GitPullRequest, FileText, Circle } from "lucide-react";
import type { PRStatus, PRStatusEntry } from "@/lib/pr-source";

const COPY: Record<PRStatus, { label: string; classes: string; Icon: typeof Check }> = {
  merged: {
    label: "Merged",
    classes: "bg-green-100 text-green-900 border-green-200",
    Icon: Check,
  },
  open: {
    label: "PR open",
    classes: "bg-blue-100 text-blue-900 border-blue-200",
    Icon: GitPullRequest,
  },
  draft: {
    label: "Draft",
    classes: "bg-slate-100 text-slate-700 border-slate-200",
    Icon: FileText,
  },
  none: {
    label: "No PR",
    classes: "bg-amber-50 text-amber-900 border-amber-200",
    Icon: Circle,
  },
};

export function PRStatusBadge({
  entry,
  size = "sm",
  showWhenNone = true,
}: {
  entry: PRStatusEntry;
  size?: "xs" | "sm";
  showWhenNone?: boolean;
}) {
  if (entry.status === "none" && !showWhenNone) return null;
  const { label, classes, Icon } = COPY[entry.status];
  const sizing =
    size === "xs"
      ? "px-1.5 py-0.5 text-[10px] gap-0.5"
      : "px-2 py-0.5 text-xs gap-1";
  const iconSize = size === "xs" ? "size-2.5" : "size-3";

  const inner = (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${classes} ${sizing}`}
    >
      <Icon className={iconSize} />
      {label}
      {entry.pr && (size === "sm") && (
        <span className="opacity-60">#{entry.pr.number}</span>
      )}
    </span>
  );

  if (entry.pr) {
    return (
      <a
        href={entry.pr.htmlUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={entry.pr.title}
        className="hover:opacity-80 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        {inner}
      </a>
    );
  }
  return inner;
}
