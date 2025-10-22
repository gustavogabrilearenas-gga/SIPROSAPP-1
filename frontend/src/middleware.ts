import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PREFIXES = ['/login', '/api/auth'];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
  const hasAccess = req.cookies.has('access');

  if (!isPublic && !hasAccess) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
