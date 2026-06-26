import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { getSpace } from '@/lib/spaces';
import SpaceShell from '@/components/shell/SpaceShell';

export default async function SpaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ space: string }>;
}) {
  const { space } = await params;
  if (!getSpace(space)) notFound();
  return <SpaceShell spaceId={space}>{children}</SpaceShell>;
}
