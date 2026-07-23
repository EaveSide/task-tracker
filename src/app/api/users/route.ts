import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const MISSING_TABLE_HINT =
  'The users table does not exist yet. Run supabase/spaces_and_users.sql in the Supabase SQL Editor.';

const DEFAULT_USERS = [
  { id: 'george', name: 'George' },
  { id: 'will', name: 'Will' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface UserRow {
  id: string;
  name: string;
  email: string | null;
  password_hash: string | null;
}

// Never expose the hash itself — the client only needs to know whether a
// personal password has been set.
function toPublicUser(row: UserRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    has_account: Boolean(row.password_hash),
  };
}

function normalizeEmail(value: unknown): string | null | undefined {
  if (value === undefined) return undefined; // not provided → leave unchanged
  if (typeof value !== 'string' || !value.trim()) return null;
  return value.trim().toLowerCase();
}

// GET /api/users — list the team roster (falls back to defaults if table is missing)
export async function GET() {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('users')
      .select('id, name, email, password_hash')
      .order('name', { ascending: true });
    if (error) return NextResponse.json(DEFAULT_USERS);
    return NextResponse.json((data ?? []).map(toPublicUser));
  } catch {
    return NextResponse.json(DEFAULT_USERS);
  }
}

// POST /api/users — add a user { name, email? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const email = normalizeEmail(body?.email) ?? null;
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (email && !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('users')
      .insert({ name, email })
      .select('id, name, email, password_hash')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: `"${name}" or that email is already on the roster.` },
          { status: 409 }
        );
      }
      if (error.code === '42P01') {
        return NextResponse.json({ error: MISSING_TABLE_HINT }, { status: 500 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(toPublicUser(data));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

// PUT /api/users — update a user { id, name?, email? }
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const id = typeof body?.id === 'string' ? body.id : '';
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updates: Record<string, string | null> = {};
    if (typeof body?.name === 'string' && body.name.trim()) {
      updates.name = body.name.trim();
    }
    const email = normalizeEmail(body?.email);
    if (email !== undefined) {
      if (email && !EMAIL_RE.test(email)) {
        return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
      }
      updates.email = email;
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('id, name, email, password_hash')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'That name or email is already in use.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(toPublicUser(data));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

// DELETE /api/users?id=xxx — remove a user
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    const sb = getSupabaseAdmin();
    const { error } = await sb.from('users').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
