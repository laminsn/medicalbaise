import { supabase } from '@/integrations/supabase/client';

/**
 * Public directory reads. The private `providers` / `profiles` tables are
 * owner/admin-only; public listings must go through the sanitized views
 * `providers_public` and `profiles_public` (no passport, CPF, contact,
 * face data or credentials).
 */
export interface PublicProfileName {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

// The views are newer than the generated types; keep the cast local.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function fromProvidersPublic() {
  return db.from('providers_public');
}

/** Map of user_id -> public name/avatar (signed-in viewers only; anon gets none). */
export async function fetchPublicProfileNames(userIds: Array<string | null | undefined>): Promise<Record<string, PublicProfileName>> {
  const ids = [...new Set(userIds.filter((id): id is string => Boolean(id)))];
  if (ids.length === 0) return {};
  const { data, error } = await db
    .from('profiles_public')
    .select('user_id, first_name, last_name, avatar_url')
    .in('user_id', ids);
  if (error || !data) return {};
  const map: Record<string, PublicProfileName> = {};
  for (const row of data as PublicProfileName[]) map[row.user_id] = row;
  return map;
}

/** Attach `profiles` (same shape the old `profiles!inner(...)` embed returned). */
export async function withPublicProfiles<T extends { user_id?: string | null }>(rows: T[]): Promise<Array<T & { profiles: PublicProfileName | null }>> {
  const names = await fetchPublicProfileNames(rows.map((r) => r.user_id));
  return rows.map((r) => ({ ...r, profiles: (r.user_id && names[r.user_id]) || null }));
}
