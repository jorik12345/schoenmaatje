// Acties namens de ingelogde gebruiker. Altijd met de sessie-client (locals.supabase), zodat RLS geldt.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Shoe, Status } from '../data/shoes';
import type { ListingInput } from './listing-form';
import { PHOTO_BUCKET, photoUrl } from './supabase';

export interface Profile { display_name: string; place: string | null }
export interface OwnPhoto { id: string; path: string; url: string }
export type OwnListing = Shoe & { status: Status; photoRows: OwnPhoto[] };

function fail(what: string, error: { message: string }): never {
  throw new Error(`[schoenmaatje] ${what} mislukt: ${error.message}`);
}

export async function getProfile(sb: SupabaseClient, userId: string): Promise<Profile | null> {
  const { data, error } = await sb.from('profiles').select('display_name, place').eq('id', userId).maybeSingle();
  if (error) fail('Profiel ophalen', error);
  return data;
}

export async function updateProfile(sb: SupabaseClient, userId: string, profile: Profile): Promise<void> {
  const { error } = await sb.from('profiles').update(profile).eq('id', userId);
  if (error) fail('Profiel opslaan', error);
}

const OWN_COLUMNS = 'id, side, brand, model, size, fit, color, condition, place, description, status, created_at, listing_photos(id, path, position)';

interface OwnRow {
  id: string; side: Shoe['side']; brand: string; model: string; size: number | string; fit: Shoe['fit'];
  color: Shoe['color']; condition: Shoe['condition']; place: string; description: string | null; status: Status;
  created_at: string; listing_photos: { id: string; path: string; position: number }[];
}

function toOwn(r: OwnRow): OwnListing {
  const photoRows = [...r.listing_photos].sort((a, b) => a.position - b.position).map((p) => ({ id: p.id, path: p.path, url: photoUrl(p.path, 640) }));
  return {
    id: r.id, side: r.side, brand: r.brand, model: r.model, size: Number(r.size), fit: r.fit, color: r.color,
    condition: r.condition, place: r.place, description: r.description, status: r.status, addedAt: r.created_at,
    photos: photoRows.map((p) => p.url), photoRows,
  };
}

export async function getOwnListings(sb: SupabaseClient, userId: string): Promise<OwnListing[]> {
  const { data, error } = await sb.from('listings').select(OWN_COLUMNS).eq('owner_id', userId)
    .neq('status', 'verwijderd').order('created_at', { ascending: false });
  if (error) fail('Eigen advertenties ophalen', error);
  return (data as unknown as OwnRow[]).map(toOwn);
}

export async function getOwnListing(sb: SupabaseClient, userId: string, id: string): Promise<OwnListing | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await sb.from('listings').select(OWN_COLUMNS).eq('id', id).eq('owner_id', userId).maybeSingle();
  if (error) fail('Advertentie ophalen', error);
  return data ? toOwn(data as unknown as OwnRow) : null;
}

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** Uploadt foto's naar <userId>/<listingId>/… en koppelt ze aan de advertentie, achter de bestaande. */
async function addPhotos(sb: SupabaseClient, userId: string, listingId: string, files: File[], startPosition: number) {
  const uploaded: string[] = [];
  try {
    for (const [i, file] of files.entries()) {
      const path = `${userId}/${listingId}/${crypto.randomUUID()}.${EXT[file.type] ?? 'jpg'}`;
      const { error } = await sb.storage.from(PHOTO_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
      if (error) fail('Foto uploaden', error);
      uploaded.push(path);
      const { error: rowError } = await sb.from('listing_photos').insert({ listing_id: listingId, path, position: startPosition + i });
      if (rowError) fail('Foto koppelen', rowError);
    }
  } catch (e) {
    if (uploaded.length) await sb.storage.from(PHOTO_BUCKET).remove(uploaded);
    throw e;
  }
}

export async function createListing(sb: SupabaseClient, userId: string, input: ListingInput, photos: File[]): Promise<string> {
  const { data, error } = await sb.from('listings').insert({ ...input, owner_id: userId }).select('id').single();
  if (error) fail('Advertentie plaatsen', error);
  try {
    await addPhotos(sb, userId, data.id, photos, 0);
  } catch (e) {
    // Liever geen advertentie dan een half geplaatste.
    await sb.from('listings').delete().eq('id', data.id);
    throw e;
  }
  return data.id;
}

export async function updateListing(
  sb: SupabaseClient, userId: string, listing: OwnListing, input: ListingInput, removePhotoIds: string[], newPhotos: File[],
): Promise<void> {
  const { error } = await sb.from('listings').update(input).eq('id', listing.id);
  if (error) fail('Advertentie opslaan', error);
  const remove = listing.photoRows.filter((p) => removePhotoIds.includes(p.id));
  if (remove.length) {
    const { error: rowError } = await sb.from('listing_photos').delete().in('id', remove.map((p) => p.id));
    if (rowError) fail("Foto's verwijderen", rowError);
    await sb.storage.from(PHOTO_BUCKET).remove(remove.map((p) => p.path));
  }
  // Nieuwe foto's achter de bestaande; gaten in de nummering zijn geen probleem, alleen de volgorde telt.
  await addPhotos(sb, userId, listing.id, newPhotos, listing.photoRows.length);
}

export async function setListingStatus(sb: SupabaseClient, id: string, status: Status): Promise<void> {
  const { error } = await sb.from('listings').update({ status }).eq('id', id);
  if (error) fail('Status wijzigen', error);
}

export async function deleteListing(sb: SupabaseClient, listing: OwnListing): Promise<void> {
  const { error } = await sb.from('listings').delete().eq('id', listing.id);
  if (error) fail('Advertentie verwijderen', error);
  if (listing.photoRows.length) await sb.storage.from(PHOTO_BUCKET).remove(listing.photoRows.map((p) => p.path));
}

/** Verwijdert alle foto's, daarna het account zelf (alles in de database gaat via cascade mee). */
export async function deleteAccount(sb: SupabaseClient, userId: string): Promise<void> {
  const own = await getOwnListings(sb, userId);
  const paths = own.flatMap((l) => l.photoRows.map((p) => p.path));
  if (paths.length) await sb.storage.from(PHOTO_BUCKET).remove(paths);
  const { error } = await sb.rpc('delete_own_account');
  if (error) fail('Account verwijderen', error);
  await sb.auth.signOut();
}
