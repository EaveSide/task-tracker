import { STATUS_LABELS } from './types';
import { DEFAULT_SPACES, FALLBACK_SPACE_COLOR, type Space } from './spaces';

// Shared task display helpers (previously duplicated across page.tsx and queue).
// Note: this resolves against the built-in defaults only; components that need
// custom (DB-added) spaces resolve via useSpaces() and fall back to this.

export function getProjectById(id: string): Space {
  return DEFAULT_SPACES.find((p) => p.id === id) ?? { id, name: id, color: FALLBACK_SPACE_COLOR };
}

export function getTypeClass(type: string | null): string {
  if (!type) return '';
  if (type.startsWith('Bug')) return 'type-bug';
  if (type === 'Feature Gap') return 'type-feature';
  if (type === 'Enhancement') return 'type-enhancement';
  return '';
}

export { STATUS_LABELS };
