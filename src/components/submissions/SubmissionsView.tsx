'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  SUBMISSION_STATUSES,
  SUBMISSION_STATUS_LABELS,
  SUBMISSION_TYPES,
  SUBMISSION_TYPE_LABELS,
} from '@/lib/types';
import { useSubmissions } from '@/components/providers/SubmissionsProvider';
import { useTaskModal } from '@/components/providers/TaskModalProvider';
import { useUsers } from '@/components/providers/UsersProvider';
import SubmissionCard from './SubmissionCard';
import AddSubmissionModal from './AddSubmissionModal';

export default function SubmissionsView() {
  const { submissions, newSubmissionCount, actioningId, updateSubmission, reload } = useSubmissions();
  const { acceptSubmission, quickApprove } = useTaskModal();
  const { users } = useUsers();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // Type filter lives in the URL (?type=bug) so the sidebar can link straight
  // to a filtered view.
  const typeParam = searchParams.get('type');
  const typeFilter = (SUBMISSION_TYPES as readonly string[]).includes(typeParam || '')
    ? (typeParam as string)
    : 'all';

  function setTypeFilter(type: string) {
    router.replace(type === 'all' ? '/submissions' : `/submissions?type=${type}`);
  }

  // "All" hides resolved submissions (accepted + declined) — those are only
  // shown via their own filter chip.
  const statusFiltered = useMemo(
    () =>
      filter === 'all'
        ? submissions.filter((s) => s.status !== 'declined' && s.status !== 'accepted')
        : submissions.filter((s) => s.status === filter),
    [submissions, filter]
  );

  // Per-type counts within the current status selection, so the chip numbers
  // always match what clicking them shows.
  const typeCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of statusFiltered) {
      map[s.type] = (map[s.type] || 0) + 1;
    }
    return map;
  }, [statusFiltered]);

  const filtered = useMemo(
    () => (typeFilter === 'all' ? statusFiltered : statusFiltered.filter((s) => s.type === typeFilter)),
    [statusFiltered, typeFilter]
  );

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Submissions</h1>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M8 3v10M3 8h10" />
          </svg>
          New Submission
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        {['all', ...SUBMISSION_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === s ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {s === 'all' ? 'All' : SUBMISSION_STATUS_LABELS[s]}
            {s === 'new' && newSubmissionCount > 0 && (
              <span className="ml-1 bg-blue-600 text-white px-1.5 py-0.5 rounded-full text-xs">
                {newSubmissionCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {['all', ...SUBMISSION_TYPES].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              typeFilter === t ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {t === 'all' ? 'All Types' : SUBMISSION_TYPE_LABELS[t]}
            {t !== 'all' && (
              <span className="ml-1.5 text-gray-500">{typeCounts[t] || 0}</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-12 text-center text-gray-500">
          No submissions found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((sub) => (
            <SubmissionCard
              key={sub.id}
              sub={sub}
              users={users}
              expanded={expandedId === sub.id}
              actioning={actioningId === sub.id}
              onToggle={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
              onAccept={acceptSubmission}
              onQuickApprove={quickApprove}
              onUpdate={updateSubmission}
            />
          ))}
        </div>
      )}

      {addOpen && (
        <AddSubmissionModal onClose={() => setAddOpen(false)} onSuccess={reload} />
      )}
    </div>
  );
}
