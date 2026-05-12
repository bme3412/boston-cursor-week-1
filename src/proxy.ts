import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow the gate page, gate API, auth API, and static assets through
  if (
    pathname === "/gate" ||
    pathname.startsWith("/api/gate") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const gateCookie = request.cookies.get("shipyard-gate");
  if (gateCookie?.value === "1") {
    return NextResponse.next();
  }

  // Redirect to gate page
  const gateUrl = new URL("/gate", request.url);
  return NextResponse.redirect(gateUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
