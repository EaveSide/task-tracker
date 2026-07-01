'use client';

import type { DevTask } from '@/lib/types';
import { getProjectById, getTypeClass } from '@/lib/task-format';
import { useSpaces } from '@/components/providers/SpacesProvider';

interface TaskCardProps {
  task: DevTask;
  dragHandleProps?: Record<string, unknown>;
  isOverlay?: boolean;
}

export default function TaskCard({ task, dragHandleProps, isOverlay }: TaskCardProps) {
  const { getSpace } = useSpaces();
  const proj = getSpace(task.project) ?? getProjectById(task.project);
  return (
    <div
      className={`bg-gray-900 border border-gray-800 rounded-lg p-3 transition-colors priority-${task.priority} ${
        isOverlay ? 'shadow-2xl opacity-95 cursor-grabbing' : 'hover:border-gray-600 cursor-pointer'
      }`}
    >
      <div className="flex gap-2">
        <div
          {...dragHandleProps}
          className="board-drag-handle flex-shrink-0 mt-0.5 text-gray-600 hover:text-gray-400 transition-colors"
        >
          <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
            <circle cx="2.5" cy="2.5" r="1.5" />
            <circle cx="7.5" cy="2.5" r="1.5" />
            <circle cx="2.5" cy="8" r="1.5" />
            <circle cx="7.5" cy="8" r="1.5" />
            <circle cx="2.5" cy="13.5" r="1.5" />
            <circle cx="7.5" cy="13.5" r="1.5" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: `${proj.color}20`, color: proj.color }}
            >
              {proj.name}
            </span>
            <span className="text-xs text-gray-500">{task.sprint || ''}</span>
          </div>
          {task.area && <div className="text-xs text-gray-500 mb-1">{task.area}</div>}
          <div className="text-sm font-medium mb-2">{task.title}</div>
          {task.image_urls && task.image_urls.length > 0 && (
            <div className="mb-2 flex items-center gap-1 text-xs text-gray-500">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="12" height="12" rx="2" />
                <circle cx="6" cy="6" r="1.2" />
                <path d="M14 10l-3-3-5 5" />
              </svg>
              <span>{task.image_urls.length}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>#{task.id}</span>
            <div className="flex items-center gap-2">
              {task.type && (
                <span className={`px-1.5 py-0.5 rounded ${getTypeClass(task.type)}`}>{task.type}</span>
              )}
              {task.assignee && <span>{task.assignee}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
