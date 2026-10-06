import { NextResponse, NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getAdminUserIds, getJwtSecret } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protected paths
  const isProtected =
    pathname === "/" ||
    pathname.startsWith("/bets") ||
    pathname.startsWith("/cashier") ||
    pathname.startsWith("/withdraw") ||
    pathname.startsWith("/admin/withdrawals");

  if (isProtected) {
    const token = req.cookies.get("aviator_session")?.value;
    if (!token) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    try {
      const { payload } = await jwtVerify(token, getJwtSecret());
      if (pathname.startsWith("/admin/withdrawals")) {
        const adminIds = getAdminUserIds();
        if (!adminIds.length || typeof payload.id !== "string" || !adminIds.includes(payload.id)) {
          return NextResponse.redirect(new URL("/", req.url));
        }
      }
      return NextResponse.next();
    } catch (err) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already logged in, redirect away from /auth
  if (pathname.startsWith("/auth/")) {
    const token = req.cookies.get("aviator_session")?.value;
    if (token) {
      try {
        await jwtVerify(token, getJwtSecret());
        return NextResponse.redirect(new URL("/", req.url));
      } catch (e) {}
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/bets/:path*", "/cashier/:path*", "/withdraw/:path*", "/admin/withdrawals/:path*", "/auth/:path*"]
};
