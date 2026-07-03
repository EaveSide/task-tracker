'use client';

import { useEffect, useState } from 'react';
import { TaskStatusEvent, STATUS_LABELS } from '@/lib/types';
import { fetchTaskHistory } from '@/lib/api/tasks';

interface StatusHistoryProps {
  taskId: string;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

// Collapsible status change log shown on existing tasks. Loads lazily the
// first time it's expanded; tasks created before the log table existed will
// simply show no entries.
export default function StatusHistory({ taskId }: StatusHistoryProps) {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<TaskStatusEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || events !== null) return;
    let cancelled = false;
    fetchTaskHistory(taskId)
      .then((data) => {
        if (!cancelled) setEvents(data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load status history');
      });
    return () => {
      cancelled = true;
    };
  }, [open, events, taskId]);

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-800/40 px-3 py-2.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-sm font-medium text-gray-300 hover:text-white"
      >
        <span>Status History</span>
        <span className="text-xs text-gray-500">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-2">
          {error && <p className="text-xs text-red-400">{error}</p>}
          {!error && events === null && <p className="text-xs text-gray-500">Loading...</p>}
          {events !== null && events.length === 0 && (
            <p className="text-xs text-gray-500">No status changes recorded for this task.</p>
          )}
          {events !== null && events.length > 0 && (
            <ul className="space-y-1.5">
              {events.map((e) => (
                <li key={e.id} className="flex items-baseline justify-between gap-3 text-xs">
                  <span className="text-gray-300">
                    {e.from_status === null ? (
                      <>
                        Created as <span className="text-gray-100">{statusLabel(e.to_status)}</span>
                      </>
                    ) : (
                      <>
                        {statusLabel(e.from_status)}
                        <span className="text-gray-500"> → </span>
                        <span className="text-gray-100">{statusLabel(e.to_status)}</span>
                      </>
                    )}
                  </span>
                  <span className="whitespace-nowrap text-gray-500">
                    {formatTimestamp(e.changed_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
