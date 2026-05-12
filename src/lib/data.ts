import { head, put } from "@vercel/blob";
import { CohortSchema } from "./types";
import type { Cohort, Member } from "./types";
import cohortFallback from "@/data/cohort.json";

const BLOB_KEY = "cohort.json";

/** Read cohort data from Vercel Blob, falling back to the local JSON file. */
export async function getCohort(): Promise<Cohort> {
  // Try Blob first (only works when BLOB_READ_WRITE_TOKEN is set)
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const info = await head(BLOB_KEY, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      const res = await fetch(info.url, { cache: "no-store" });
      const raw = await res.json();
      return CohortSchema.parse(raw);
    } catch {
      // Blob doesn't exist yet or token invalid — fall through to local file
    }
  }

  return CohortSchema.parse(cohortFallback);
}

/** Write cohort data to Vercel Blob. */
export async function saveCohort(cohort: Cohort): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set");
  }

  await put(BLOB_KEY, JSON.stringify(cohort, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    token,
  });
}

export async function getMember(handle: string): Promise<Member | undefined> {
  const cohort = await getCohort();
  return cohort.members.find(
    (m) => m.handle.toLowerCase() === handle.toLowerCase()
  );
}

export async function getMembersByActivity(): Promise<Member[]> {
  const cohort = await getCohort();
  return [...cohort.members].sort((a, b) => {
    const aLatest = a.updates.at(-1)?.submittedAt ?? "";
    const bLatest = b.updates.at(-1)?.submittedAt ?? "";
    if (bLatest !== aLatest) return bLatest.localeCompare(aLatest);
    return a.handle.localeCompare(b.handle);
  });
}

export async function getWeekSubmissions(
  weekNum: number
): Promise<
  {
    member: Member;
    shipped: string;
    submittedAt: string;
    loomUrl?: string;
    deployUrl?: string;
  }[]
> {
  const cohort = await getCohort();
  const results: {
    member: Member;
    shipped: string;
    submittedAt: string;
    loomUrl?: string;
    deployUrl?: string;
  }[] = [];

  for (const member of cohort.members) {
    const update = member.updates.find((u) => u.week === weekNum);
    if (update) {
      results.push({
        member,
        shipped: update.shipped,
        submittedAt: update.submittedAt,
        loomUrl: update.loomUrl,
        deployUrl: update.deployUrl,
      });
    }
  }

  return results.sort((a, b) =>
    b.submittedAt.localeCompare(a.submittedAt)
  );
}

export async function getMissingForWeek(weekNum: number): Promise<Member[]> {
  const cohort = await getCohort();
  return cohort.members.filter(
    (m) => !m.updates.some((u) => u.week === weekNum)
  );
}
