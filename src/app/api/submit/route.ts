import { NextResponse } from "next/server";
import { z } from "zod";
import { getCohort, saveCohort } from "@/lib/data";
import { getSessionHandle } from "@/lib/auth";

const SubmitBody = z.object({
  week: z.number().min(1).max(6),
  shipped: z.string().min(1),
  loomUrl: z.string().optional(),
  deployUrl: z.string().optional(),
  repoUrl: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const handle = await getSessionHandle();
    if (!handle) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const body = await req.json();
    const data = SubmitBody.parse(body);

    const cohort = await getCohort();

    const member = cohort.members.find(
      (m) => m.handle.toLowerCase() === handle.toLowerCase()
    );
    if (!member) {
      return NextResponse.json(
        { error: "Handle not found. Join the cohort first." },
        { status: 404 }
      );
    }

    // Replace existing update for this week, or add new one
    const existingIdx = member.updates.findIndex((u) => u.week === data.week);
    const update = {
      week: data.week,
      shipped: data.shipped,
      loomUrl: data.loomUrl,
      deployUrl: data.deployUrl,
      repoUrl: data.repoUrl,
      submittedAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      member.updates[existingIdx] = update;
    } else {
      member.updates.push(update);
    }

    await saveCohort(cohort);

    return NextResponse.json({ ok: true, handle, week: data.week });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
