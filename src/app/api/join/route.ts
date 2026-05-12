import { NextResponse } from "next/server";
import { z } from "zod";
import { getCohort, saveCohort } from "@/lib/data";
import { hashPin } from "@/lib/pin";

const JoinBody = z.object({
  handle: z.string().min(1),
  projectName: z.string().min(1),
  projectDescription: z.string().min(1),
  projectUrl: z.string().optional(),
  repoUrl: z.string().optional(),
  tags: z.array(z.string()).default([]),
  pin: z.string().min(4).max(32),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = JoinBody.parse(body);

    const cohort = await getCohort();

    const exists = cohort.members.some(
      (m) => m.handle.toLowerCase() === data.handle.toLowerCase()
    );
    if (exists) {
      return NextResponse.json(
        { error: "Handle already registered" },
        { status: 409 }
      );
    }

    cohort.members.push({
      handle: data.handle,
      projectName: data.projectName,
      projectDescription: data.projectDescription,
      projectUrl: data.projectUrl,
      repoUrl: data.repoUrl,
      tags: data.tags.slice(0, 3),
      joinedWeek: 1,
      updates: [],
      pinHash: hashPin(data.pin),
    });

    await saveCohort(cohort);

    return NextResponse.json({ ok: true, handle: data.handle });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
