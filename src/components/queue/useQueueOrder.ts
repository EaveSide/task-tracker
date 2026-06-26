'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DevTask } from '@/lib/types';

export const ASSIGNEES = ['George', 'Will'] as const;
const STORAGE_KEY = 'queue-order';

const STATUS_SORT: Record<string, number> = {
  'in-progress': 0,
  review: 1,
  todo: 2,
  blocked: 3,
};
const PRIORITY_SORT: Record<string, number> = { high: 0, medium: 1, low: 2 };
const TYPE_SORT: Record<string, number> = {
  'Bug (Critical)': 0,
  'Bug - Critical': 0,
  'Bug - High': 1,
  'Bug Fix': 2,
  'Bug - Medium': 2,
  'Feature Gap': 3,
  Enhancement: 4,
  Refactor: 5,
  Documentation: 6,
  Discovery: 7,
};

export function defaultSort(a: DevTask, b: DevTask): number {
  const s = (STATUS_SORT[a.status] ?? 9) - (STATUS_SORT[b.status] ?? 9);
  if (s !== 0) return s;
  const p = (PRIORITY_SORT[a.priority] ?? 9) - (PRIORITY_SORT[b.priority] ?? 9);
  if (p !== 0) return p;
  return (TYPE_SORT[a.type ?? ''] ?? 9) - (TYPE_SORT[b.type ?? ''] ?? 9);
}

function loadStoredOrder(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredOrder(order: Record<string, string[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
}

export function mergeWithStoredOrder(tasks: DevTask[], storedIds: string[]): DevTask[] {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const ordered: DevTask[] = [];
  const seen = new Set<string>();

  for (const id of storedIds) {
    const task = taskMap.get(id);
    if (task) {
      ordered.push(task);
      seen.add(id);
    }
  }

  const remaining = tasks.filter((t) => !seen.has(t.id)).sort(defaultSort);
  return [...ordered, ...remaining];
}

// Per-assignee card ordering, persisted to localStorage.
export function useQueueOrder() {
  const [queueOrder, setQueueOrder] = useState<Record<string, string[]>>({});
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      // Read persisted order from localStorage after mount (not during render)
      // so server and client first paint match and avoid a hydration mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQueueOrder(loadStoredOrder());
      initialized.current = true;
    }
  }, []);

  const updateOrder = useCallback((order: Record<string, string[]>) => {
    setQueueOrder(order);
    saveStoredOrder(order);
  }, []);

  return { queueOrder, updateOrder };
}
