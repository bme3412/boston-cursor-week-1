import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  // Clear the gate cookie
  const cookieStore = await cookies();
  cookieStore.set("launchpad-gate", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return NextResponse.json({ ok: true });
}
