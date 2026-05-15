import { NextResponse } from "next/server";
import { getFeedComments, saveFeedComments } from "@/lib/data";
import { getSessionHandle } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const author = await getSessionHandle();
    if (!author) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const { id: postId, commentId } = await params;

    const MAX_ATTEMPTS = 3;
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const store = await getFeedComments();
        const idx = store.comments.findIndex(
          (c) => c.id === commentId && c.postId === postId
        );
        if (idx === -1) {
          return NextResponse.json(
            { error: "Comment not found." },
            { status: 404 }
          );
        }
        const comment = store.comments[idx];
        if (comment.author.toLowerCase() !== author.toLowerCase()) {
          return NextResponse.json(
            { error: "Not your comment." },
            { status: 403 }
          );
        }
        store.comments.splice(idx, 1);
        await saveFeedComments(store);
        return NextResponse.json({ ok: true });
      } catch (err) {
        lastError = err;
        await new Promise((r) => setTimeout(r, 100 * (attempt + 1)));
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error("Failed to delete comment after retries");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
