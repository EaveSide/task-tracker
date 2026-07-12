'use client';

import { useEffect, useRef, useState } from 'react';

interface TicketRefProps {
  taskId: string;
  /** Space id, used to build the deep link (/s/<space>/board?task=<id>). */
  project: string;
}

export function taskDeepLink(project: string, taskId: string): string {
  return `${window.location.origin}/s/${encodeURIComponent(project)}/board?task=${encodeURIComponent(taskId)}`;
}

// Ticket id + copy actions shown in the task modal header. "Copy #" copies
// the bare id; "Copy link" copies a URL that opens this ticket directly.
export default function TicketRef({ taskId, project }: TicketRefProps) {
  const [copied, setCopied] = useState<'id' | 'link' | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function copy(kind: 'id' | 'link') {
    const text = kind === 'id' ? taskId : taskDeepLink(project, taskId);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard access denied (e.g. non-HTTPS); fall back to a prompt the
      // user can copy from manually.
      window.prompt('Copy:', text);
    }
  }

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="font-mono text-gray-500">#{taskId}</span>
      <button
        type="button"
        onClick={() => copy('id')}
        title="Copy ticket #"
        className="rounded px-1.5 py-0.5 text-gray-500 transition-colors hover:bg-gray-800 hover:text-white"
      >
        {copied === 'id' ? (
          <span className="text-green-400">Copied!</span>
        ) : (
          <span className="flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
              <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
              <path d="M10.5 5.5v-2A1.5 1.5 0 0 0 9 2H4a1.5 1.5 0 0 0-1.5 1.5v5A1.5 1.5 0 0 0 4 10h1.5" />
            </svg>
            Copy #
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={() => copy('link')}
        title="Copy a link that opens this ticket"
        className="rounded px-1.5 py-0.5 text-gray-500 transition-colors hover:bg-gray-800 hover:text-white"
      >
        {copied === 'link' ? (
          <span className="text-green-400">Copied!</span>
        ) : (
          <span className="flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6.5 9.5l3-3" />
              <path d="M7.5 4.5l1-1a2.5 2.5 0 0 1 3.5 3.5l-1 1" />
              <path d="M8.5 11.5l-1 1A2.5 2.5 0 0 1 4 9l1-1" />
            </svg>
            Copy link
          </span>
        )}
      </button>
    </div>
  );
}
