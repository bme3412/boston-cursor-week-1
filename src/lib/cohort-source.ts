import { z } from "zod";

// Upstream repo whose `pydata-2026-submissions/` subdirectories define the cohort roster.
const UPSTREAM_OWNER = "rogerSuperBuilderAlpha";
const UPSTREAM_REPO = "cursor-boston";
const UPSTREAM_REF = "develop";
const UPSTREAM_PATH = "pydata-2026-submissions";

const ContentsSchema = z.array(
  z.object({
    name: z.string(),
    type: z.string(),
  })
);

/**
 * Fetch the list of GitHub handles that have a submission folder in the upstream
 * cursor-boston repo. Each subdirectory under `pydata-2026-submissions/` is treated
 * as a cohort member handle.
 *
 * Returns [] on failure so callers can fall back to local data.
 */
export async function fetchCohortHandles(): Promise<string[]> {
  const url = `https://api.github.com/repos/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/contents/${UPSTREAM_PATH}?ref=${UPSTREAM_REF}`;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      headers,
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.warn(`[cohort-source] GitHub API ${res.status} on ${url}`);
      return [];
    }

    const entries = ContentsSchema.parse(await res.json());
    return entries.filter((e) => e.type === "dir").map((e) => e.name);
  } catch (err) {
    console.warn("[cohort-source] failed to fetch upstream roster:", err);
    return [];
  }
}
