'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface CurrentUser {
  id: string;
  name: string;
  email: string | null;
}

interface CurrentUserContextValue {
  /** The logged-in user; null while loading or if the session is invalid. */
  currentUser: CurrentUser | null;
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function useCurrentUser(): CurrentUserContextValue {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) throw new Error('useCurrentUser must be used within a CurrentUserProvider');
  return ctx;
}

// Resolves the logged-in user from the session cookie via /api/me. A 401
// (stale cookie, user removed from the roster) bounces back to the login
// page — middleware alone can't catch that, since it never hits the DB.
export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/me')
      .then(async (res) => {
        if (res.status === 401) {
          window.location.assign('/login');
          return;
        }
        if (!res.ok) return;
        const user = await res.json();
        if (!cancelled) setCurrentUser(user);
      })
      .catch(() => {
        /* transient network error — leave currentUser null */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CurrentUserContext.Provider value={{ currentUser }}>{children}</CurrentUserContext.Provider>
  );
}
