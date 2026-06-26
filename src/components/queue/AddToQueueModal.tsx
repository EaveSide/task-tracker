'use client';

import { useMemo, useState } from 'react';
import type { DevTask } from '@/lib/types';
import { getTypeClass } from '@/lib/task-format';
import { ASSIGNEES } from './useQueueOrder';

interface AddToQueueModalProps {
  tasks: DevTask[];
  onAssign: (taskId: string, assignee: string) => void;
  onClose: () => void;
}

export default function AddToQueueModal({ tasks, onAssign, onClose }: AddToQueueModalProps) {
  const [search, setSearch] = useState('');

  const unassigned = useMemo(() => {
    const q = search.toLowerCase();
    return tasks.filter(
      (t) =>
        t.status !== 'done' &&
        !t.archived &&
        !ASSIGNEES.includes(t.assignee as (typeof ASSIGNEES)[number]) &&
        (!q || t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))
    );
  }, [tasks, search]);

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold mb-3">Add Task to Queue</h2>
          <input
            autoFocus
            type="text"
            placeholder="Search unassigned tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            {unassigned.length} unassigned task{unassigned.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {unassigned.length === 0 && (
            <div className="text-center text-gray-500 text-sm py-8">No unassigned tasks found</div>
          )}
          {unassigned.slice(0, 50).map((task) => (
            <div
              key={task.id}
              className={`bg-gray-800 border border-gray-700 rounded-lg p-3 priority-${task.priority}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">#{task.id}</span>
                {task.type && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${getTypeClass(task.type)}`}>
                    {task.type}
                  </span>
                )}
              </div>
              <div className="text-sm font-medium mb-2">{task.title}</div>
              <div className="flex items-center gap-2">
                {ASSIGNEES.map((name) => (
                  <button
                    key={name}
                    onClick={() => onAssign(task.id, name)}
                    className="bg-blue-600/80 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                  >
                    → {name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-800">
          <button onClick={onClose} className="text-sm text-gray-400 hover:text-white">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
