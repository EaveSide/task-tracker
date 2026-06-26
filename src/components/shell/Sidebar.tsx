'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getSpaces } from '@/lib/spaces';
import { useTasks } from '@/components/providers/TasksProvider';
import { useSubmissions } from '@/components/providers/SubmissionsProvider';
import SpaceNavItem from './SpaceNavItem';
import GlobalNavItem from './GlobalNavItem';
import SidebarFooter from './SidebarFooter';

function InboxIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 9h3l1 2h4l1-2h3M2 9l2-5h8l2 5M2 9v3a1 1 0 001 1h10a1 1 0 001-1V9" />
    </svg>
  );
}

function QueueIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 4h10M3 8h10M3 12h6" />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { tasks } = useTasks();
  const { newSubmissionCount } = useSubmissions();
  const spaces = getSpaces();

  // Open (non-done) task count per space, from the shared task list.
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of tasks) {
      if (t.status === 'done') continue;
      map[t.project] = (map[t.project] || 0) + 1;
    }
    return map;
  }, [tasks]);

  const activeSpaceId = pathname.startsWith('/s/') ? pathname.split('/')[2] : null;

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col gap-4 border-r border-gray-800 bg-gray-950 p-3">
      <Link href="/" className="px-2.5 pt-1 text-sm font-bold">
        RoofingLogic
      </Link>

      <nav className="space-y-0.5">
        <p className="px-2.5 pb-1 text-xs font-medium uppercase tracking-wide text-gray-600">
          Spaces
        </p>
        {spaces.map((space) => (
          <SpaceNavItem
            key={space.id}
            space={space}
            count={counts[space.id] || 0}
            active={activeSpaceId === space.id}
          />
        ))}
      </nav>

      <nav className="space-y-0.5">
        <p className="px-2.5 pb-1 text-xs font-medium uppercase tracking-wide text-gray-600">
          Workspace
        </p>
        <GlobalNavItem
          href="/submissions"
          label="Submissions"
          icon={<InboxIcon />}
          active={pathname === '/submissions'}
          badge={newSubmissionCount}
        />
        <GlobalNavItem
          href="/queue"
          label="Queue"
          icon={<QueueIcon />}
          active={pathname === '/queue'}
        />
      </nav>

      <SidebarFooter />
    </aside>
  );
}
