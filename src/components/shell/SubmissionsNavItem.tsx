'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { SUBMISSION_TYPES } from '@/lib/types';

const TYPE_NAV_LABELS: Record<string, string> = {
  bug: 'Bug Reports',
  feature: 'Feature Requests',
  improvement: 'Improvements',
};

interface SubmissionsNavItemProps {
  icon: ReactNode;
  active: boolean;
  collapsed?: boolean;
  badge?: number;
  /** Unresolved submission count per type (from SubmissionsProvider). */
  typeCounts: Record<string, number>;
}

// Sidebar "Submissions" entry with an expandable per-type breakdown. Each
// sub-item links to the submissions page pre-filtered to that type, with the
// unresolved count alongside.
export default function SubmissionsNavItem({
  icon,
  active,
  collapsed,
  badge,
  typeCounts,
}: SubmissionsNavItemProps) {
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (sessionStorage.getItem('submissions-nav-expanded') === '0') setExpanded(false);
    } catch {
      /* ignore */
    }
  }, []);

  function toggleExpanded() {
    setExpanded((e) => {
      const next = !e;
      try {
        sessionStorage.setItem('submissions-nav-expanded', next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  if (collapsed) {
    return (
      <Link
        href="/submissions"
        title="Submissions"
        className={`relative flex items-center justify-center rounded-lg py-1.5 text-sm transition-colors ${
          active ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
        }`}
      >
        <span className="shrink-0 text-gray-500">{icon}</span>
        {badge ? <span className="absolute right-1 top-0.5 h-2 w-2 rounded-full bg-blue-600" /> : null}
      </Link>
    );
  }

  return (
    <div>
      <div
        className={`flex items-center rounded-lg text-sm transition-colors ${
          active ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
        }`}
      >
        <Link href="/submissions" className="flex min-w-0 flex-1 items-center gap-2.5 py-1.5 pl-2.5">
          <span className="shrink-0 text-gray-500">{icon}</span>
          <span className="min-w-0 flex-1 truncate">Submissions</span>
          {badge ? (
            <span className="shrink-0 rounded-full bg-blue-600 px-1.5 py-0.5 text-xs text-white">
              {badge}
            </span>
          ) : null}
        </Link>
        <button
          onClick={toggleExpanded}
          title={expanded ? 'Hide submission types' : 'Show submission types'}
          aria-label={expanded ? 'Hide submission types' : 'Show submission types'}
          className="shrink-0 rounded p-1.5 text-gray-600 hover:text-white"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="mt-0.5 space-y-0.5">
          {SUBMISSION_TYPES.map((t) => (
            <Link
              key={t}
              href={`/submissions?type=${t}`}
              className="flex items-center justify-between rounded-lg py-1 pl-9 pr-2.5 text-xs text-gray-500 transition-colors hover:bg-gray-800/50 hover:text-white"
            >
              <span className="min-w-0 flex-1 truncate">{TYPE_NAV_LABELS[t]}</span>
              <span className="shrink-0 text-gray-600">{typeCounts[t] || 0}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
