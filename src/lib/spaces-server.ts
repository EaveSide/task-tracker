import { getSupabaseAdmin } from './supabase-server';
import { DEFAULT_SPACES, type Space } from './spaces';

// Server-side space lookups. Falls back to the built-in defaults if the
// `spaces` table doesn't exist yet (migration not run) or returns nothing.

export async function getSpacesServer(): Promise<Space[]> {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('spaces')
      .select('id,name,color')
      .order('sort_order', { ascending: true });
    if (error || !data || data.length === 0) return DEFAULT_SPACES;
    return data as Space[];
  } catch {
    return DEFAULT_SPACES;
  }
}

export async function getSpaceServer(id: string): Promise<Space | undefined> {
  const spaces = await getSpacesServer();
  return spaces.find((s) => s.id === id);
}
