'use client';

import { useMemo, useState } from 'react';
import { useTasks } from '@/components/providers/TasksProvider';
import { useSpace } from '@/components/providers/SpaceProvider';
import { useTaskModal } from '@/components/providers/TaskModalProvider';
import { getTypeClass } from '@/lib/task-format';
import BulkActionBar from './BulkActionBar';

const COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'sprint', label: 'Sprint' },
  { key: 'area', label: 'Area' },
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type' },
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' },
  { key: 'assignee', label: 'Assignee' },
  { key: 'created', label: 'Created' },
  { key: 'updated_at', label: 'Updated' },
];

export default function BacklogView() {
  const { loading, showArchived } = useTasks();
  const { sortedTasks, sortField, sortAsc, handleSort } = useSpace();
  const { openEdit } = useTaskModal();
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  // Selection can outlive the visible list (filters change, a bulk move sends
  // tasks to another space), so actions only ever apply to the intersection.
  const visibleSelected = useMemo(
    () => sortedTasks.filter((t) => selected.has(t.id)).map((t) => t.id),
    [sortedTasks, selected]
  );
  const allVisibleSelected =
    sortedTasks.length > 0 && visibleSelected.length === sortedTasks.length;

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    setSelected(allVisibleSelected ? new Set() : new Set(sortedTasks.map((t) => t.id)));
  }

  if (loading) {
    return <div className="py-16 text-center text-gray-500">Loading tasks...</div>;
  }

  return (
    <div>
      {visibleSelected.length > 0 && (
        <BulkActionBar selectedIds={visibleSelected} onClear={() => setSelected(new Set())} />
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-800">
              <th className="w-8 py-2 pl-3 pr-1">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAll}
                  aria-label="Select all tasks"
                  className="h-3.5 w-3.5 rounded border-gray-600 bg-gray-700 accent-blue-600"
                />
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="py-2 px-3 cursor-pointer hover:text-white text-xs font-medium"
                >
                  {col.label} {sortField === col.key ? (sortAsc ? '▲' : '▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedTasks.map((task) => (
              <tr
                key={task.id}
                onClick={() => openEdit(task)}
                className={`border-b border-gray-800/50 hover:bg-gray-900 cursor-pointer${
                  showArchived === 'archived' ? ' opacity-50' : ''
                }${selected.has(task.id) ? ' bg-blue-500/5' : ''}`}
              >
                <td className="w-8 py-2 pl-3 pr-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.has(task.id)}
                    onChange={() => toggleOne(task.id)}
                    aria-label={`Select task ${task.id}`}
                    className="h-3.5 w-3.5 rounded border-gray-600 bg-gray-700 accent-blue-600"
                  />
                </td>
                <td className="py-2 px-3 text-gray-500">#{task.id}</td>
                <td className="py-2 px-3">{task.sprint || ''}</td>
                <td className="py-2 px-3 whitespace-nowrap">{task.area || ''}</td>
                <td className="py-2 px-3">{task.title}</td>
                <td className="py-2 px-3">
                  {task.type && (
                    <span className={`px-1.5 py-0.5 rounded text-xs ${getTypeClass(task.type)}`}>
                      {task.type}
                    </span>
                  )}
                </td>
                <td className="py-2 px-3">
                  <span
                    className={
                      task.priority === 'high'
                        ? 'text-red-400'
                        : task.priority === 'medium'
                          ? 'text-yellow-400'
                          : 'text-green-400'
                    }
                  >
                    {task.priority}
                  </span>
                </td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-0.5 rounded text-xs status-${task.status}`}>
                    {task.status}
                  </span>
                </td>
                <td className="py-2 px-3">{task.assignee || ''}</td>
                <td className="py-2 px-3 text-gray-500 whitespace-nowrap">{task.created || ''}</td>
                <td className="py-2 px-3 text-gray-500 whitespace-nowrap">
                  {task.updated_at ? new Date(task.updated_at).toLocaleDateString() : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
