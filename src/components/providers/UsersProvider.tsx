'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { AppUser } from '@/lib/types';
import * as usersApi from '@/lib/api/users';

interface UsersContextValue {
  users: AppUser[];
  addUser: (name: string, email?: string) => Promise<AppUser | null>;
  updateUser: (id: string, updates: { name?: string; email?: string | null }) => Promise<boolean>;
  removeUser: (id: string) => Promise<boolean>;
}

const UsersContext = createContext<UsersContextValue | null>(null);

export function useUsers(): UsersContextValue {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error('useUsers must be used within a UsersProvider');
  return ctx;
}

// Seeded from the server (getUsersServer); add/remove persist via the API.
export function UsersProvider({
  initialUsers,
  children,
}: {
  initialUsers: AppUser[];
  children: ReactNode;
}) {
  const [users, setUsers] = useState<AppUser[]>(initialUsers);

  const addUser = useCallback(async (name: string, email?: string): Promise<AppUser | null> => {
    try {
      const created = await usersApi.createUser(name, email);
      setUsers((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
      );
      return created;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add user');
      return null;
    }
  }, []);

  const updateUser = useCallback(
    async (id: string, updates: { name?: string; email?: string | null }): Promise<boolean> => {
      try {
        const saved = await usersApi.updateUser(id, updates);
        setUsers((prev) =>
          prev
            .map((u) => (u.id === id ? saved : u))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        return true;
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to update user');
        return false;
      }
    },
    []
  );

  const removeUser = useCallback(async (id: string): Promise<boolean> => {
    try {
      await usersApi.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      return true;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove user');
      return false;
    }
  }, []);

  return (
    <UsersContext.Provider value={{ users, addUser, updateUser, removeUser }}>
      {children}
    </UsersContext.Provider>
  );
}
