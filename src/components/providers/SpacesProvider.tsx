'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { Space } from '@/lib/spaces';
import * as spacesApi from '@/lib/api/spaces';

interface SpacesContextValue {
  spaces: Space[];
  getSpace: (id: string) => Space | undefined;
  addSpace: (name: string, color: string) => Promise<Space | null>;
  removeSpace: (id: string) => Promise<boolean>;
}

const SpacesContext = createContext<SpacesContextValue | null>(null);

export function useSpaces(): SpacesContextValue {
  const ctx = useContext(SpacesContext);
  if (!ctx) throw new Error('useSpaces must be used within a SpacesProvider');
  return ctx;
}

// Seeded from the server (getSpacesServer) so there's no initial fetch/flash.
// Adds/removes mutate local state and persist via the API.
export function SpacesProvider({
  initialSpaces,
  children,
}: {
  initialSpaces: Space[];
  children: ReactNode;
}) {
  const [spaces, setSpaces] = useState<Space[]>(initialSpaces);

  const getSpace = useCallback((id: string) => spaces.find((s) => s.id === id), [spaces]);

  const addSpace = useCallback(async (name: string, color: string): Promise<Space | null> => {
    try {
      const created = await spacesApi.createSpace(name, color);
      setSpaces((prev) => [...prev, created]);
      return created;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add space');
      return null;
    }
  }, []);

  const removeSpace = useCallback(async (id: string): Promise<boolean> => {
    try {
      await spacesApi.deleteSpace(id);
      setSpaces((prev) => prev.filter((s) => s.id !== id));
      return true;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete space');
      return false;
    }
  }, []);

  return (
    <SpacesContext.Provider value={{ spaces, getSpace, addSpace, removeSpace }}>
      {children}
    </SpacesContext.Provider>
  );
}
