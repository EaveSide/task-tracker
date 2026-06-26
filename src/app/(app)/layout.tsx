import type { ReactNode } from 'react';
import { TasksProvider } from '@/components/providers/TasksProvider';
import { SubmissionsProvider } from '@/components/providers/SubmissionsProvider';
import { TaskModalProvider } from '@/components/providers/TaskModalProvider';
import Sidebar from '@/components/shell/Sidebar';

// Shell for all authenticated pages: shared data providers + persistent sidebar.
// login/ and submit/ live outside this route group, so they stay chrome-free.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <TasksProvider>
      <SubmissionsProvider>
        <TaskModalProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="min-w-0 flex-1">{children}</main>
          </div>
        </TaskModalProvider>
      </SubmissionsProvider>
    </TasksProvider>
  );
}
