import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password', '/reset-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if it's a public route
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith('/api/'),
  );
  if (isPublic) return NextResponse.next();

  // Check for refresh_token cookie (quick edge check — real validation at page mount via /auth/me)
  const hasRefreshToken = request.cookies.has('refresh_token');

  if (!hasRefreshToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
