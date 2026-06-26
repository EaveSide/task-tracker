'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import type { DevTask } from '@/lib/types';
import * as tasksApi from '@/lib/api/tasks';

type ArchivedView = 'active' | 'archived';

interface TasksContextValue {
  tasks: DevTask[];
  setTasks: Dispatch<SetStateAction<DevTask[]>>;
  loading: boolean;
  syncStatus: string;
  showArchived: ArchivedView;
  setShowArchived: (v: ArchivedView) => void;
  sprints: string[];
  saving: boolean;
  archiving: boolean;
  /** POST a task, merge into state, flash "Saved". Returns null on failure (no alert). */
  persistTask: (task: DevTask) => Promise<DevTask | null>;
  /** Like persistTask but toggles `saving` and alerts on failure (used by the modal). */
  saveTask: (task: DevTask) => Promise<DevTask | null>;
  deleteTask: (id: string) => Promise<void>;
  archiveTasks: (ids: string[]) => Promise<void>;
  unarchiveTasks: (ids: string[]) => Promise<void>;
}

const TasksContext = createContext<TasksContextValue | null>(null);

export function useTasks(): TasksContextValue {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error('useTasks must be used within a TasksProvider');
  return ctx;
}

function sortSprints(values: (string | null)[]): string[] {
  return ([...new Set(values.filter(Boolean))] as string[]).sort((a, b) => {
    const na = parseInt(a.replace('Sprint ', ''), 10);
    const nb = parseInt(b.replace('Sprint ', ''), 10);
    return na - nb;
  });
}

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<DevTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('Loading...');
  const [showArchived, setShowArchived] = useState<ArchivedView>('active');
  const [allSprints, setAllSprints] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const flash = useCallback((label: string) => {
    setSyncStatus(label);
    setTimeout(() => setSyncStatus('Connected'), 2000);
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      const data = await tasksApi.fetchTasks(
        showArchived === 'archived' ? { archivedOnly: true } : {}
      );
      setTasks(data);
      setSyncStatus('Connected');
    } catch {
      setSyncStatus('Error');
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  // Sprint dropdown should include sprints from archived tasks too.
  const loadAllSprints = useCallback(async () => {
    try {
      const data = await tasksApi.fetchTasks({ includeArchived: true });
      setAllSprints(sortSprints(data.map((t) => t.sprint)));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadTasks();
    loadAllSprints();
    const interval = setInterval(loadTasks, 30000);
    return () => clearInterval(interval);
  }, [loadTasks, loadAllSprints]);

  const mergeTask = useCallback((saved: DevTask) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
  }, []);

  const persistTask = useCallback(
    async (task: DevTask): Promise<DevTask | null> => {
      try {
        const saved = await tasksApi.saveTask(task);
        mergeTask(saved);
        flash('Saved');
        return saved;
      } catch {
        return null;
      }
    },
    [mergeTask, flash]
  );

  const saveTask = useCallback(
    async (task: DevTask): Promise<DevTask | null> => {
      setSaving(true);
      try {
        const saved = await tasksApi.saveTask(task);
        mergeTask(saved);
        flash('Saved');
        return saved;
      } catch (err) {
        alert('Save failed: ' + (err instanceof Error ? err.message : 'unknown error'));
        return null;
      } finally {
        setSaving(false);
      }
    },
    [mergeTask, flash]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      if (!confirm('Delete this task?')) return;
      try {
        await tasksApi.deleteTask(id);
        setTasks((prev) => prev.filter((t) => t.id !== id));
        flash('Deleted');
      } catch {
        alert('Delete failed');
      }
    },
    [flash]
  );

  const archiveTasks = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      setArchiving(true);
      try {
        const count = await tasksApi.archiveTasks(ids);
        setTasks((prev) => prev.filter((t) => !ids.includes(t.id)));
        flash(`Archived ${count}`);
      } catch {
        alert('Archive failed');
      } finally {
        setArchiving(false);
      }
    },
    [flash]
  );

  const unarchiveTasks = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      setArchiving(true);
      try {
        const count = await tasksApi.unarchiveTasks(ids);
        setTasks((prev) => prev.filter((t) => !ids.includes(t.id)));
        flash(`Unarchived ${count}`);
      } catch {
        alert('Unarchive failed');
      } finally {
        setArchiving(false);
      }
    },
    [flash]
  );

  const sprints = useMemo(
    () => (allSprints.length > 0 ? allSprints : sortSprints(tasks.map((t) => t.sprint))),
    [allSprints, tasks]
  );

  const value: TasksContextValue = {
    tasks,
    setTasks,
    loading,
    syncStatus,
    showArchived,
    setShowArchived,
    sprints,
    saving,
    archiving,
    persistTask,
    saveTask,
    deleteTask,
    archiveTasks,
    unarchiveTasks,
  };

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}
