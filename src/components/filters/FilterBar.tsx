'use client';

import { useTasks } from '@/components/providers/TasksProvider';
import { useSpace } from '@/components/providers/SpaceProvider';

const PRIORITIES = ['all', 'high', 'medium', 'low'];

export default function FilterBar() {
  const { showArchived, setShowArchived } = useTasks();
  const { filters, setFilter, sprintOptions, areaOptions, assigneeOptions } = useSpace();

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <select
        value={filters.sprint}
        onChange={(e) => setFilter('sprint', e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs"
      >
        <option value="all">All Sprints</option>
        {sprintOptions.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <div className="flex gap-1">
        {PRIORITIES.map((p) => (
          <button
            key={p}
            onClick={() => setFilter('priority', p)}
            className={`px-2 py-1 rounded text-xs capitalize ${
              filters.priority === p
                ? p === 'high'
                  ? 'bg-red-600 text-white'
                  : p === 'medium'
                    ? 'bg-yellow-600 text-white'
                    : p === 'low'
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {p === 'all' ? 'All Priority' : p}
          </button>
        ))}
      </div>

      <select
        value={filters.area}
        onChange={(e) => setFilter('area', e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs"
      >
        <option value="all">All Areas</option>
        {areaOptions.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      <select
        value={filters.assignee}
        onChange={(e) => setFilter('assignee', e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs"
      >
        <option value="all">All Assignees</option>
        {assigneeOptions.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      <div className="h-4 w-px bg-gray-700" />
      <button
        onClick={() => setShowArchived(showArchived === 'active' ? 'archived' : 'active')}
        className={`px-3 py-1 rounded text-xs flex items-center gap-1.5 ${
          showArchived === 'archived'
            ? 'bg-amber-600/30 text-amber-400'
            : 'text-gray-500 hover:text-gray-300'
        }`}
      >
        {showArchived === 'archived' ? '📦 Archived' : 'Archived'}
      </button>
    </div>
  );
}
