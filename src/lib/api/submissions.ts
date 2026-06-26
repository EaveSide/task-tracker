import type { FeatureSubmission } from '../types';

// Thin wrappers over the existing /api/submit endpoints.

export async function fetchSubmissions(): Promise<FeatureSubmission[]> {
  const res = await fetch('/api/submit');
  if (!res.ok) throw new Error('Failed to load submissions');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function updateSubmission(
  id: string,
  updates: Record<string, unknown>
): Promise<void> {
  const res = await fetch('/api/submit', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updates }),
  });
  if (!res.ok) throw new Error('Update failed');
}
