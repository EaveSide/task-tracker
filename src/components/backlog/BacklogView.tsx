'use client';

import { useTasks } from '@/components/providers/TasksProvider';
import { useSpace } from '@/components/providers/SpaceProvider';
import { useTaskModal } from '@/components/providers/TaskModalProvider';
import { getTypeClass } from '@/lib/task-format';

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

  if (loading) {
    return <div className="py-16 text-center text-gray-500">Loading tasks...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-400 border-b border-gray-800">
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
              }`}
            >
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
  );
}
