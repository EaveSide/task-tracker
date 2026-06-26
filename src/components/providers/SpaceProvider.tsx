'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { DevTask } from '@/lib/types';
import { getSpace, type Space } from '@/lib/spaces';
import { useTasks } from './TasksProvider';

interface SpaceFilters {
  sprint: string;
  priority: string;
  area: string;
  assignee: string;
}

interface SpaceStats {
  total: number;
  done: number;
  inProg: number;
  inReview: number;
  blocked: number;
  high: number;
  totalHours: number;
}

interface SpaceContextValue {
  spaceId: string;
  space: Space;
  search: string;
  setSearch: (v: string) => void;
  filters: SpaceFilters;
  setFilter: (key: keyof SpaceFilters, value: string) => void;
  sortField: string;
  sortAsc: boolean;
  handleSort: (field: string) => void;
  spaceTasks: DevTask[];
  filteredTasks: DevTask[];
  sortedTasks: DevTask[];
  stats: SpaceStats;
  areaOptions: string[];
  assigneeOptions: string[];
  sprintOptions: string[];
}

const SpaceContext = createContext<SpaceContextValue | null>(null);

export function useSpace(): SpaceContextValue {
  const ctx = useContext(SpaceContext);
  if (!ctx) throw new Error('useSpace must be used within a SpaceProvider');
  return ctx;
}

const DEFAULT_FILTERS: SpaceFilters = {
  sprint: 'all',
  priority: 'all',
  area: 'all',
  assignee: 'all',
};

export function SpaceProvider({
  spaceId,
  children,
}: {
  spaceId: string;
  children: ReactNode;
}) {
  const { tasks, sprints } = useTasks();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<SpaceFilters>(DEFAULT_FILTERS);
  const [sortField, setSortField] = useState('id');
  const [sortAsc, setSortAsc] = useState(true);

  const space = getSpace(spaceId) ?? { id: spaceId, name: spaceId, color: '#64748b' };

  const setFilter = useCallback(
    (key: keyof SpaceFilters, value: string) =>
      setFilters((f) => ({ ...f, [key]: value })),
    []
  );

  const handleSort = useCallback((field: string) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortAsc((a) => !a);
        return prev;
      }
      setSortAsc(true);
      return field;
    });
  }, []);

  const spaceTasks = useMemo(
    () => tasks.filter((t) => t.project === spaceId),
    [tasks, spaceId]
  );

  const filteredTasks = useMemo(() => {
    const q = search.toLowerCase();
    return spaceTasks.filter((t) => {
      if (filters.sprint !== 'all' && t.sprint !== filters.sprint) return false;
      if (filters.priority !== 'all' && t.priority !== filters.priority) return false;
      if (filters.area !== 'all' && t.area !== filters.area) return false;
      if (filters.assignee !== 'all' && t.assignee !== filters.assignee) return false;
      if (
        q &&
        !t.title.toLowerCase().includes(q) &&
        !t.id.toLowerCase().includes(q) &&
        !(t.description || '').toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [spaceTasks, filters, search]);

  const sortedTasks = useMemo(
    () =>
      [...filteredTasks].sort((a, b) => {
        const va = String((a as unknown as Record<string, unknown>)[sortField] ?? '');
        const vb = String((b as unknown as Record<string, unknown>)[sortField] ?? '');
        const cmp = va.toLowerCase().localeCompare(vb.toLowerCase());
        return sortAsc ? cmp : -cmp;
      }),
    [filteredTasks, sortField, sortAsc]
  );

  const stats = useMemo<SpaceStats>(
    () => ({
      total: filteredTasks.length,
      done: filteredTasks.filter((t) => t.status === 'done').length,
      inProg: filteredTasks.filter((t) => t.status === 'in-progress').length,
      inReview: filteredTasks.filter((t) => t.status === 'review').length,
      blocked: filteredTasks.filter((t) => t.status === 'blocked').length,
      high: filteredTasks.filter((t) => t.priority === 'high' && t.status !== 'done').length,
      totalHours: filteredTasks.reduce((s, t) => s + (t.est_hours || 0), 0),
    }),
    [filteredTasks]
  );

  const areaOptions = useMemo(
    () => ([...new Set(spaceTasks.map((t) => t.area).filter(Boolean))] as string[]).sort(),
    [spaceTasks]
  );

  const assigneeOptions = useMemo(
    () => ([...new Set(spaceTasks.map((t) => t.assignee).filter(Boolean))] as string[]).sort(),
    [spaceTasks]
  );

  const value: SpaceContextValue = {
    spaceId,
    space,
    search,
    setSearch,
    filters,
    setFilter,
    sortField,
    sortAsc,
    handleSort,
    spaceTasks,
    filteredTasks,
    sortedTasks,
    stats,
    areaOptions,
    assigneeOptions,
    sprintOptions: sprints,
  };

  return <SpaceContext.Provider value={value}>{children}</SpaceContext.Provider>;
}
