import { PROJECTS, STATUS_LABELS } from './types';
import type { Space } from './spaces';

// Shared task display helpers (previously duplicated across page.tsx and queue).

export function getProjectById(id: string): Space {
  return PROJECTS.find((p) => p.id === id) ?? { id, name: id, color: '#64748b' };
}

export function getTypeClass(type: string | null): string {
  if (!type) return '';
  if (type.startsWith('Bug')) return 'type-bug';
  if (type === 'Feature Gap') return 'type-feature';
  if (type === 'Enhancement') return 'type-enhancement';
  return '';
}

export { STATUS_LABELS };
