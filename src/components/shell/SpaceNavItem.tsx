'use client';

import Link from 'next/link';
import type { Space } from '@/lib/spaces';

interface SpaceNavItemProps {
  space: Space;
  count: number;
  active: boolean;
}

export default function SpaceNavItem({ space, count, active }: SpaceNavItemProps) {
  return (
    <Link
      href={`/s/${space.id}/board`}
      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
        active ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
      }`}
    >
      <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: space.color }} />
      <span className="min-w-0 flex-1 truncate">{space.name}</span>
      {count > 0 && <span className="shrink-0 text-xs text-gray-500">{count}</span>}
    </Link>
  );
}
