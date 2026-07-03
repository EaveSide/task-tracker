import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

// GET /api/tasks/history?task_id=<id> — status change log for one task,
// oldest first (the creation event has from_status = null).
export async function GET(req: NextRequest) {
  try {
    const taskId = req.nextUrl.searchParams.get('task_id');
    if (!taskId?.trim()) {
      return NextResponse.json({ error: 'task_id is required' }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('task_status_events')
      .select('*')
      .eq('task_id', taskId)
      .order('changed_at', { ascending: true });

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
