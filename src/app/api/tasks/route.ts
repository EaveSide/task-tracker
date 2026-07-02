import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { makeTaskId } from '@/lib/task-id';

// GET /api/tasks — list tasks (default: active only)
// ?include_archived=true — return all tasks
// ?archived_only=true — return only archived tasks
export async function GET(req: NextRequest) {
  try {
    const includeArchived = req.nextUrl.searchParams.get('include_archived') === 'true';
    const archivedOnly = req.nextUrl.searchParams.get('archived_only') === 'true';

    const sb = getSupabaseAdmin();
    let query = sb.from('sprint_tasks').select('*');

    if (archivedOnly) {
      query = query.eq('archived', true);
    } else if (!includeArchived) {
      query = query.eq('archived', false);
    }

    const { data, error } = await query.order('id');

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

// POST /api/tasks — create or update a task
export async function POST(req: NextRequest) {
  try {
    const task = await req.json();

    if (!task.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Guard against upserting with an empty/missing primary key: an empty id
    // collides with every other id-less row and silently overwrites it. Assign
    // a fresh id for any new task that arrives without one.
    if (!task.id || !String(task.id).trim()) {
      task.id = makeTaskId(task.sprint);
    }

    task.updated_at = new Date().toISOString();

    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('sprint_tasks')
      .upsert(task)
      .select()
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
