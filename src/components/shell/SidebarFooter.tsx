'use client';

import { useTasks } from '@/components/providers/TasksProvider';
import { useCurrentUser } from '@/components/providers/CurrentUserProvider';
import ThemeToggle from './ThemeToggle';

export default function SidebarFooter({ collapsed }: { collapsed?: boolean }) {
  const { syncStatus } = useTasks();
  const { currentUser } = useCurrentUser();

  async function logout() {
    await fetch('/api/login', { method: 'DELETE' });
    window.location.assign('/login');
  }

  return (
    <div className="mt-auto space-y-1 border-t border-gray-800 pt-3">
      {currentUser && (
        <div
          className={`flex items-center gap-2 ${collapsed ? 'justify-center' : 'px-2.5'}`}
          title={`Signed in as ${currentUser.name}${currentUser.email ? ` (${currentUser.email})` : ''}`}
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600/30 text-[10px] font-semibold text-blue-300">
            {currentUser.name.charAt(0).toUpperCase()}
          </span>
          {!collapsed && (
            <span className="min-w-0 truncate text-xs text-gray-400">{currentUser.name}</span>
          )}
        </div>
      )}
      <div
        className={`flex items-center gap-2 ${collapsed ? 'justify-center' : 'px-2.5'}`}
        title={syncStatus}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            syncStatus === 'Connected'
              ? 'bg-green-500'
              : syncStatus === 'Error'
                ? 'bg-red-500'
                : 'bg-yellow-500'
          }`}
        />
        {!collapsed && <span className="text-xs text-gray-500">{syncStatus}</span>}
      </div>

      <ThemeToggle collapsed={collapsed} />

      <button
        onClick={logout}
        title="Log out"
        className={`flex items-center rounded-lg py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-800/50 hover:text-white ${
          collapsed ? 'w-full justify-center px-0' : 'w-full px-2.5 text-left'
        }`}
      >
        {collapsed ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M10.5 11l3-3-3-3M13.5 8H6" />
          </svg>
        ) : (
          'Log out'
        )}
      </button>
    </div>
  );
}
