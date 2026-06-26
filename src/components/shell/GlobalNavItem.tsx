'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

interface GlobalNavItemProps {
  href: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  badge?: number;
}

export default function GlobalNavItem({ href, label, icon, active, badge }: GlobalNavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
        active ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
      }`}
    >
      <span className="shrink-0 text-gray-500">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge ? (
        <span className="shrink-0 rounded-full bg-blue-600 px-1.5 py-0.5 text-xs text-white">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
