import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isMealsSubdomain(request: NextRequest): boolean {
  const host = request.headers.get('host') || '';
  return host.startsWith('meals.');
}

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get('authjs.session-token')?.value
    || request.cookies.get('__Secure-authjs.session-token')?.value;

  const isLoggedIn = !!sessionToken;
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isAuthRoute = request.nextUrl.pathname.startsWith('/api/auth');
  const isWebhook = request.nextUrl.pathname === '/api/health/import'
    || request.nextUrl.pathname === '/api/habits/sync-github'
    || request.nextUrl.pathname === '/api/books/sync';
  const isMeals = isMealsSubdomain(request);

  // Allow auth routes and webhooks
  if (isAuthRoute || isWebhook) {
    return NextResponse.next();
  }

  // Redirect logged-in users away from login page
  if (isLoginPage && isLoggedIn) {
    const redirectTo = isMeals ? '/meals' : '/';
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  // Redirect unauthenticated users to login
  if (!isLoginPage && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Rewrite root path to /meals for meals subdomain
  if (isMeals && request.nextUrl.pathname === '/') {
    return NextResponse.rewrite(new URL('/meals', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
