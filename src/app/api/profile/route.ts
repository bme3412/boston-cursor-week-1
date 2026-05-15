import { NextResponse } from "next/server";
import { z } from "zod";
import { getCohort, saveCohort } from "@/lib/data";
import { getSessionHandle } from "@/lib/auth";

const ProfileBody = z.object({
  projectName: z.string().min(1).max(80),
  projectDescription: z.string().min(1).max(280),
  projectUrl: z.string().url().optional().or(z.literal("")),
  repoUrl: z.string().url().optional().or(z.literal("")),
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

    if (idx >= 0) {
      cohort.members[idx] = {
        ...cohort.members[idx],
        projectName: data.projectName,
        projectDescription: data.projectDescription,
        projectUrl,
        repoUrl,
      };
    } else {
      cohort.members.push({
        handle,
        projectName: data.projectName,
        projectDescription: data.projectDescription,
        projectUrl,
        repoUrl,
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
