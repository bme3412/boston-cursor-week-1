import { NextResponse } from "next/server";
import { z } from "zod";
import { getCohort } from "@/lib/data";
import { getFeed, saveFeed } from "@/lib/data";
import { getSessionHandle } from "@/lib/auth";

const FeedPostBody = z.object({
  text: z.string().min(1).max(500),
  link: z.string().url().optional(),
});

export async function POST(req: Request) {
  try {
    const author = await getSessionHandle();
    if (!author) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const body = await req.json();
    const data = FeedPostBody.parse(body);

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

    const store = await getFeed();

    const post = {
      id: crypto.randomUUID(),
      author,
      text: data.text,
      link: data.link,
      createdAt: new Date().toISOString(),
    };

    store.posts.push(post);
    await saveFeed(store);

    return NextResponse.json({ ok: true, post });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
