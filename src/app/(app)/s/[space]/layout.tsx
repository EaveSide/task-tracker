import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { getSpaceServer } from '@/lib/spaces-server';
import SpaceShell from '@/components/shell/SpaceShell';

export default async function SpaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ space: string }>;
}) {
  const { space } = await params;
  if (!(await getSpaceServer(space))) notFound();
  return <SpaceShell spaceId={space}>{children}</SpaceShell>;
}
