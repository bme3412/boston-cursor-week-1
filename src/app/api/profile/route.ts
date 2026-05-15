import { NextResponse } from "next/server";
import { z } from "zod";
import { getCohort, saveCohort } from "@/lib/data";
import { getSessionHandle } from "@/lib/auth";
import { MAX_FLAIR, normalizeFlair } from "@/lib/flair";

const ProfileBody = z.object({
  projectName: z.string().min(1).max(80),
  projectDescription: z.string().min(1).max(280),
  projectUrl: z.string().url().optional().or(z.literal("")),
  repoUrl: z.string().url().optional().or(z.literal("")),
  bio: z.string().max(140).optional().or(z.literal("")),
  location: z.string().max(60).optional().or(z.literal("")),
  currentlyBuilding: z.string().max(120).optional().or(z.literal("")),
  flair: z.array(z.string()).max(MAX_FLAIR).optional(),
});

export async function PATCH(req: Request) {
  try {
    const handle = await getSessionHandle();
    if (!handle) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const data = ProfileBody.parse(await req.json());
    const cohort = await getCohort();

    const idx = cohort.members.findIndex(
      (m) => m.handle.toLowerCase() === handle.toLowerCase()
    );

    const projectUrl = data.projectUrl || undefined;
    const repoUrl = data.repoUrl || undefined;
    const bio = data.bio?.trim() || undefined;
    const location = data.location?.trim() || undefined;
    const currentlyBuilding = data.currentlyBuilding?.trim() || undefined;
    const flair = normalizeFlair(data.flair ?? []);

    if (idx >= 0) {
      cohort.members[idx] = {
        ...cohort.members[idx],
        projectName: data.projectName,
        projectDescription: data.projectDescription,
        projectUrl,
        repoUrl,
        bio,
        location,
        currentlyBuilding,
        flair,
      };
    } else {
      cohort.members.push({
        handle,
        projectName: data.projectName,
        projectDescription: data.projectDescription,
        projectUrl,
        repoUrl,
        bio,
        location,
        currentlyBuilding,
        flair,
        tags: [],
        joinedWeek: cohort.currentWeek,
        updates: [],
      });
    }

    await saveCohort(cohort);
    return NextResponse.json({ ok: true, handle });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
