'use client';

import { AREAS, STATUSES, STATUS_LABELS } from '@/lib/types';
import type { BulkTaskUpdates } from '@/lib/api/tasks';
import { useTasks } from '@/components/providers/TasksProvider';
import { useUsers } from '@/components/providers/UsersProvider';
import { useSpaces } from '@/components/providers/SpacesProvider';

interface BulkActionBarProps {
  selectedIds: string[];
  onClear: () => void;
}

const PRIORITIES = ['high', 'medium', 'low'];

const selectCls =
  'rounded-lg border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-xs text-gray-200 focus:border-blue-500 focus:outline-none disabled:opacity-50';

// Action bar shown above the backlog table while tasks are selected. Every
// dropdown applies its field to the whole selection as soon as a value is
// picked, then resets so it reads as an action, not a state.
export default function BulkActionBar({ selectedIds, onClear }: BulkActionBarProps) {
  const { saving, archiving, bulkUpdate, archiveTasks, sprints } = useTasks();
  const { users } = useUsers();
  const { spaces } = useSpaces();

  const busy = saving || archiving;

  async function apply(updates: BulkTaskUpdates) {
    await bulkUpdate(selectedIds, updates);
  }

  async function handleArchive() {
    if (!confirm(`Archive ${selectedIds.length} selected task(s)?`)) return;
    await archiveTasks(selectedIds);
    onClear();
  }

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/5 px-3 py-2.5">
      <span className="text-xs font-medium text-blue-300">
        {selectedIds.length} selected
      </span>

      <select
        value=""
        onChange={(e) => e.target.value && apply({ assignee: e.target.value === '__none__' ? '' : e.target.value })}
        disabled={busy}
        className={selectCls}
        aria-label="Re-assign selected"
      >
        <option value="">Re-assign to…</option>
        <option value="__none__">Unassigned</option>
        {users.map((u) => (
          <option key={u.id} value={u.name}>
            {u.name}
          </option>
        ))}
      </select>

      <select
        value=""
        onChange={(e) => e.target.value && apply({ sprint: e.target.value })}
        disabled={busy}
        className={selectCls}
        aria-label="Move selected to sprint"
      >
        <option value="">Move to sprint…</option>
        {sprints.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        value=""
        onChange={(e) => e.target.value && apply({ project: e.target.value })}
        disabled={busy}
        className={selectCls}
        aria-label="Move selected to space"
      >
        <option value="">Move to space…</option>
        {spaces.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <select
        value=""
        onChange={(e) => e.target.value && apply({ status: e.target.value })}
        disabled={busy}
        className={selectCls}
        aria-label="Set status of selected"
      >
        <option value="">Set status…</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      <select
        value=""
        onChange={(e) => e.target.value && apply({ priority: e.target.value })}
        disabled={busy}
        className={selectCls}
        aria-label="Set priority of selected"
      >
        <option value="">Set priority…</option>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <select
        value=""
        onChange={(e) => e.target.value && apply({ area: e.target.value })}
        disabled={busy}
        className={selectCls}
        aria-label="Set area of selected"
      >
        <option value="">Set area…</option>
        {AREAS.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      <button
        onClick={handleArchive}
        disabled={busy}
        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/10 disabled:opacity-50"
      >
        {archiving ? 'Archiving…' : 'Archive'}
      </button>

      <button
        onClick={onClear}
        disabled={busy}
        className="ml-auto rounded-lg px-2.5 py-1.5 text-xs text-gray-400 transition-colors hover:text-white disabled:opacity-50"
      >
        Clear selection
      </button>
    </div>
  );
}
