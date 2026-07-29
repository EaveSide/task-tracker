import { STATUS_LABELS, type DevTask } from './types';
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

export interface DeferralBadge {
  label: string;
  className: string;
  title: string;
}

function formatDay(iso: string): string {
  const when = new Date(iso);
  return Number.isNaN(when.getTime())
    ? 'later'
    : when.toLocaleString(undefined, { weekday: 'short', hour: 'numeric' });
}

/**
 * How a ticket the agent is skipping should read on the board. Without this a
 * snoozed ticket looks identical to one the agent is ignoring for no reason,
 * which is the confusion the deferral columns exist to remove.
 * Returns null for ordinary tickets, and for a snooze whose time has passed -
 * an expired snooze is not a deferral any more.
 */
export function getDeferralBadge(task: DevTask, now: Date = new Date()): DeferralBadge | null {
  const context = [task.deferred_by && `by ${task.deferred_by}`, task.deferral_reason]
    .filter(Boolean)
    .join(' — ');
  const withContext = (base: string) => (context ? `${base} (${context})` : base);

  if (task.dismissed_at) {
    return {
      label: 'Dismissed',
      className: 'bg-gray-700/40 text-gray-300',
      title: withContext('The agent will not pick this up. Anyone can still work it.'),
    };
  }
  if (task.snoozed_until && new Date(task.snoozed_until) > now) {
    return {
      label: `Snoozed · ${formatDay(task.snoozed_until)}`,
      className: 'bg-amber-500/15 text-amber-300',
      title: withContext('Back in the agent queue automatically when this passes.'),
    };
  }
  if (task.deprioritized_at) {
    return {
      label: 'Bottom of queue',
      className: 'bg-blue-500/15 text-blue-300',
      title: withContext('Still gets worked, after everything else.'),
    };
  }
  return null;
}

export { STATUS_LABELS };
