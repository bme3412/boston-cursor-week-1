import { NextResponse } from "next/server";
import { z } from "zod";
import { getCohort, saveCohort } from "@/lib/data";
import { verifyPin } from "@/lib/pin";

const VoteBody = z.object({
  voter: z.string().min(1),
  pin: z.string().min(1),
  week: z.number().min(1).max(6),
  candidate: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = VoteBody.parse(body);

    if (data.voter.toLowerCase() === data.candidate.toLowerCase()) {
      return NextResponse.json(
        { error: "You can't vote for yourself." },
        { status: 400 }
      );
    }

    const cohort = await getCohort();

    // Verify voter exists and PIN is correct
    const voter = cohort.members.find(
      (m) => m.handle.toLowerCase() === data.voter.toLowerCase()
    );
    if (!voter) {
      return NextResponse.json(
        { error: "Voter not found in cohort." },
        { status: 404 }
      );
    }
    if (!voter.pinHash || !verifyPin(data.pin, voter.pinHash)) {
      return NextResponse.json({ error: "Wrong PIN." }, { status: 403 });
    }

    // Verify candidate exists and has a submission for this week
    const candidate = cohort.members.find(
      (m) => m.handle.toLowerCase() === data.candidate.toLowerCase()
    );
    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found." },
        { status: 404 }
      );
    }
    if (!candidate.updates.some((u) => u.week === data.week)) {
      return NextResponse.json(
        { error: "Candidate has no submission for this week." },
        { status: 400 }
      );
    }

    // Check if voter already voted this week — replace their vote
    const existingIdx = cohort.votes.findIndex(
      (v) =>
        v.voter.toLowerCase() === data.voter.toLowerCase() &&
        v.week === data.week
    );

    const vote = {
      voter: data.voter,
      week: data.week,
      candidate: data.candidate,
      votedAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      cohort.votes[existingIdx] = vote;
    } else {
      cohort.votes.push(vote);
    }

    await saveCohort(cohort);

    return NextResponse.json({ ok: true, vote });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
