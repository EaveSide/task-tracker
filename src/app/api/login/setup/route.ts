import { NextRequest, NextResponse } from 'next/server';
import {
  AUTH_COOKIE,
  createSessionToken,
  hashPassword,
  passwordMatches,
  sessionCookieOptions,
} from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const MIN_PASSWORD_LENGTH = 8;

// POST /api/login/setup — set (or reset) a personal password.
// The shared team password (APP_PASSWORD) acts as the invite code, so only
// people who already had access to the tracker can claim an account. The
// email must already be on the roster (added via the Team modal).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const teamPassword = typeof body?.teamPassword === 'string' ? body.teamPassword : '';
    const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';

    if (!email || !teamPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Email, team password, and a new password are required.' },
        { status: 400 }
      );
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
        { status: 400 }
      );
    }
    if (!passwordMatches(teamPassword)) {
      return NextResponse.json({ error: 'Incorrect team password.' }, { status: 401 });
    }

    const sb = getSupabaseAdmin();
    const { data: user, error } = await sb
      .from('users')
      .select('id, name')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Setup lookup failed:', error.message);
      return NextResponse.json(
        { error: 'Setup is unavailable. (Has supabase/user_accounts.sql been run?)' },
        { status: 500 }
      );
    }
    if (!user) {
      return NextResponse.json(
        { error: 'That email is not on the roster. Ask a teammate to add it in the Team modal first.' },
        { status: 404 }
      );
    }

    const password_hash = await hashPassword(newPassword);
    const { error: updateError } = await sb
      .from('users')
      .update({ password_hash })
      .eq('id', user.id);
    if (updateError) {
      console.error('Failed to save password:', updateError.message);
      return NextResponse.json({ error: 'Could not save the password. Try again.' }, { status: 500 });
    }

    const token = await createSessionToken(user.id, Date.now());
    const res = NextResponse.json({ success: true, user: { id: user.id, name: user.name } });
    res.cookies.set(AUTH_COOKIE, token, sessionCookieOptions());
    return res;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
