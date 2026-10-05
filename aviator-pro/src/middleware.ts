import { NextResponse, NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getJwtSecret } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const secret = getJwtSecret();
  const { pathname } = req.nextUrl;

  // Protected paths
  const isProtected = pathname === "/" || pathname.startsWith("/bets") || pathname.startsWith("/cashier");

  if (isProtected) {
    const token = req.cookies.get("aviator_session")?.value;
    if (!token) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    try {
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch (err) {
      const loginUrl = new URL("/auth/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already logged in, redirect away from /auth
  if (pathname.startsWith("/auth/")) {
    const token = req.cookies.get("aviator_session")?.value;
    if (token) {
      try {
        await jwtVerify(token, secret);
        return NextResponse.redirect(new URL("/", req.url));
      } catch (e) {}
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/bets/:path*", "/cashier/:path*", "/auth/:path*"]
};
