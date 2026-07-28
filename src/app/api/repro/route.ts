import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE, bearerToken, verifySessionToken } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { makeTaskId } from '@/lib/task-id';

// POST /api/repro — create a ticket from a Repro Capture session.
//
// The extension talks to this endpoint with a bearer token (it cannot read the
// httpOnly session cookie). The middleware has already rejected unauthenticated
// requests; the identity is resolved again here because the ticket records who
// submitted it.
//
// The request body is written by a client that is downloaded and run locally,
// so it is treated as untrusted input and validated field by field.

const VALID_LABELS = ['repro:verified', 'repro:unverified', 'repro:broken'] as const;
const MAX_BODY_BYTES = 25 * 1024 * 1024; // Matches the extension's payload cap.
const MAX_TITLE = 200;

// Must be one of TASK_TYPES in src/components/task-modal/TaskModal.tsx. A value
// outside that list is not rejected anywhere - the modal's <select> simply has
// no matching <option> and falls back to showing "Enhancement", so a bug report
// silently files itself under the wrong type and gets triaged as feature work.
const REPRO_TASK_TYPE = 'Bug Fix';

type Label = (typeof VALID_LABELS)[number];

interface ReproRequest {
  title?: unknown;
  description?: unknown;
  project?: unknown;
  area?: unknown;
  assignee?: unknown;
  sprint?: unknown;
  label?: unknown;
  spec?: unknown;
  session?: unknown;
  screenshots?: unknown;
  validation?: unknown;
}

function badRequest(error: string): NextResponse {
  return NextResponse.json({ error }, { status: 400 });
}

/** Reads a required, non-empty string field. */
function requireString(value: unknown, field: string, max: number): string | NextResponse {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return badRequest(`${field} is required`);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    return badRequest(`${field} exceeds ${max} characters`);
  }
  return trimmed;
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export async function POST(req: NextRequest) {
  try {
    const token =
      req.cookies.get(AUTH_COOKIE)?.value ?? bearerToken(req.headers.get('authorization'));
    const userId = await verifySessionToken(token, Date.now());
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: 'Payload too large. Re-record a shorter session.' },
        { status: 413 }
      );
    }

    let body: ReproRequest;
    try {
      body = JSON.parse(raw) as ReproRequest;
    } catch {
      return badRequest('Body must be valid JSON');
    }

    const title = requireString(body.title, 'title', MAX_TITLE);
    if (title instanceof NextResponse) return title;

    const description = requireString(body.description, 'description', 20_000);
    if (description instanceof NextResponse) return description;

    const project = requireString(body.project, 'project', 100);
    if (project instanceof NextResponse) return project;

    if (body.session === undefined || body.session === null || typeof body.session !== 'object') {
      return badRequest('session is required');
    }

    const label = optionalString(body.label);
    if (label !== null && !VALID_LABELS.includes(label as Label)) {
      return badRequest(`label must be one of: ${VALID_LABELS.join(', ')}`);
    }

    const sb = getSupabaseAdmin();
    const taskId = makeTaskId(optionalString(body.sprint));

    const { data: task, error: taskError } = await sb
      .from('sprint_tasks')
      .insert({
        id: taskId,
        title,
        description,
        project,
        area: optionalString(body.area),
        assignee: optionalString(body.assignee) ?? '',
        type: REPRO_TASK_TYPE,
        status: 'todo',
        priority: 'medium',
        sprint: optionalString(body.sprint),
        repro_label: label,
        created: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        archived: false,
      })
      .select()
      .single();

    if (taskError) {
      console.error('Failed to create repro task:', taskError.message);
      return NextResponse.json({ error: 'Failed to create the ticket.' }, { status: 500 });
    }

    const { data: pkg, error: pkgError } = await sb
      .from('repro_packages')
      .insert({
        task_id: taskId,
        version: 1,
        session: body.session,
        spec: optionalString(body.spec),
        label,
        validation: body.validation ?? null,
        screenshots: body.screenshots ?? null,
        submitted_by: userId,
      })
      .select('id')
      .single();

    if (pkgError) {
      // The ticket exists but has no artifacts, which is worse than nothing:
      // an agent would pick it up expecting a script. Roll it back.
      await sb.from('sprint_tasks').delete().eq('id', taskId);
      console.error('Failed to store repro package:', pkgError.message);
      return NextResponse.json(
        { error: 'Failed to store the repro package. (Has supabase/repro_packages.sql been run?)' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      taskId: task.id,
      packageId: pkg.id,
      url: `/s/${project}/backlog?task=${encodeURIComponent(task.id)}`,
    });
  } catch (err) {
    console.error('Repro submit error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

// GET /api/repro?taskId=... — fetch the package behind a ticket.
// This is what an agent reads: the session JSON and the generated spec.
export async function GET(req: NextRequest) {
  try {
    const taskId = req.nextUrl.searchParams.get('taskId');
    if (!taskId) {
      return badRequest('taskId is required');
    }

    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('repro_packages')
      .select('id, task_id, version, session, spec, label, validation, created_at')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'No repro package for that task' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
