import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js middleware — the file is named proxy.ts because Next 16 renamed
 * the convention. It is a coarse, optimistic gate only (§3.3): it checks for
 * the *presence* of the session cookie and never touches the database. Real
 * authorization happens in layouts, pages, actions, and the data layer. It
 * also forwards the requested path so requireUser() can build the
 * /login?next=… redirect.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isProtected =
    pathname.startsWith("/portal") || pathname.startsWith("/admin");

  if (isProtected && !request.cookies.has("session")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname + search);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Excludes /_next/*, /uploads/* (the image route guards itself), and
  // static files with an extension (§3.4).
  matcher: ["/((?!_next|uploads|.*\\..*).*)"],
};
