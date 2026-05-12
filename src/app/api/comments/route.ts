import { NextResponse } from "next/server";
import { z } from "zod";
import { getCohort } from "@/lib/data";
import { getComments, saveComments } from "@/lib/data";
import { getSessionHandle } from "@/lib/auth";

const CommentBody = z.object({
  week: z.number().min(1).max(6),
  text: z.string().min(1).max(500),
});

export async function POST(req: Request) {
  try {
    const author = await getSessionHandle();
    if (!author) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const body = await req.json();
    const data = CommentBody.parse(body);

    const cohort = await getCohort();
    const member = cohort.members.find(
      (m) => m.handle.toLowerCase() === author.toLowerCase()
    );
    if (!member) {
      return NextResponse.json(
        { error: "User not found in cohort." },
        { status: 404 }
      );
    }

    const store = await getComments();

    const comment = {
      id: crypto.randomUUID(),
      week: data.week,
      author,
      text: data.text,
      createdAt: new Date().toISOString(),
    };

    store.comments.push(comment);
    await saveComments(store);

    return NextResponse.json({ ok: true, comment });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
