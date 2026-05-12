import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { password } = await req.json();
  const expected = process.env.COHORT_PASSWORD;

  if (!expected || password !== expected) {
    return NextResponse.json({ error: "Wrong password" }, { status: 403 });
  }

  const cookieStore = await cookies();
  cookieStore.set("launchpad-gate", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  return NextResponse.json({ ok: true });
}
