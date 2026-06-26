'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DevTask } from '@/lib/types';
import TaskCard from './TaskCard';

interface SortableTaskCardProps {
  task: DevTask;
  onEdit: (task: DevTask) => void;
}

export default function SortableTaskCard({ task, onEdit }: SortableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { status: task.status },
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'opacity-30' : ''}
      onClick={() => !isDragging && onEdit(task)}
    >
      <TaskCard task={task} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
}
