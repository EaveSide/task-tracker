import type { DevTask, TaskStatusEvent } from '../types';

// Thin wrappers over the existing /api/tasks endpoints. Centralizes every
// task fetch that used to be inline in page.tsx.

interface FetchTasksOptions {
  archivedOnly?: boolean;
  includeArchived?: boolean;
}

export async function fetchTasks(options: FetchTasksOptions = {}): Promise<DevTask[]> {
  const params = options.archivedOnly
    ? '?archived_only=true'
    : options.includeArchived
      ? '?include_archived=true'
      : '';
  const res = await fetch(`/api/tasks${params}`);
  if (!res.ok) throw new Error('Failed to load tasks');
  return res.json();
}

export async function saveTask(task: DevTask): Promise<DevTask> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Save failed');
  }
  return res.json();
}

export type BulkTaskUpdates = Partial<
  Pick<DevTask, 'assignee' | 'sprint' | 'status' | 'priority' | 'area' | 'project' | 'type'>
>;

export async function bulkUpdateTasks(ids: string[], updates: BulkTaskUpdates): Promise<DevTask[]> {
  const res = await fetch('/api/tasks/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids, updates }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Bulk update failed');
  }
  const result = await res.json();
  return result.updated ?? [];
}

export async function uploadTaskImages(files: File[], taskId?: string): Promise<string[]> {
  const fd = new FormData();
  files.forEach((f) => fd.append('images', f));
  if (taskId) fd.append('task_id', taskId);

  const res = await fetch('/api/tasks/images', { method: 'POST', body: fd });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Image upload failed');
  }
  const result = await res.json();
  return result.image_urls ?? [];
}

// Images dragged out of a web page or Slack arrive as URLs rather than bytes.
// The server fetches each one and re-hosts it in our own bucket.
export async function importTaskImagesFromUrls(urls: string[], taskId?: string): Promise<string[]> {
  const res = await fetch('/api/tasks/images/from-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls, task_id: taskId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Could not import that image');
  }
  const result = await res.json();
  return result.image_urls ?? [];
}

export async function fetchTaskHistory(taskId: string): Promise<TaskStatusEvent[]> {
  const res = await fetch(`/api/tasks/history?task_id=${encodeURIComponent(taskId)}`);
  if (!res.ok) throw new Error('Failed to load status history');
  return res.json();
}

export async function archiveTasks(ids: string[]): Promise<number> {
  const res = await fetch('/api/tasks/archive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error('Archive failed');
  const result = await res.json();
  return result.archived_count ?? ids.length;
}

export async function unarchiveTasks(ids: string[]): Promise<number> {
  const res = await fetch('/api/tasks/unarchive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error('Unarchive failed');
  const result = await res.json();
  return result.unarchived_count ?? ids.length;
}
