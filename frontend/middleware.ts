import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, isSupportedLocale } from "@/i18n/config";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const parts = pathname.split("/").filter(Boolean);
  const locale = parts[0] && isSupportedLocale(parts[0]) ? parts[0] : defaultLocale;
  const isDashboardRoute = parts[1] === "dashboard";

  if (!isDashboardRoute) {
    return NextResponse.next();
  }

  const hasSessionMarker = request.cookies.get("mb_auth")?.value === "1";

  if (hasSessionMarker) {
    return NextResponse.next();
  }

  const loginUrl = new URL(`/${locale}/auth/login`, request.url);
  loginUrl.searchParams.set("returnTo", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|pwa/).*)"]
};
