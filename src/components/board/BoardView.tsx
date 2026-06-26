'use client';

import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import { STATUSES } from '@/lib/types';
import { STATUS_LABELS } from '@/lib/task-format';
import { useTasks } from '@/components/providers/TasksProvider';
import { useSpace } from '@/components/providers/SpaceProvider';
import { useTaskModal } from '@/components/providers/TaskModalProvider';
import { useBoardDnd } from './useBoardDnd';
import BoardColumn from './BoardColumn';
import TaskCard from './TaskCard';

export default function BoardView() {
  const { tasks, setTasks, persistTask, loading, showArchived } = useTasks();
  const { filteredTasks } = useSpace();
  const { openEdit } = useTaskModal();
  const { sensors, activeTask, handleDragStart, handleDragOver, handleDragEnd } = useBoardDnd(
    tasks,
    setTasks,
    persistTask
  );

  if (loading) {
    return <div className="py-16 text-center text-gray-500">Loading tasks...</div>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        className={`flex gap-4 overflow-x-auto pb-4${
          showArchived === 'archived' ? ' opacity-50' : ''
        }`}
      >
        {STATUSES.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            label={STATUS_LABELS[status]}
            tasks={filteredTasks.filter((t) => t.status === status)}
            onEdit={openEdit}
          />
        ))}
      </div>
      <DragOverlay>{activeTask ? <TaskCard task={activeTask} isOverlay /> : null}</DragOverlay>
    </DndContext>
  );
}
