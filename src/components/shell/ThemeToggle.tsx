'use client';

import { useEffect, useState } from 'react';

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="3.25" />
      <path d="M8 1v1.5M8 13.5V15M15 8h-1.5M2.5 8H1M12.95 3.05l-1.06 1.06M4.11 11.89l-1.06 1.06M12.95 12.95l-1.06-1.06M4.11 4.11L3.05 3.05" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M13.5 9.5A5.5 5.5 0 016.5 2.5a5.5 5.5 0 107 7z" />
    </svg>
  );
}

export default function ThemeToggle({ collapsed }: { collapsed?: boolean }) {
  // Initial value is corrected from the DOM on mount (the head script set the
  // class before paint), so the icon matches the active theme without a flash.
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Sync icon state with the class the head script set before paint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(document.documentElement.classList.contains('light') ? 'light' : 'dark');
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    const el = document.documentElement;
    el.classList.remove('dark', 'light');
    el.classList.add(next);
    try {
      sessionStorage.setItem('theme', next);
    } catch {
      /* ignore */
    }
    setTheme(next);
  }

  const label = theme === 'dark' ? 'Light mode' : 'Dark mode';

  return (
    <button
      onClick={toggle}
      title={label}
      aria-label={label}
      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-800/50 hover:text-white ${
        collapsed ? 'justify-center' : 'w-full'
      }`}
    >
      <span className="shrink-0 text-gray-500">{theme === 'dark' ? <SunIcon /> : <MoonIcon />}</span>
      {!collapsed && <span className="min-w-0 flex-1 truncate text-left">{label}</span>}
    </button>
  );
}
