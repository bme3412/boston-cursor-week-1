import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow: gate page, auth APIs, static assets
  if (
    pathname === "/gate" ||
    pathname.startsWith("/api/gate") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const hasGate = request.cookies.get("launchpad-gate")?.value === "1";

  // Check for next-auth session cookie (name varies by environment)
  const hasSession =
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token");

  // No gate cookie → go enter the cohort password
  if (!hasGate) {
    return NextResponse.redirect(new URL("/gate", request.url));
  }

  // Gate passed but no GitHub session → allow /join so they can sign in
  if (!hasSession) {
    if (pathname === "/join") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/join", request.url));
  }

  // Both gate + session → allow through
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
