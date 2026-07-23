import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE, verifySessionToken } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';

// GET /api/me — the logged-in user, resolved from the session cookie.
// Returns 401 if the cookie is invalid or the user was removed from the
// roster (the client redirects to /login on that).
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE)?.value;
    const userId = await verifySessionToken(token, Date.now());
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sb = getSupabaseAdmin();
    const { data: user, error } = await sb
      .from('users')
      .select('id, name, email')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(user);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
