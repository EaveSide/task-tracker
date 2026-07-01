'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { DevTask, FeatureSubmission } from '@/lib/types';
import { makeEmptyTask } from '@/lib/empty-task';
import { useTasks } from './TasksProvider';
import { useSubmissions } from './SubmissionsProvider';
import TaskModal from '@/components/task-modal/TaskModal';

interface TaskModalContextValue {
  openNew: (defaults?: Partial<DevTask>) => void;
  openEdit: (task: DevTask) => void;
  acceptSubmission: (sub: FeatureSubmission) => void;
  /** One-click approve: create a task from the submission and move it to the board. */
  quickApprove: (sub: FeatureSubmission, assignee: string) => Promise<void>;
}

const TaskModalContext = createContext<TaskModalContextValue | null>(null);

export function useTaskModal(): TaskModalContextValue {
  const ctx = useContext(TaskModalContext);
  if (!ctx) throw new Error('useTaskModal must be used within a TaskModalProvider');
  return ctx;
}

const SUBMISSION_TYPE_TO_TASK_TYPE: Record<string, string> = {
  bug: 'Bug Fix',
  feature: 'Feature Gap',
  improvement: 'Enhancement',
};

export function TaskModalProvider({ children }: { children: ReactNode }) {
  const tasksCtx = useTasks();
  const subsCtx = useSubmissions();
  const [open, setOpen] = useState(false);
  const [task, setTask] = useState<DevTask | null>(null);
  const [accepting, setAccepting] = useState<FeatureSubmission | null>(null);

  const openNew = useCallback((defaults?: Partial<DevTask>) => {
    setAccepting(null);
    setTask(makeEmptyTask(defaults));
    setOpen(true);
  }, []);

  const openEdit = useCallback((t: DevTask) => {
    setAccepting(null);
    setTask(t);
    setOpen(true);
  }, []);

  const acceptSubmission = useCallback((sub: FeatureSubmission) => {
    setAccepting(sub);
    setTask(
      makeEmptyTask({
        title: sub.title,
        description:
          sub.description +
          (sub.submitted_by_name ? `\n\nSubmitted by: ${sub.submitted_by_name}` : '') +
          (sub.submitted_by_email ? ` (${sub.submitted_by_email})` : ''),
        type: SUBMISSION_TYPE_TO_TASK_TYPE[sub.type] || 'Enhancement',
        area: '',
        image_urls: sub.image_urls,
      })
    );
    setOpen(true);
  }, []);

  const quickApprove = useCallback(
    async (sub: FeatureSubmission, assignee: string) => {
      const saved = await tasksCtx.persistTask(
        makeEmptyTask({
          title: sub.title,
          description:
            sub.description +
            (sub.submitted_by_name ? `\n\nSubmitted by: ${sub.submitted_by_name}` : '') +
            (sub.submitted_by_email ? ` (${sub.submitted_by_email})` : ''),
          type: SUBMISSION_TYPE_TO_TASK_TYPE[sub.type] || 'Enhancement',
          assignee,
          status: 'todo',
          image_urls: sub.image_urls,
        })
      );
      if (!saved) {
        alert('Could not create the task. Please try again.');
        return;
      }
      await subsCtx.updateSubmission(sub.id, {
        status: 'accepted',
        linked_task_id: saved.id,
      });
    },
    [tasksCtx, subsCtx]
  );

  const close = useCallback(() => {
    setOpen(false);
    setAccepting(null);
  }, []);

  const handleSave = useCallback(
    async (t: DevTask) => {
      const saved = await tasksCtx.saveTask(t);
      if (!saved) return;
      if (accepting) {
        await subsCtx.updateSubmission(accepting.id, {
          status: 'accepted',
          linked_task_id: saved.id,
        });
        setAccepting(null);
      }
      close();
    },
    [tasksCtx, subsCtx, accepting, close]
  );

  const handleArchive = useCallback(
    async (id: string) => {
      await tasksCtx.archiveTasks([id]);
      close();
    },
    [tasksCtx, close]
  );

  const handleUnarchive = useCallback(
    async (id: string) => {
      await tasksCtx.unarchiveTasks([id]);
      close();
    },
    [tasksCtx, close]
  );

  // Global shortcuts: Esc closes, "n" opens a new task.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
      if (
        e.key === 'n' &&
        !open &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        openNew();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close, openNew]);

  return (
    <TaskModalContext.Provider value={{ openNew, openEdit, acceptSubmission, quickApprove }}>
      {children}
      {open && task && (
        <TaskModal
          task={task}
          saving={tasksCtx.saving}
          sprints={tasksCtx.sprints}
          onSave={handleSave}
          onClose={close}
          isAccepting={!!accepting}
          showArchived={tasksCtx.showArchived}
          onArchive={handleArchive}
          onUnarchive={handleUnarchive}
          archiving={tasksCtx.archiving}
        />
      )}
    </TaskModalContext.Provider>
  );
}
