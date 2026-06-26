'use client';

import type { FeatureSubmission } from '@/lib/types';
import { SUBMISSION_TYPE_LABELS, SUBMISSION_STATUS_LABELS } from '@/lib/types';

interface SubmissionCardProps {
  sub: FeatureSubmission;
  expanded: boolean;
  actioning: boolean;
  onToggle: () => void;
  onAccept: (sub: FeatureSubmission) => void;
  onUpdate: (id: string, updates: Record<string, unknown>) => void;
}

export default function SubmissionCard({
  sub,
  expanded,
  actioning,
  onToggle,
  onAccept,
  onUpdate,
}: SubmissionCardProps) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 transition-colors hover:border-gray-700">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            sub.type === 'bug' ? 'type-bug' : sub.type === 'feature' ? 'type-feature' : 'type-enhancement'
          }`}
        >
          {SUBMISSION_TYPE_LABELS[sub.type]}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{sub.title}</span>
        {sub.submitted_by_name && (
          <span className="hidden shrink-0 text-xs text-gray-500 sm:inline">
            {sub.submitted_by_name}
          </span>
        )}
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            sub.status === 'new'
              ? 'bg-blue-500/20 text-blue-400'
              : sub.status === 'reviewed'
                ? 'bg-amber-500/20 text-amber-400'
                : sub.status === 'accepted'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-zinc-500/20 text-zinc-400'
          }`}
        >
          {SUBMISSION_STATUS_LABELS[sub.status]}
        </span>
        <span className="shrink-0 text-xs text-gray-600">
          {new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className={`shrink-0 text-gray-600 transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-gray-800 px-4 py-4 space-y-4">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
              Description
            </p>
            <p className="whitespace-pre-wrap text-sm text-gray-300">{sub.description}</p>
          </div>

          {(sub.submitted_by_name || sub.submitted_by_email || sub.submitted_by_phone) && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                Contact
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                {sub.submitted_by_name && <span>{sub.submitted_by_name}</span>}
                {sub.submitted_by_email && (
                  <a
                    href={`mailto:${sub.submitted_by_email}`}
                    className="text-blue-400 hover:underline"
                  >
                    {sub.submitted_by_email}
                  </a>
                )}
                {sub.submitted_by_phone && <span>{sub.submitted_by_phone}</span>}
              </div>
            </div>
          )}

          {sub.image_urls && sub.image_urls.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                Screenshots
              </p>
              <div className="flex gap-2">
                {sub.image_urls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Attachment ${i + 1}`}
                      className="h-24 w-24 rounded-lg border border-gray-700 object-cover hover:border-blue-500 transition-colors"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {sub.linked_task_id && (
            <div className="text-xs text-gray-500">
              Linked to task: <span className="text-blue-400">{sub.linked_task_id}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {sub.status === 'new' && (
              <>
                <button
                  onClick={() => onUpdate(sub.id, { status: 'reviewed' })}
                  disabled={actioning}
                  className="rounded-lg bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-medium text-white transition-colors disabled:opacity-50"
                >
                  {actioning ? 'Updating...' : 'Mark Reviewed'}
                </button>
                <button
                  onClick={() => onAccept(sub)}
                  disabled={actioning}
                  className="rounded-lg bg-green-600 hover:bg-green-700 px-4 py-2 text-xs font-medium text-white transition-colors disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  onClick={() => onUpdate(sub.id, { status: 'declined' })}
                  disabled={actioning}
                  className="rounded-lg bg-zinc-600 hover:bg-zinc-700 px-4 py-2 text-xs font-medium text-white transition-colors disabled:opacity-50"
                >
                  Decline
                </button>
              </>
            )}
            {sub.status === 'reviewed' && (
              <>
                <button
                  onClick={() => onAccept(sub)}
                  disabled={actioning}
                  className="rounded-lg bg-green-600 hover:bg-green-700 px-4 py-2 text-xs font-medium text-white transition-colors disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  onClick={() => onUpdate(sub.id, { status: 'declined' })}
                  disabled={actioning}
                  className="rounded-lg bg-zinc-600 hover:bg-zinc-700 px-4 py-2 text-xs font-medium text-white transition-colors disabled:opacity-50"
                >
                  Decline
                </button>
              </>
            )}
            {sub.status === 'declined' && (
              <button
                onClick={() => onUpdate(sub.id, { status: 'new' })}
                disabled={actioning}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-medium text-white transition-colors disabled:opacity-50"
              >
                Reopen
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
