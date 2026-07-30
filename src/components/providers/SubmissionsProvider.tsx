'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { FeatureSubmission } from '@/lib/types';
import * as subsApi from '@/lib/api/submissions';

interface SubmissionsContextValue {
  submissions: FeatureSubmission[];
  newSubmissionCount: number;
  /** Unresolved (new + reviewed) submission count per type. */
  typeCounts: Record<string, number>;
  actioningId: string | null;
  /** Resolves to null on success, or a user-facing message when it failed. */
  updateSubmission: (id: string, updates: Record<string, unknown>) => Promise<string | null>;
  reload: () => Promise<void>;
}

const SubmissionsContext = createContext<SubmissionsContextValue | null>(null);

export function useSubmissions(): SubmissionsContextValue {
  const ctx = useContext(SubmissionsContext);
  if (!ctx) throw new Error('useSubmissions must be used within a SubmissionsProvider');
  return ctx;
}

export function SubmissionsProvider({ children }: { children: ReactNode }) {
  const [submissions, setSubmissions] = useState<FeatureSubmission[]>([]);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const data = await subsApi.fetchSubmissions();
      setSubmissions(data);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    // Initial load + 30s polling. reload() sets state only after an awaited
    // fetch resolves, so this is not a synchronous cascading render.
    reload();
    const interval = setInterval(reload, 30000);
    return () => clearInterval(interval);
  }, [reload]);

  const newSubmissionCount = useMemo(
    () => submissions.filter((s) => s.status === 'new').length,
    [submissions]
  );

  const typeCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of submissions) {
      if (s.status !== 'new' && s.status !== 'reviewed') continue;
      map[s.type] = (map[s.type] || 0) + 1;
    }
    return map;
  }, [submissions]);

  const updateSubmission = useCallback(
    async (id: string, updates: Record<string, unknown>): Promise<string | null> => {
      setActioningId(id);
      try {
        await subsApi.updateSubmission(id, updates);
        await reload();
        return null;
      } catch (err) {
        // Returned rather than thrown: several callers are fire-and-forget
        // click handlers, and an unhandled rejection would be worse than a
        // message the caller can choose to render.
        return err instanceof Error ? err.message : 'Update failed';
      } finally {
        setActioningId(null);
      }
    },
    [reload]
  );

  const value: SubmissionsContextValue = {
    submissions,
    newSubmissionCount,
    typeCounts,
    actioningId,
    updateSubmission,
    reload,
  };

  return <SubmissionsContext.Provider value={value}>{children}</SubmissionsContext.Provider>;
}
