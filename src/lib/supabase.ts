import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const key = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY as string | undefined;

/** Null als Supabase (nog) niet is ingesteld; de site valt dan terug op voorbeelddata. */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

if (!supabase) console.warn('[schoenmaatje] PUBLIC_SUPABASE_URL of PUBLIC_SUPABASE_PUBLISHABLE_KEY ontbreekt: voorbeelddata wordt gebruikt.');

export const PHOTO_BUCKET = 'listing-photos';

/** Publieke URL van een foto, in productie verkleind via Netlify Image CDN. */
export function photoUrl(path: string, width = 800): string {
  const original = `${url}/storage/v1/object/public/${PHOTO_BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`;
  if (import.meta.env.DEV) return original;
  return `/.netlify/images?url=${encodeURIComponent(original)}&w=${width}&fm=webp`;
}
