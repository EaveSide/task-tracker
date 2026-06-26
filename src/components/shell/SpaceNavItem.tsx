'use client';

import Link from 'next/link';
import type { Space } from '@/lib/spaces';

interface SpaceNavItemProps {
  space: Space;
  count: number;
  active: boolean;
  collapsed?: boolean;
  onDelete?: (space: Space) => void;
}

export default function SpaceNavItem({ space, count, active, collapsed, onDelete }: SpaceNavItemProps) {
  return (
    <div className="group relative">
      <Link
        href={`/s/${space.id}/board`}
        title={collapsed ? space.name : undefined}
        className={`flex items-center gap-2.5 rounded-lg py-1.5 text-sm transition-colors ${
          collapsed ? 'justify-center px-0' : 'px-2.5'
        } ${
          active ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
        }`}
      >
        <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: space.color }} />
        {!collapsed && <span className="min-w-0 flex-1 truncate">{space.name}</span>}
        {!collapsed && count > 0 && (
          <span className={`shrink-0 text-xs text-gray-500 ${onDelete ? 'group-hover:hidden' : ''}`}>
            {count}
          </span>
        )}
      </Link>
      {!collapsed && onDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(space);
          }}
          className="absolute right-1.5 top-1/2 hidden -translate-y-1/2 rounded px-1 text-xs text-gray-500 hover:text-red-400 group-hover:block"
          title={`Delete ${space.name}`}
          aria-label={`Delete ${space.name}`}
        >
          ✕
        </button>
      )}
    </div>
  );
}
