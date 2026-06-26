'use client';

import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { DevTask } from '@/lib/types';
import SortableTaskCard from './SortableTaskCard';

interface BoardColumnProps {
  status: string;
  label: string;
  tasks: DevTask[];
  onEdit: (task: DevTask) => void;
}

export default function BoardColumn({ status, label, tasks, onEdit }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const ids = useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <div className="min-w-[280px] flex-1">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="font-semibold text-sm text-gray-300">{label}</h3>
        <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full text-gray-400">
          {tasks.length}
        </span>
      </div>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`space-y-2 min-h-[80px] rounded-lg p-1 transition-colors ${
            isOver ? 'bg-blue-900/20 ring-1 ring-blue-700/40 ring-inset' : ''
          }`}
        >
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onEdit={onEdit} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
