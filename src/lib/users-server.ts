import { getSupabaseAdmin } from './supabase-server';
import type { AppUser } from './types';

// Fallback roster used before the `users` table exists (migration not run).
const DEFAULT_USERS: AppUser[] = [
  { id: 'george', name: 'George' },
  { id: 'will', name: 'Will' },
];

export async function getUsersServer(): Promise<AppUser[]> {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('users')
      .select('id, name, email, password_hash')
      .order('name', { ascending: true });
    if (error) return DEFAULT_USERS;
    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      has_account: Boolean(row.password_hash),
    }));
  } catch {
    return DEFAULT_USERS;
  }
}
