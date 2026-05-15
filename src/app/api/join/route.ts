import { NextResponse } from "next/server";
import { z } from "zod";
import { getCohort, saveCohort } from "@/lib/data";
import { getSessionHandle } from "@/lib/auth";

const JoinBody = z.object({
  projectName: z.string().min(1),
  projectDescription: z.string().min(1),
  projectUrl: z.string().optional(),
  repoUrl: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export async function POST(req: Request) {
  try {
    const handle = await getSessionHandle();
    if (!handle) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const body = await req.json();
    const data = JoinBody.parse(body);

    const cohort = await getCohort();

    const exists = cohort.members.some(
      (m) => m.handle.toLowerCase() === handle.toLowerCase()
    );
    if (exists) {
      return NextResponse.json(
        { error: "Handle already registered" },
        { status: 409 }
      );
    }

    cohort.members.push({
      handle,
      projectName: data.projectName,
      projectDescription: data.projectDescription,
      projectUrl: data.projectUrl,
      repoUrl: data.repoUrl,
      tags: data.tags.slice(0, 3),
      flair: [],
      joinedWeek: 1,
      updates: [],
    });

    await saveCohort(cohort);

    return NextResponse.json({ ok: true, handle });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
