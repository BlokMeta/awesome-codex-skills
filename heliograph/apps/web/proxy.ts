import { type NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/sign-in', '/sign-up', '/two-factor', '/verify-email', '/invite'];
const SESSION_COOKIE = 'hg.session_token';

/**
 * Cheap edge gate: routes under the app shell need a session cookie. The real check happens on
 * the client (`useSession`) and on the API (SessionGuard); this only avoids flashing the shell.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const hasSession = request.cookies.has(SESSION_COOKIE);
  if (!isPublic && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  if (isPublic && hasSession && (pathname === '/sign-in' || pathname === '/sign-up')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest).*)'],
};
