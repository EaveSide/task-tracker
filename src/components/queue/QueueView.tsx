'use client';

import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import type { DevTask } from '@/lib/types';
import { STATUS_LABELS } from '@/lib/task-format';
import { useTasks } from '@/components/providers/TasksProvider';
import { useTaskModal } from '@/components/providers/TaskModalProvider';
import { ASSIGNEES, mergeWithStoredOrder, useQueueOrder } from './useQueueOrder';
import QueueColumn from './QueueColumn';
import QueueCard, { type QuickAction } from './QueueCard';
import Toast from './Toast';
import AddToQueueModal from './AddToQueueModal';
import './queue.css';

export default function QueueView() {
  const { tasks, setTasks, persistTask, loading } = useTasks();
  const { openEdit } = useTaskModal();
  const { queueOrder, updateOrder } = useQueueOrder();

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const columns = useMemo(() => {
    const result: Record<string, DevTask[]> = {};
    for (const name of ASSIGNEES) {
      const assigneeTasks = tasks.filter(
        (t) => t.assignee === name && t.status !== 'done' && !t.archived
      );
      result[name] = mergeWithStoredOrder(assigneeTasks, queueOrder[name] || []);
    }
    return result;
  }, [tasks, queueOrder]);

  async function assignToQueue(taskId: string, assignee: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const saved = await persistTask({ ...task, assignee });
    setToast(
      saved
        ? { message: `${task.id} → ${assignee}'s queue`, type: 'success' }
        : { message: 'Failed to assign', type: 'error' }
    );
  }

  async function handleQuickAction(taskId: string, action: QuickAction) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    let updates: Partial<DevTask> = {};
    if (action === 'start') {
      updates = { status: 'in-progress' };
    } else if (action === 'done') {
      updates = { status: 'done', completed: new Date().toISOString().split('T')[0] };
    } else if (action === 'block') {
      const blockerId = window.prompt('Enter blocker task ID:');
      if (!blockerId) return;
      updates = { status: 'blocked', blocked_by: blockerId };
    }

    const original = { ...task };
    const updated = { ...task, ...updates };
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));

    const saved = await persistTask(updated);
    if (saved) {
      setToast({
        message: `${task.id} → ${STATUS_LABELS[updates.status!] || updates.status}`,
        type: 'success',
      });
      if (action === 'done') {
        const newOrder = { ...queueOrder };
        for (const name of ASSIGNEES) {
          if (newOrder[name]) newOrder[name] = newOrder[name].filter((id) => id !== taskId);
        }
        updateOrder(newOrder);
      }
    } else {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? original : t)));
      setToast({ message: `Failed to update ${task.id}`, type: 'error' });
    }
  }

  function findColumn(taskId: string): string | null {
    for (const name of ASSIGNEES) {
      if (columns[name]?.some((t) => t.id === taskId)) return name;
    }
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeCol = findColumn(String(active.id));
    let overCol = findColumn(String(over.id));
    if (!overCol) {
      const overElement = document.querySelector(`[data-column]`);
      if (overElement) overCol = overElement.getAttribute('data-column');
    }

    if (!activeCol || !overCol || activeCol === overCol) return;

    const activeTask = tasks.find((t) => t.id === String(active.id));
    if (!activeTask) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === activeTask.id ? { ...t, assignee: overCol! } : t))
    );
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const draggedId = String(active.id);
    const overId = String(over.id);
    const activeCol = findColumn(draggedId);
    if (!activeCol) return;

    const colTasks = columns[activeCol] || [];
    const oldIndex = colTasks.findIndex((t) => t.id === draggedId);
    const newIndex = colTasks.findIndex((t) => t.id === overId);
    if (oldIndex === -1) return;

    const originalTask = tasks.find((t) => t.id === draggedId);
    if (!originalTask) return;

    if (originalTask.assignee !== activeCol) {
      const saved = await persistTask({ ...originalTask, assignee: activeCol });
      if (saved) {
        setToast({
          message: `Moved "${originalTask.title}" to ${activeCol}'s queue`,
          type: 'success',
        });
      } else {
        setTasks((prev) =>
          prev.map((t) => (t.id === draggedId ? { ...t, assignee: originalTask.assignee } : t))
        );
        setToast({ message: 'Failed to reassign task', type: 'error' });
        return;
      }
    }

    if (newIndex !== -1 && oldIndex !== newIndex) {
      const reordered = arrayMove(colTasks, oldIndex, newIndex);
      updateOrder({ ...queueOrder, [activeCol]: reordered.map((t) => t.id) });
    } else {
      updateOrder({ ...queueOrder, [activeCol]: colTasks.map((t) => t.id) });
    }
  }

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) ?? null : null;

  if (loading) {
    return <div className="py-16 text-center text-gray-500">Loading queue...</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold">My Work Queue</h1>
        <button
          onClick={() => setAddOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          + Add to Queue
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-4">
          {ASSIGNEES.map((name) => (
            <QueueColumn
              key={name}
              assignee={name}
              tasks={columns[name] || []}
              onQuickAction={handleQuickAction}
              onTaskClick={openEdit}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <QueueCard task={activeTask} onQuickAction={() => {}} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      {addOpen && (
        <AddToQueueModal tasks={tasks} onAssign={assignToQueue} onClose={() => setAddOpen(false)} />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}
