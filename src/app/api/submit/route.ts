import { NextResponse } from "next/server";
import { z } from "zod";
import { getCohort, saveCohort } from "@/lib/data";
import { verifyPin } from "@/lib/pin";

const SubmitBody = z.object({
  handle: z.string().min(1),
  pin: z.string().min(1),
  week: z.number().min(1).max(6),
  shipped: z.string().min(1),
  loomUrl: z.string().optional(),
  deployUrl: z.string().optional(),
  repoUrl: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = SubmitBody.parse(body);

    const cohort = await getCohort();

    const member = cohort.members.find(
      (m) => m.handle.toLowerCase() === data.handle.toLowerCase()
    );
    if (!member) {
      return NextResponse.json(
        { error: "Handle not found. Join the cohort first." },
        { status: 404 }
      );
    }

    // Verify PIN
    if (!member.pinHash) {
      return NextResponse.json(
        { error: "This account was created before PINs were required. Contact an admin." },
        { status: 403 }
      );
    }

    if (!verifyPin(data.pin, member.pinHash)) {
      return NextResponse.json(
        { error: "Wrong PIN." },
        { status: 403 }
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

    return NextResponse.json({ ok: true, handle: data.handle, week: data.week });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
