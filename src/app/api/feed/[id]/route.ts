import { NextResponse } from "next/server";
import { getFeed, saveFeed } from "@/lib/data";
import { getSessionHandle } from "@/lib/auth";

/**
 * Delete a feed post. Only the post's author may delete it.
 *
 * Wrapped in a retry loop for the same reason as the POST handler: Vercel Blob
 * has no compare-and-set, so we re-fetch the store on each attempt to avoid
 * clobbering concurrent writes. Worst case under contention is one extra retry.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const author = await getSessionHandle();
    if (!author) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const { id } = await params;

    const MAX_ATTEMPTS = 3;
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const store = await getFeed();
        const idx = store.posts.findIndex((p) => p.id === id);
        if (idx === -1) {
          return NextResponse.json(
            { error: "Post not found." },
            { status: 404 }
          );
        }
        const post = store.posts[idx];
        if (post.author.toLowerCase() !== author.toLowerCase()) {
          return NextResponse.json(
            { error: "Not your post." },
            { status: 403 }
          );
        }
        store.posts.splice(idx, 1);
        await saveFeed(store);
        return NextResponse.json({ ok: true });
      } catch (err) {
        lastError = err;
        await new Promise((r) => setTimeout(r, 100 * (attempt + 1)));
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error("Failed to delete post after retries");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
