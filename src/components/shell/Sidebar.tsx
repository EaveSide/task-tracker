'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
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

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      {direction === 'left' ? <path d="M10 3L5 8l5 5" /> : <path d="M6 3l5 5-5 5" />}
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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (sessionStorage.getItem('sidebar-collapsed') === '1') setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      try {
        sessionStorage.setItem('sidebar-collapsed', next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }

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
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col gap-4 border-r border-gray-800 bg-gray-950 p-3 transition-[width] ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand + collapse toggle */}
      {collapsed ? (
        <div className="flex flex-col items-center gap-2 pt-1">
          <Link href="/" aria-label="Eaveside home">
            <Image src="/eaveside-logo.png" alt="Eaveside" width={26} height={26} className="rounded-md" />
          </Link>
          <button
            onClick={toggleCollapsed}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            className="rounded p-1 text-gray-500 hover:bg-gray-800/50 hover:text-white"
          >
            <ChevronIcon direction="right" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between pl-1.5 pr-1 pt-1">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/eaveside-logo.png" alt="Eaveside" width={24} height={24} className="rounded-md" />
            <span className="text-sm font-bold">Eaveside</span>
          </Link>
          <button
            onClick={toggleCollapsed}
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
            className="rounded p-1 text-gray-500 hover:bg-gray-800/50 hover:text-white"
          >
            <ChevronIcon direction="left" />
          </button>
        </div>
      )}

      {/* Spaces */}
      <nav className="space-y-0.5">
        <div className={`flex items-center pb-1 ${collapsed ? 'justify-center' : 'justify-between pr-1'}`}>
          {!collapsed && (
            <p className="px-2.5 text-xs font-medium uppercase tracking-wide text-gray-600">Spaces</p>
          )}
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
            collapsed={collapsed}
            onDelete={spaces.length > 1 ? handleDeleteSpace : undefined}
          />
        ))}
      </nav>

      {/* Workspace */}
      <nav className="space-y-0.5">
        {!collapsed && (
          <p className="px-2.5 pb-1 text-xs font-medium uppercase tracking-wide text-gray-600">
            Workspace
          </p>
        )}
        <GlobalNavItem
          href="/submissions"
          label="Submissions"
          icon={<InboxIcon />}
          active={pathname === '/submissions'}
          collapsed={collapsed}
          badge={newSubmissionCount}
        />
        <GlobalNavItem
          href="/queue"
          label="Queue"
          icon={<QueueIcon />}
          active={pathname === '/queue'}
          collapsed={collapsed}
        />
        <button
          onClick={() => setManageUsersOpen(true)}
          title="Team"
          className={`flex items-center gap-2.5 rounded-lg py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-800/50 hover:text-white ${
            collapsed ? 'w-full justify-center px-0' : 'w-full px-2.5'
          }`}
        >
          <span className="shrink-0 text-gray-500">
            <TeamIcon />
          </span>
          {!collapsed && <span className="min-w-0 flex-1 truncate text-left">Team</span>}
        </button>
      </nav>

      <SidebarFooter collapsed={collapsed} />

      {addSpaceOpen && <AddSpaceModal onClose={() => setAddSpaceOpen(false)} />}
      {manageUsersOpen && <ManageUsersModal onClose={() => setManageUsersOpen(false)} />}
    </aside>
  );
}
