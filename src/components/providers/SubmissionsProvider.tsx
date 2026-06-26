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
  actioningId: string | null;
  updateSubmission: (id: string, updates: Record<string, unknown>) => Promise<void>;
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
    const interval = setInterval(reload, 30000);
    return () => clearInterval(interval);
  }, [reload]);

  const newSubmissionCount = useMemo(
    () => submissions.filter((s) => s.status === 'new').length,
    [submissions]
  );

  const updateSubmission = useCallback(
    async (id: string, updates: Record<string, unknown>) => {
      setActioningId(id);
      try {
        await subsApi.updateSubmission(id, updates);
        await reload();
      } catch {
        /* ignore */
      }
      setActioningId(null);
    },
    [reload]
  );

  const value: SubmissionsContextValue = {
    submissions,
    newSubmissionCount,
    actioningId,
    updateSubmission,
    reload,
  };

  return <SubmissionsContext.Provider value={value}>{children}</SubmissionsContext.Provider>;
}
