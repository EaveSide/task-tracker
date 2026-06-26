import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { DEFAULT_SPACES, FALLBACK_SPACE_COLOR, slugify } from '@/lib/spaces';

const MISSING_TABLE_HINT =
  'The spaces table does not exist yet. Run supabase/spaces_and_users.sql in the Supabase SQL Editor.';

// GET /api/spaces — list spaces (falls back to defaults if table is missing)
export async function GET() {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('spaces')
      .select('id,name,color')
      .order('sort_order', { ascending: true });
    if (error || !data || data.length === 0) {
      return NextResponse.json(DEFAULT_SPACES);
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(DEFAULT_SPACES);
  }
}

// POST /api/spaces — create a space { name, color }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const color = typeof body?.color === 'string' && body.color ? body.color : FALLBACK_SPACE_COLOR;
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const sb = getSupabaseAdmin();

    // Read existing rows to derive a unique slug + next sort order.
    const { data: existing, error: listErr } = await sb.from('spaces').select('id,sort_order');
    if (listErr) {
      return NextResponse.json({ error: MISSING_TABLE_HINT }, { status: 500 });
    }

    const taken = new Set((existing ?? []).map((s) => s.id));
    const base = slugify(name);
    let id = base;
    let n = 2;
    while (taken.has(id)) id = `${base}-${n++}`;

    const sortOrder = (existing ?? []).reduce((max, s) => Math.max(max, s.sort_order ?? 0), -1) + 1;

    const { data, error } = await sb
      .from('spaces')
      .insert({ id, name, color, sort_order: sortOrder })
      .select('id,name,color')
      .single();
    if (error) {
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

// DELETE /api/spaces?id=xxx — remove a space (its tasks are left untouched)
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    const sb = getSupabaseAdmin();
    const { error } = await sb.from('spaces').delete().eq('id', id);
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
