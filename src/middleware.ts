import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE, verifyAuthToken } from '@/lib/auth';

// Routes that stay open without the team password:
//  - /login + /api/login          → so people can actually log in
//  - /submit (page)               → public request-intake form
//  - POST /api/submit             → the public form's submit endpoint
// (GET /api/submit is the internal review listing, so it stays gated.)
function isPublic(req: NextRequest): boolean {
  const { pathname } = req.nextUrl;
  if (pathname === '/login' || pathname === '/api/login') return true;
  if (pathname === '/submit') return true;
  if (pathname === '/api/submit' && req.method === 'POST') return true;
  return false;
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  if (isPublic(req)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (await verifyAuthToken(token, Date.now())) {
    return NextResponse.next();
  }

  // API routes get a clean 401; pages get redirected to the login screen.
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.search = '';
  loginUrl.searchParams.set('from', req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Run on everything except Next.js internals and static asset files.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)'],
};
