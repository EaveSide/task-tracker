'use client';

import { useMemo } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { DevTask } from '@/lib/types';
import SortableQueueCard from './SortableQueueCard';
import type { QuickAction } from './QueueCard';

interface QueueColumnProps {
  assignee: string;
  tasks: DevTask[];
  onQuickAction: (taskId: string, action: QuickAction) => void;
  onTaskClick: (task: DevTask) => void;
}

export default function QueueColumn({
  assignee,
  tasks,
  onQuickAction,
  onTaskClick,
}: QueueColumnProps) {
  const totalHours = tasks.reduce((s, t) => s + (t.est_hours || 0), 0);
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
  const ids = useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <div className="flex-1 min-w-[320px]">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{assignee}&apos;s Queue</h2>
          <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full text-gray-400">
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {inProgress > 0 && (
            <span>
              <span className="text-blue-400 font-medium">{inProgress}</span> active
            </span>
          )}
          <span>
            <span className="text-white font-medium">{totalHours}</span>h total
          </span>
        </div>
      </div>

      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[100px]" data-column={assignee}>
          {tasks.length === 0 && (
            <div className="text-center text-gray-600 text-sm py-8 border border-dashed border-gray-800 rounded-lg">
              No tasks assigned
            </div>
          )}
          {tasks.map((task) => (
            <SortableQueueCard
              key={task.id}
              task={task}
              onQuickAction={onQuickAction}
              onClick={onTaskClick}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
