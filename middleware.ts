import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get('authjs.session-token')?.value
    || request.cookies.get('__Secure-authjs.session-token')?.value;

  const isLoggedIn = !!sessionToken;
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isAuthRoute = request.nextUrl.pathname.startsWith('/api/auth');

  // Allow auth routes
  if (isAuthRoute) {
    return NextResponse.next();
  }

  // Redirect logged-in users away from login page
  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect unauthenticated users to login
  if (!isLoginPage && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
