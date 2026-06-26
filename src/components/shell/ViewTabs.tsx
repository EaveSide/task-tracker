'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSpace } from '@/components/providers/SpaceProvider';

export default function ViewTabs() {
  const { spaceId } = useSpace();
  const pathname = usePathname();

  const tabs = [
    { key: 'board', label: 'Board', href: `/s/${spaceId}/board` },
    { key: 'backlog', label: 'Backlog', href: `/s/${spaceId}/backlog` },
  ];

  return (
    <div className="flex gap-1 mb-4">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={`px-3 py-1 rounded text-sm ${
              active ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
