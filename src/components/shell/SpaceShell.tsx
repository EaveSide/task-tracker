'use client';

import type { ReactNode } from 'react';
import { SpaceProvider } from '@/components/providers/SpaceProvider';
import TopBar from './TopBar';
import ViewTabs from './ViewTabs';
import FilterBar from '@/components/filters/FilterBar';
import StatsBar from '@/components/filters/StatsBar';

// Per-space chrome shared by the board and backlog routes.
export default function SpaceShell({
  spaceId,
  children,
}: {
  spaceId: string;
  children: ReactNode;
}) {
  return (
    <SpaceProvider spaceId={spaceId}>
      <div className="p-4 md:p-6">
        <TopBar />
        <ViewTabs />
        <FilterBar />
        <StatsBar />
        <div className="mt-1">{children}</div>
      </div>
    </SpaceProvider>
  );
}
