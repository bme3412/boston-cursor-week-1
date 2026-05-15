"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Check, GitPullRequest, FileText, AlertCircle } from "lucide-react";
import type { PRStatusEntry } from "@/lib/pr-source";

type Props = {
  prStatusByHandle: Record<string, PRStatusEntry>;
  week: number;
  deadlineLabel: string;
  submissionBranch: string | null;
};

const UPSTREAM_REPO_URL =
  "https://github.com/rogerSuperBuilderAlpha/cursor-boston";

export function YourStatusCard({
  prStatusByHandle,
  week,
  deadlineLabel,
  submissionBranch,
}: Props) {
  const { data: session, status: sessionStatus } = useSession();
  if (sessionStatus !== "authenticated") return null;
  const handle = session?.user?.handle;
  if (!handle) return null;

  const entry = prStatusByHandle[handle.toLowerCase()];
  const status = entry?.status ?? "none";

  let icon = <AlertCircle className="size-4" />;
  let title = "You haven't opened a PR yet";
  let tone = "border-amber-200 bg-amber-50 text-amber-900";
  let body: React.ReactNode = (
    <>
      Add a folder with your GitHub handle to the{" "}
      <code className="rounded bg-amber-100 px-1 py-0.5 text-[11px] font-mono">
        {submissionBranch ?? "submission"}
      </code>{" "}
      branch and open a PR upstream. Deadline: {deadlineLabel}.
    </>
  );

  if (status === "merged") {
    icon = <Check className="size-4" />;
    title = "Your PR is merged";
    tone = "border-green-200 bg-green-50 text-green-900";
    body = (
      <>
        Nice — Week {week} submission accepted. You&apos;ll appear in the
        Friday vote.
      </>
    );
  } else if (status === "open") {
    icon = <GitPullRequest className="size-4" />;
    title = "Your PR is open";
    tone = "border-blue-200 bg-blue-50 text-blue-900";
    body = (
      <>
        Waiting on review. Keep iterating; the deadline is {deadlineLabel}.
      </>
    );
  } else if (status === "draft") {
    icon = <FileText className="size-4" />;
    title = "Your PR is a draft";
    tone = "border-slate-200 bg-slate-50 text-slate-700";
    body = (
      <>Mark it ready for review before {deadlineLabel} to be counted.</>
    );
  }

  const prUrl = entry?.pr?.htmlUrl;
  const newPrUrl = submissionBranch
    ? `${UPSTREAM_REPO_URL}/compare/${submissionBranch}...${handle}:${UPSTREAM_REPO_URL.split("/").pop()}:main?expand=1`
    : UPSTREAM_REPO_URL;

  return (
    <div className={`rounded-xl border p-4 mb-6 ${tone}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0">{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm font-semibold">{title}</span>
            <Link
              href={`/${handle}`}
              className="text-xs underline opacity-80 hover:opacity-100"
            >
              your profile
            </Link>
          </div>
          <p className="text-xs mt-1 leading-relaxed opacity-90">{body}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            {prUrl ? (
              <a
                href={prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline"
              >
                View your PR
                {entry?.pr ? ` #${entry.pr.number}` : ""}
              </a>
            ) : (
              <a
                href={newPrUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline"
              >
                Open a PR
              </a>
            )}
            <a
              href={UPSTREAM_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-80 hover:opacity-100"
            >
              Upstream repo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
