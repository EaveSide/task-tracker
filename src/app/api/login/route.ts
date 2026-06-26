import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE, SESSION_TTL_MS, createAuthToken, passwordMatches } from '@/lib/auth';

// POST /api/login — exchange the shared team password for a signed session cookie.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!password || !passwordMatches(password)) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }

    const token = await createAuthToken(Date.now());
    const res = NextResponse.json({ success: true });
    res.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(SESSION_TTL_MS / 1000),
    });
    return res;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

// DELETE /api/login — log out by clearing the session cookie.
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(AUTH_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
