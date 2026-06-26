'use client';

import type { DevTask } from '@/lib/types';
import { getProjectById, getTypeClass, STATUS_LABELS } from '@/lib/task-format';

export type QuickAction = 'start' | 'done' | 'block';

interface QueueCardProps {
  task: DevTask;
  onQuickAction: (taskId: string, action: QuickAction) => void;
  onClick?: (task: DevTask) => void;
  dragHandleProps?: Record<string, unknown>;
  isOverlay?: boolean;
}

export default function QueueCard({
  task,
  onQuickAction,
  onClick,
  dragHandleProps,
  isOverlay,
}: QueueCardProps) {
  const proj = getProjectById(task.project);

  return (
    <div
      className={`queue-card bg-gray-900 border border-gray-800 rounded-lg p-3 priority-${task.priority} ${
        isOverlay ? 'queue-drag-overlay' : 'hover:border-gray-600 cursor-pointer'
      } transition-colors relative group`}
      onClick={() => !isOverlay && onClick?.(task)}
    >
      <div className="flex gap-2">
        <div
          {...dragHandleProps}
          className="queue-drag-handle flex-shrink-0 mt-0.5 text-gray-600 hover:text-gray-400 transition-colors"
        >
          <svg width="12" height="20" viewBox="0 0 12 20" fill="currentColor">
            <circle cx="3" cy="3" r="1.5" />
            <circle cx="9" cy="3" r="1.5" />
            <circle cx="3" cy="10" r="1.5" />
            <circle cx="9" cy="10" r="1.5" />
            <circle cx="3" cy="17" r="1.5" />
            <circle cx="9" cy="17" r="1.5" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: `${proj.color}20`, color: proj.color }}
            >
              {proj.name}
            </span>
            <span className="text-xs text-gray-500">{task.sprint || ''}</span>
          </div>

          {task.area && <div className="text-xs text-gray-500 mb-1">{task.area}</div>}

          <div className="text-sm font-medium mb-2 line-clamp-2" title={task.title}>
            {task.title}
          </div>

          <div className="flex items-center flex-wrap gap-1.5 text-xs text-gray-500">
            <span>#{task.id}</span>
            {task.type && (
              <span className={`px-1.5 py-0.5 rounded ${getTypeClass(task.type)}`}>{task.type}</span>
            )}
            <span className={`status-${task.status} px-1.5 py-0.5 rounded`}>
              {STATUS_LABELS[task.status] || task.status}
            </span>
            {task.est_hours > 0 && <span className="text-gray-400">{task.est_hours}h</span>}
          </div>

          {task.blocked_by && (
            <div className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM4.5 7.5h7v1h-7v-1z" />
              </svg>
              Blocked by {task.blocked_by}
            </div>
          )}
        </div>
      </div>

      {!isOverlay && (
        <div className="queue-card-actions absolute top-2 right-2 flex gap-1">
          {task.status !== 'in-progress' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickAction(task.id, 'start');
              }}
              title="Start"
              className="w-6 h-6 flex items-center justify-center rounded bg-blue-600/80 hover:bg-blue-600 text-white text-xs transition-colors"
            >
              ▶
            </button>
          )}
          {task.status !== 'done' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickAction(task.id, 'done');
              }}
              title="Mark Done"
              className="w-6 h-6 flex items-center justify-center rounded bg-green-600/80 hover:bg-green-600 text-white text-xs transition-colors"
            >
              ✓
            </button>
          )}
          {task.status !== 'blocked' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickAction(task.id, 'block');
              }}
              title="Block"
              className="w-6 h-6 flex items-center justify-center rounded bg-red-600/80 hover:bg-red-600 text-white text-xs transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}
