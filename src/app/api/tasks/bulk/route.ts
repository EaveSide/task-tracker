import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { isValidEmail, sendTaskCompletedEmail } from '@/lib/email';
import { STATUSES } from '@/lib/types';

const DONE_STATUS = 'done';
const MAX_IDS = 200;

// Only these fields may be set through bulk edit; everything else on the
// task (title, description, notify bookkeeping, …) requires the single-task
// save path.
const EDITABLE_FIELDS = [
  'assignee',
  'sprint',
  'status',
  'priority',
  'area',
  'project',
  'type',
] as const;

const PRIORITIES = ['high', 'medium', 'low'];

// POST /api/tasks/bulk — apply one set of field updates to many tasks.
// Body: { ids: string[], updates: { assignee? sprint? status? ... } }
// Keeps parity with the single-task save: status changes are appended to the
// status log, and a transition into Done sends the one-time completion email.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const ids: unknown = body?.ids;
    if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id) => typeof id === 'string')) {
      return NextResponse.json({ error: 'ids must be a non-empty array of task ids' }, { status: 400 });
    }
    if (ids.length > MAX_IDS) {
      return NextResponse.json({ error: `At most ${MAX_IDS} tasks per bulk edit` }, { status: 400 });
    }

    const updates: Record<string, string> = {};
    for (const field of EDITABLE_FIELDS) {
      const value = body?.updates?.[field];
      if (value !== undefined) {
        if (typeof value !== 'string') {
          return NextResponse.json({ error: `${field} must be a string` }, { status: 400 });
        }
        updates[field] = value;
      }
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No editable fields in updates' }, { status: 400 });
    }
    if (updates.status && !(STATUSES as readonly string[]).includes(updates.status)) {
      return NextResponse.json({ error: `Invalid status: ${updates.status}` }, { status: 400 });
    }
    if (updates.priority && !PRIORITIES.includes(updates.priority)) {
      return NextResponse.json({ error: `Invalid priority: ${updates.priority}` }, { status: 400 });
    }

    const sb = getSupabaseAdmin();

    // Prior state, needed for status-log entries and done-email guards.
    const { data: previousRows, error: prevError } = await sb
      .from('sprint_tasks')
      .select('id, status, notify_email, notified_at')
      .in('id', ids);
    if (prevError) {
      return NextResponse.json({ error: prevError.message }, { status: 500 });
    }
    const previousById = new Map((previousRows ?? []).map((r) => [r.id, r]));

    const { data: updated, error } = await sb
      .from('sprint_tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .in('id', ids)
      .select();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = updated ?? [];

    if (updates.status) {
      const events = rows
        .filter((row) => previousById.get(row.id)?.status !== row.status)
        .map((row) => ({
          task_id: row.id,
          from_status: previousById.get(row.id)?.status ?? null,
          to_status: row.status,
        }));
      if (events.length > 0) {
        const { error: logError } = await sb.from('task_status_events').insert(events);
        if (logError) {
          console.error('Failed to log bulk status events:', logError.message);
        }
      }

      if (updates.status === DONE_STATUS) {
        for (const row of rows) {
          const previous = previousById.get(row.id);
          const movedToDone = !previous || previous.status !== DONE_STATUS;
          if (movedToDone && isValidEmail(row.notify_email) && !previous?.notified_at) {
            const sent = await sendTaskCompletedEmail({
              to: row.notify_email,
              taskTitle: row.title,
            });
            if (sent) {
              await sb
                .from('sprint_tasks')
                .update({ notified_at: new Date().toISOString() })
                .eq('id', row.id);
            }
          }
        }
      }
    }

    return NextResponse.json({ updated: rows });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
