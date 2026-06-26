import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const MISSING_TABLE_HINT =
  'The users table does not exist yet. Run supabase/spaces_and_users.sql in the Supabase SQL Editor.';

const DEFAULT_USERS = [
  { id: 'george', name: 'George' },
  { id: 'will', name: 'Will' },
];

// GET /api/users — list the team roster (falls back to defaults if table is missing)
export async function GET() {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb.from('users').select('id,name').order('name', { ascending: true });
    if (error) return NextResponse.json(DEFAULT_USERS);
    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json(DEFAULT_USERS);
  }
}

// POST /api/users — add a user { name }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('users')
      .insert({ name })
      .select('id,name')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: `"${name}" is already on the roster.` }, { status: 409 });
      }
      if (error.code === '42P01') {
        return NextResponse.json({ error: MISSING_TABLE_HINT }, { status: 500 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
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
