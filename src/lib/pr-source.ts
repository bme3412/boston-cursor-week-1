/**
 * Fetch PRs against an upstream "submission" branch and map by author handle.
 * This is the canonical source of truth for whether a cohort member has
 * "shipped" — an open or merged PR adding their handle file counts as shipped.
 */

const UPSTREAM_OWNER = "rogerSuperBuilderAlpha";
const UPSTREAM_REPO = "cursor-boston";

export type PRStatus = "merged" | "open" | "draft" | "none";

export type PRRecord = {
  number: number;
  htmlUrl: string;
  title: string;
  state: "open" | "closed";
  draft: boolean;
  mergedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: string;
};

type GitHubPR = {
  number: number;
  state: "open" | "closed";
  draft: boolean;
  title: string;
  html_url: string;
  merged_at: string | null;
  created_at: string;
  updated_at: string;
  user: { login: string } | null;
};

/** Per-week submission branches. Add new entries as new weeks open. */
const WEEK_BRANCHES: Record<number, string> = {
  1: "c1w1pm-submission",
};

export function submissionBranchForWeek(week: number): string | null {
  return WEEK_BRANCHES[week] ?? null;
}

async function fetchUpstreamPRs(base: string): Promise<PRRecord[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const all: PRRecord[] = [];
  // Walk pages until we get fewer than 100 results.
  for (let page = 1; page <= 5; page++) {
    const url = `https://api.github.com/repos/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/pulls?base=${base}&state=all&per_page=100&page=${page}`;
    const res = await fetch(url, { headers, next: { revalidate: 3600 } });
    if (!res.ok) return all;
    const batch = (await res.json()) as GitHubPR[];
    for (const pr of batch) {
      if (!pr.user) continue;
      all.push({
        number: pr.number,
        htmlUrl: pr.html_url,
        title: pr.title,
        state: pr.state,
        draft: pr.draft,
        mergedAt: pr.merged_at,
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
        user: pr.user.login,
      });
    }
    if (batch.length < 100) break;
  }
  return all;
}

export type PRStatusEntry = {
  status: PRStatus;
  pr: PRRecord | null;
};

/**
 * Returns a lowercased-handle-keyed map of PR status for a week. Members
 * without a matching PR get `{ status: "none", pr: null }` lazily — callers
 * should default that themselves.
 */
export async function getPRStatusForWeek(
  week: number
): Promise<Map<string, PRStatusEntry>> {
  const base = submissionBranchForWeek(week);
  if (!base) return new Map();

  const prs = await fetchUpstreamPRs(base);
  const byHandle = new Map<string, PRStatusEntry>();

  for (const pr of prs) {
    const key = pr.user.toLowerCase();
    const status: PRStatus = pr.mergedAt
      ? "merged"
      : pr.draft
        ? "draft"
        : "open";
    const existing = byHandle.get(key);
    // Prefer merged > open > draft, then latest-updated within tier.
    if (!existing) {
      byHandle.set(key, { status, pr });
      continue;
    }
    const rank: Record<PRStatus, number> = {
      merged: 3,
      open: 2,
      draft: 1,
      none: 0,
    };
    if (
      rank[status] > rank[existing.status] ||
      (rank[status] === rank[existing.status] &&
        pr.updatedAt > (existing.pr?.updatedAt ?? ""))
    ) {
      byHandle.set(key, { status, pr });
    }
  }

  return byHandle;
}

export function lookupPRStatus(
  map: Map<string, PRStatusEntry>,
  handle: string
): PRStatusEntry {
  return map.get(handle.toLowerCase()) ?? { status: "none", pr: null };
}
