// A "space" is a workspace you navigate into — one per project.
// Spaces are stored in the `spaces` table (see supabase/spaces_and_users.sql);
// these defaults are the fallback used before the migration is run and the seed
// values for the four original projects.

export interface Space {
  id: string;
  name: string;
  color: string;
}

export const DEFAULT_SPACES: Space[] = [
  { id: 'crm', name: 'Roof Estimate CRM', color: '#3b82f6' },
  { id: 'app', name: 'RoofingLogic App', color: '#10b981' },
  { id: 'marketing', name: 'RoofingLogic Marketing', color: '#f59e0b' },
  { id: 'xactimate', name: 'RoofingLogic Xactimate', color: '#8b5cf6' },
];

export const FALLBACK_SPACE_COLOR = '#64748b';
export const defaultSpaceId = DEFAULT_SPACES[0].id;

// Preset swatches offered when creating a space.
export const SPACE_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ef4444',
  '#ec4899',
  '#14b8a6',
  '#64748b',
];

// Turn a space name into a stable url-safe slug used as its id.
export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'space'
  );
}
