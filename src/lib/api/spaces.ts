import type { Space } from '../spaces';

// Client wrappers over /api/spaces.

export async function fetchSpaces(): Promise<Space[]> {
  const res = await fetch('/api/spaces');
  if (!res.ok) throw new Error('Failed to load spaces');
  return res.json();
}

export async function createSpace(name: string, color: string): Promise<Space> {
  const res = await fetch('/api/spaces', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create space');
  }
  return res.json();
}

export async function deleteSpace(id: string): Promise<void> {
  const res = await fetch(`/api/spaces?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete space');
  }
}
