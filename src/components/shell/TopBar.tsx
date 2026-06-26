'use client';

import { useSpace } from '@/components/providers/SpaceProvider';
import { useTaskModal } from '@/components/providers/TaskModalProvider';

export default function TopBar() {
  const { space, spaceId, search, setSearch } = useSpace();
  const { openNew } = useTaskModal();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
      <div className="flex items-center gap-2.5">
        <span
          className="h-3 w-3 rounded-sm"
          style={{ background: space.color }}
          aria-hidden
        />
        <h1 className="text-xl font-bold">{space.name}</h1>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={() => openNew({ project: spaceId })}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          + New Task
        </button>
      </div>
    </div>
  );
}
