import type { ReactNode } from 'react';
import { TasksProvider } from '@/components/providers/TasksProvider';
import { SubmissionsProvider } from '@/components/providers/SubmissionsProvider';
import { SpacesProvider } from '@/components/providers/SpacesProvider';
import { UsersProvider } from '@/components/providers/UsersProvider';
import { TaskModalProvider } from '@/components/providers/TaskModalProvider';
import Sidebar from '@/components/shell/Sidebar';
import { getSpacesServer } from '@/lib/spaces-server';
import { getUsersServer } from '@/lib/users-server';

// Shell for all authenticated pages: shared data providers + persistent sidebar.
// Spaces and the user roster are read on the server so there's no load flash.
// login/ and submit/ live outside this route group, so they stay chrome-free.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const [spaces, users] = await Promise.all([getSpacesServer(), getUsersServer()]);

  return (
    <TasksProvider>
      <SubmissionsProvider>
        <SpacesProvider initialSpaces={spaces}>
          <UsersProvider initialUsers={users}>
            <TaskModalProvider>
              <div className="flex min-h-screen">
                <Sidebar />
                <main className="min-w-0 flex-1">{children}</main>
              </div>
            </TaskModalProvider>
          </UsersProvider>
        </SpacesProvider>
      </SubmissionsProvider>
    </TasksProvider>
  );
}
