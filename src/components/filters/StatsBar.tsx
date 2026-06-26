'use client';

import { useTasks } from '@/components/providers/TasksProvider';
import { useSpace } from '@/components/providers/SpaceProvider';

export default function StatsBar() {
  const { showArchived, archiving, archiveTasks, unarchiveTasks } = useTasks();
  const { stats, filteredTasks } = useSpace();

  return (
    <div className="flex flex-wrap items-center gap-4 mb-5 text-sm text-gray-400">
      <span>
        <span className="text-white font-semibold">{stats.total}</span> total
      </span>
      <span>
        <span className="text-green-400 font-semibold">{stats.done}</span> done
      </span>
      <span>
        <span className="text-blue-400 font-semibold">{stats.inProg}</span> in progress
      </span>
      <span>
        <span className="text-purple-400 font-semibold">{stats.inReview}</span> in review
      </span>
      <span>
        <span className="text-red-400 font-semibold">{stats.blocked}</span> blocked
      </span>
      <span>
        <span className="text-orange-400 font-semibold">{stats.high}</span> high priority open
      </span>
      <span>
        <span className="text-white font-semibold">{stats.totalHours}</span> est. hours
      </span>

      {showArchived === 'active' && stats.done > 0 && (
        <>
          <div className="h-4 w-px bg-gray-700" />
          <button
            onClick={() => {
              const doneIds = filteredTasks.filter((t) => t.status === 'done').map((t) => t.id);
              if (doneIds.length === 0) return;
              if (!confirm(`Archive ${doneIds.length} done task(s)?`)) return;
              archiveTasks(doneIds);
            }}
            disabled={archiving}
            className="text-xs px-2.5 py-1 rounded bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 disabled:opacity-50 transition-colors"
          >
            {archiving ? 'Archiving...' : `Archive All Done (${stats.done})`}
          </button>
        </>
      )}

      {showArchived === 'active' && filteredTasks.length > 0 && (
        <button
          onClick={() => {
            const ids = filteredTasks.map((t) => t.id);
            if (!confirm(`Archive ${ids.length} filtered task(s)?`)) return;
            archiveTasks(ids);
          }}
          disabled={archiving}
          className="text-xs px-2.5 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 transition-colors"
        >
          Archive Filtered ({filteredTasks.length})
        </button>
      )}

      {showArchived === 'archived' && filteredTasks.length > 0 && (
        <button
          onClick={() => {
            const ids = filteredTasks.map((t) => t.id);
            if (!confirm(`Unarchive ${ids.length} task(s)?`)) return;
            unarchiveTasks(ids);
          }}
          disabled={archiving}
          className="text-xs px-2.5 py-1 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 disabled:opacity-50 transition-colors"
        >
          Unarchive Filtered ({filteredTasks.length})
        </button>
      )}
    </div>
  );
}
