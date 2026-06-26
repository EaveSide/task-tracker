'use client';

import { useTasks } from '@/components/providers/TasksProvider';

export default function SidebarFooter() {
  const { syncStatus } = useTasks();

  async function logout() {
    await fetch('/api/login', { method: 'DELETE' });
    window.location.assign('/login');
  }

  return (
    <div className="mt-auto space-y-2 border-t border-gray-800 pt-3">
      <div className="flex items-center gap-2 px-2.5">
        <span
          className={`h-2 w-2 rounded-full ${
            syncStatus === 'Connected'
              ? 'bg-green-500'
              : syncStatus === 'Error'
                ? 'bg-red-500'
                : 'bg-yellow-500'
          }`}
        />
        <span className="text-xs text-gray-500">{syncStatus}</span>
      </div>
      <button
        onClick={logout}
        className="w-full rounded-lg px-2.5 py-1.5 text-left text-sm text-gray-400 transition-colors hover:bg-gray-800/50 hover:text-white"
      >
        Log out
      </button>
    </div>
  );
}
