import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = ["/account", "/orders"];
const authPages = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSessionCookie = Boolean(request.cookies.get("aurelia_session")?.value);
  const protectedRoute = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));

  if (protectedRoute && !hasSessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (authPages.includes(pathname) && hasSessionCookie && !search.includes("next=")) {
    const url = request.nextUrl.clone();
    url.pathname = "/account";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/orders/:path*", "/login", "/signup"],
};
