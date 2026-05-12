import { NextResponse } from "next/server";
import { z } from "zod";
import { getCohort } from "@/lib/data";
import { getReactions, saveReactions } from "@/lib/data";
import { getSessionHandle } from "@/lib/auth";

const ReactBody = z.object({
  week: z.number().min(1).max(6),
  handle: z.string().min(1),
  emoji: z.enum(["fire", "rocket", "heart", "clap"]),
});

export async function POST(req: Request) {
  try {
    const reactor = await getSessionHandle();
    if (!reactor) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const body = await req.json();
    const data = ReactBody.parse(body);

    const cohort = await getCohort();
    const member = cohort.members.find(
      (m) => m.handle.toLowerCase() === reactor.toLowerCase()
    );
    if (!member) {
      return NextResponse.json(
        { error: "User not found in cohort." },
        { status: 404 }
      );
    }

    const store = await getReactions();

    const idx = store.reactions.findIndex(
      (r) =>
        r.week === data.week &&
        r.handle.toLowerCase() === data.handle.toLowerCase() &&
        r.emoji === data.emoji &&
        r.reactor.toLowerCase() === reactor.toLowerCase()
    );

    let action: "added" | "removed";
    if (idx >= 0) {
      store.reactions.splice(idx, 1);
      action = "removed";
    } else {
      store.reactions.push({
        week: data.week,
        handle: data.handle,
        emoji: data.emoji,
        reactor,
        reactedAt: new Date().toISOString(),
      });
      action = "added";
    }

    await saveReactions(store);

    return NextResponse.json({ ok: true, action });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
