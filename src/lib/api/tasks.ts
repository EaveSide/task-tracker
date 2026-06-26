import type { DevTask } from '../types';

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

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
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
