'use client';

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import {
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { DevTask, STATUSES } from '@/lib/types';

// Encapsulates board drag-and-drop: optimistic cross-column moves, persistence
// on drop, and revert-on-failure. Operates on the full task list (by id) even
// though the board only renders one space's columns.
export function useBoardDnd(
  tasks: DevTask[],
  setTasks: Dispatch<SetStateAction<DevTask[]>>,
  persistTask: (task: DevTask) => Promise<DevTask | null>
) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const dragOriginRef = useRef<string | null>(null);
  const tasksRef = useRef(tasks);

  // Keep latest tasks accessible inside event handlers (avoid stale closures).
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    setActiveId(id);
    const task = tasksRef.current.find((t) => t.id === id);
    dragOriginRef.current = task?.status ?? null;
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeTaskId = String(active.id);
    const overId = String(over.id);
    const current = tasksRef.current;
    const activeTask = current.find((t) => t.id === activeTaskId);
    if (!activeTask) return;

    let targetStatus: string | null = null;
    if ((STATUSES as readonly string[]).includes(overId)) {
      targetStatus = overId;
    } else {
      const overTask = current.find((t) => t.id === overId);
      if (overTask) targetStatus = overTask.status;
    }

    if (!targetStatus || activeTask.status === targetStatus) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === activeTaskId ? { ...t, status: targetStatus as string } : t))
    );
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const activeTaskId = String(active.id);
    const originalStatus = dragOriginRef.current;

    setActiveId(null);
    dragOriginRef.current = null;

    const task = tasksRef.current.find((t) => t.id === activeTaskId);
    if (!task || !originalStatus) return;

    // Dropped outside any column → revert.
    if (!over) {
      setTasks((prev) =>
        prev.map((t) => (t.id === activeTaskId ? { ...t, status: originalStatus } : t))
      );
      return;
    }

    // No change.
    if (task.status === originalStatus) return;

    const saved = await persistTask(task);
    if (!saved) {
      // Persist failed → revert.
      setTasks((prev) =>
        prev.map((t) => (t.id === activeTaskId ? { ...t, status: originalStatus } : t))
      );
    }
  }

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) ?? null : null;

  return { sensors, activeId, activeTask, handleDragStart, handleDragOver, handleDragEnd };
}
