import { NextRequest, NextResponse } from 'next/server';
import {
  AUTH_COOKIE,
  SESSION_TTL_MS,
  createSessionToken,
  sessionCookieOptions,
  verifyPassword,
} from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';

// POST /api/login — exchange email + personal password for a session cookie.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    const { data: user, error } = await sb
      .from('users')
      .select('id, name, email, password_hash')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Login lookup failed:', error.message);
      return NextResponse.json(
        { error: 'Login is unavailable. (Has supabase/user_accounts.sql been run?)' },
        { status: 500 }
      );
    }
    if (!user) {
      return NextResponse.json(
        { error: 'No account for that email. Ask a teammate to add you in the Team modal.' },
        { status: 401 }
      );
    }
    if (!user.password_hash) {
      return NextResponse.json(
        { needsSetup: true, error: 'No password set yet — use "First time here?" below.' },
        { status: 409 }
      );
    }
    if (!(await verifyPassword(password, user.password_hash))) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }

    const token = await createSessionToken(user.id, Date.now());

    // The token is returned in the body only when a client explicitly asks for
    // it. Browser pages keep using the httpOnly cookie, which nothing on the
    // page can read; handing the same value to every caller would give up that
    // protection for the sake of one client that cannot use cookies.
    const wantsToken = body?.mode === 'token';

    const res = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name },
      ...(wantsToken ? { token, expiresIn: SESSION_TTL_MS } : {}),
    });
    res.cookies.set(AUTH_COOKIE, token, sessionCookieOptions());
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
