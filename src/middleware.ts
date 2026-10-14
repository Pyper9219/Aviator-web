import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('aviator_session');
  const { pathname } = request.nextUrl;

  // Public paths that don't require login
  const publicPaths = ['/login', '/api/auth/login', '/api/auth/register', '/api/auth/me', '/api/game/get-state'];
  const isPublic = publicPaths.some(path => pathname.startsWith(path));

  // If no session and not on a public path, redirect to login
  if (!session && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
