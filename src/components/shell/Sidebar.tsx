'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { Space } from '@/lib/spaces';
import { useTasks } from '@/components/providers/TasksProvider';
import { useSubmissions } from '@/components/providers/SubmissionsProvider';
import { useSpaces } from '@/components/providers/SpacesProvider';
import SpaceNavItem from './SpaceNavItem';
import GlobalNavItem from './GlobalNavItem';
import SidebarFooter from './SidebarFooter';
import AddSpaceModal from './AddSpaceModal';
import ManageUsersModal from './ManageUsersModal';

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

function TeamIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="6" cy="6" r="2.5" />
      <path d="M2 13a4 4 0 018 0M11 4.5a2 2 0 010 4M11.5 13a4 4 0 00-1.5-3" />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { tasks } = useTasks();
  const { newSubmissionCount } = useSubmissions();
  const { spaces, removeSpace } = useSpaces();
  const [addSpaceOpen, setAddSpaceOpen] = useState(false);
  const [manageUsersOpen, setManageUsersOpen] = useState(false);

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

  async function handleDeleteSpace(space: Space) {
    if (
      !confirm(
        `Delete the "${space.name}" space? Its tasks are kept in the database but won't show in the sidebar.`
      )
    )
      return;
    const ok = await removeSpace(space.id);
    if (ok && activeSpaceId === space.id) {
      const next = spaces.find((s) => s.id !== space.id);
      router.push(next ? `/s/${next.id}/board` : '/');
    }
  }

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col gap-4 border-r border-gray-800 bg-gray-950 p-3">
      <Link href="/" className="px-2.5 pt-1 text-sm font-bold">
        RoofingLogic
      </Link>

      <nav className="space-y-0.5">
        <div className="flex items-center justify-between pb-1 pr-1">
          <p className="px-2.5 text-xs font-medium uppercase tracking-wide text-gray-600">Spaces</p>
          <button
            onClick={() => setAddSpaceOpen(true)}
            className="rounded px-1.5 text-sm text-gray-500 hover:text-white"
            title="Add a space"
            aria-label="Add a space"
          >
            +
          </button>
        </div>
        {spaces.map((space) => (
          <SpaceNavItem
            key={space.id}
            space={space}
            count={counts[space.id] || 0}
            active={activeSpaceId === space.id}
            onDelete={spaces.length > 1 ? handleDeleteSpace : undefined}
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
        <button
          onClick={() => setManageUsersOpen(true)}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-800/50 hover:text-white"
        >
          <span className="shrink-0 text-gray-500">
            <TeamIcon />
          </span>
          <span className="min-w-0 flex-1 truncate text-left">Team</span>
        </button>
      </nav>

      <SidebarFooter />

      {addSpaceOpen && <AddSpaceModal onClose={() => setAddSpaceOpen(false)} />}
      {manageUsersOpen && <ManageUsersModal onClose={() => setManageUsersOpen(false)} />}
    </aside>
  );
}
