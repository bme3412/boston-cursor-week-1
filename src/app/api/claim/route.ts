import { NextResponse } from "next/server";
import { z } from "zod";
import { getCohort, saveCohort } from "@/lib/data";
import { hashPin } from "@/lib/pin";

const ClaimBody = z.object({
  handle: z.string().min(1),
  pin: z.string().min(4).max(32),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = ClaimBody.parse(body);

    const cohort = await getCohort();

    const member = cohort.members.find(
      (m) => m.handle.toLowerCase() === data.handle.toLowerCase()
    );

    if (!member) {
      return NextResponse.json(
        { error: "Handle not found. Use /join to register." },
        { status: 404 }
      );
    }

    if (member.pinHash) {
      return NextResponse.json(
        { error: "This account already has a PIN. Use sign in instead." },
        { status: 409 }
      );
    }

    member.pinHash = hashPin(data.pin);
    await saveCohort(cohort);

    return NextResponse.json({ ok: true, handle: data.handle });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
