'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DevTask } from '@/lib/types';
import QueueCard, { type QuickAction } from './QueueCard';

interface SortableQueueCardProps {
  task: DevTask;
  onQuickAction: (taskId: string, action: QuickAction) => void;
  onClick: (task: DevTask) => void;
}

export default function SortableQueueCard({ task, onQuickAction, onClick }: SortableQueueCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'queue-card-dragging' : ''}>
      <QueueCard
        task={task}
        onQuickAction={onQuickAction}
        onClick={onClick}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}
