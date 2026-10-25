// Alle leesacties op advertenties. Met Supabase uit de database, anders uit de voorbeelddata.
import { demoProfile, shoes as demoShoes, type ColorName, type Fit, type Offer, type SellerType, type Shoe } from '../data/shoes';
import { applyFilters, type Filters } from '../data/filters';
import { photoUrl, supabase } from './supabase';

export const PAGE_SIZE = 24;

const CARD_COLUMNS = 'id, owner_id, side, brand, model, size, fit, color, condition, place, status, offer, price_cents, created_at, listing_photos(path, position)';

interface ListingRow {
  id: string;
  owner_id: string;
  offer: Offer;
  price_cents: number | null;
  side: Shoe['side'];
  brand: string;
  model: string;
  size: number | string;
  fit: Fit;
  color: ColorName;
  condition: Shoe['condition'];
  place: string;
  status: Shoe['status'];
  created_at: string;
  description?: string | null;
  listing_photos?: { path: string; position: number }[];
  profiles?: { display_name: string; seller_type: SellerType } | null;
}

function toShoe(row: ListingRow, photoWidth = 640): Shoe {
  return {
    id: row.id,
    side: row.side,
    brand: row.brand,
    model: row.model,
    size: Number(row.size),
    fit: row.fit,
    color: row.color,
    condition: row.condition,
    place: row.place,
    status: row.status,
    addedAt: row.created_at,
    offer: row.offer,
    priceCents: row.price_cents,
    description: row.description,
    ownerId: row.owner_id,
    ownerName: row.profiles?.display_name,
    sellerType: row.profiles?.seller_type,
    photos: [...(row.listing_photos ?? [])].sort((a, b) => a.position - b.position).map((p) => photoUrl(p.path, photoWidth)),
  };
}

function fail(what: string, error: { message: string }): never {
  throw new Error(`[schoenmaatje] ${what} mislukt: ${error.message}`);
}

/** Een gekozen hele maat toont ook de halve maat erboven (43 → 43 en 43,5). */
const expandSizes = (sizes: number[]) => sizes.flatMap((s) => [s, s + 0.5]);

export async function searchListings(filters: Filters, page = 1): Promise<{ shoes: Shoe[]; total: number }> {
  const limit = PAGE_SIZE * page;
  if (!supabase) {
    const all = applyFilters(demoShoes, filters);
    return { shoes: all.slice(0, limit), total: all.length };
  }
  let q = supabase.from('listings').select(CARD_COLUMNS, { count: 'exact' }).eq('status', 'actief');
  if (filters.zijde) q = q.eq('side', filters.zijde);
  if (filters.pasvorm.length) q = q.in('fit', filters.pasvorm);
  if (filters.maat.length) q = q.in('size', expandSizes(filters.maat));
  if (filters.merk.length) q = q.in('brand', filters.merk);
  if (filters.kleur.length) q = q.in('color', filters.kleur);
  if (filters.soort.length) q = q.in('offer', filters.soort);
  // Gratis en ruilen hebben geen prijs en vallen altijd binnen een maximumprijs.
  if (filters.maxprijs) q = q.or(`offer.neq.verkoop,price_cents.lte.${filters.maxprijs * 100}`);
  q = filters.sorteer === 'maat'
    ? q.order('size', { ascending: true }).order('created_at', { ascending: false })
    : filters.sorteer === 'prijs'
      ? q.order('price_cents', { ascending: true, nullsFirst: true }).order('created_at', { ascending: false })
      : q.order('created_at', { ascending: false });
  const { data, error, count } = await q.range(0, limit - 1);
  if (error) fail('Advertenties zoeken', error);
  return { shoes: (data as unknown as ListingRow[]).map((r) => toShoe(r)), total: count ?? 0 };
}

/** Gegevens voor de filters en de homepage: aantallen over alle actieve advertenties. */
export interface Facets {
  brands: [string, number][];
  fits: Record<string, number>;
  offers: Record<string, number>;
  total: number;
  sizeRange: [number, number] | null;
}

export async function getFacets(): Promise<Facets> {
  let rows: { brand: string; fit: string; offer: string; size: number | string }[];
  if (!supabase) {
    rows = demoShoes;
  } else {
    const { data, error } = await supabase.from('listings').select('brand, fit, offer, size').eq('status', 'actief');
    if (error) fail('Filtergegevens ophalen', error);
    rows = data;
  }
  const brandCount = new Map<string, number>();
  const fits: Record<string, number> = {};
  const offers: Record<string, number> = {};
  for (const r of rows) {
    brandCount.set(r.brand, (brandCount.get(r.brand) ?? 0) + 1);
    fits[r.fit] = (fits[r.fit] ?? 0) + 1;
    offers[r.offer] = (offers[r.offer] ?? 0) + 1;
  }
  const sizes = rows.map((r) => Number(r.size));
  return {
    brands: [...brandCount].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'nl')),
    fits,
    offers,
    total: rows.length,
    sizeRange: sizes.length ? [Math.min(...sizes), Math.max(...sizes)] : null,
  };
}

export async function getRecentListings(n: number): Promise<Shoe[]> {
  if (!supabase) return [...demoShoes].sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, n);
  const { data, error } = await supabase.from('listings').select(CARD_COLUMNS).eq('status', 'actief')
    .order('created_at', { ascending: false }).limit(n);
  if (error) fail('Recente advertenties ophalen', error);
  return (data as unknown as ListingRow[]).map((r) => toShoe(r));
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Eén advertentie met foto's en de naam van de aanbieder; null als hij niet (meer) zichtbaar is. */
export async function getListing(id: string): Promise<Shoe | null> {
  if (!supabase) return demoShoes.find((s) => s.id === id) ?? null;
  if (!UUID.test(id)) return null;
  const { data, error } = await supabase.from('listings')
    .select(`${CARD_COLUMNS}, description, profiles(display_name, seller_type)`)
    .eq('id', id).maybeSingle();
  if (error) fail('Advertentie ophalen', error);
  return data ? toShoe(data as unknown as ListingRow, 1200) : null;
}

/** Andere actieve advertenties met dezelfde zijde en (halve) maat. */
export async function getSimilarListings(shoe: Shoe, n: number): Promise<Shoe[]> {
  const base = Math.floor(shoe.size);
  if (!supabase) {
    return demoShoes.filter((s) => s.id !== shoe.id && s.side === shoe.side && Math.floor(s.size) === base).slice(0, n);
  }
  const { data, error } = await supabase.from('listings').select(CARD_COLUMNS).eq('status', 'actief')
    .eq('side', shoe.side).in('size', [base, base + 0.5]).neq('id', shoe.id)
    .order('created_at', { ascending: false }).limit(n);
  if (error) fail('Vergelijkbare advertenties ophalen', error);
  return (data as unknown as ListingRow[]).map((r) => toShoe(r));
}

/** Openbaar profiel van een aanbieder, met de actieve advertenties. */
export interface PublicProfile {
  id: string;
  displayName: string;
  place: string | null;
  sellerType: SellerType;
  createdAt: string;
  listings: Shoe[];
  /** Maten waarin iemand nu iets aanbiedt, per zijde. */
  offeredSizes: { side: Shoe['side']; size: number }[];
}

function offeredSizes(listings: Shoe[]) {
  const seen = new Map<string, { side: Shoe['side']; size: number }>();
  for (const l of listings) seen.set(`${l.side}-${l.size}`, { side: l.side, size: l.size });
  return [...seen.values()].sort((a, b) => a.size - b.size || a.side.localeCompare(b.side));
}

export async function getPublicProfile(id: string): Promise<PublicProfile | null> {
  if (!supabase) {
    if (id !== demoProfile.id) return null;
    const listings = [...demoShoes].sort((a, b) => b.addedAt.localeCompare(a.addedAt));
    return { ...demoProfile, listings, offeredSizes: offeredSizes(listings) };
  }
  if (!UUID.test(id)) return null;
  const [{ data: profile, error }, { data: rows, error: listError }] = await Promise.all([
    supabase.from('profiles').select('id, display_name, place, seller_type, created_at').eq('id', id).maybeSingle(),
    supabase.from('listings').select(CARD_COLUMNS).eq('owner_id', id).eq('status', 'actief').order('created_at', { ascending: false }).limit(60),
  ]);
  if (error) fail('Profiel ophalen', error);
  if (listError) fail('Advertenties van profiel ophalen', listError);
  if (!profile) return null;
  const listings = (rows as unknown as ListingRow[]).map((r) => toShoe(r));
  return {
    id: profile.id, displayName: profile.display_name, place: profile.place, sellerType: profile.seller_type,
    createdAt: profile.created_at, listings, offeredSizes: offeredSizes(listings),
  };
}

/** Andere actieve advertenties van dezelfde aanbieder. */
export async function getMoreFromOwner(shoe: Shoe, n: number): Promise<Shoe[]> {
  if (!shoe.ownerId) return [];
  if (!supabase) return demoShoes.filter((s) => s.id !== shoe.id && s.ownerId === shoe.ownerId).slice(0, n);
  const { data, error } = await supabase.from('listings').select(CARD_COLUMNS).eq('status', 'actief')
    .eq('owner_id', shoe.ownerId).neq('id', shoe.id).order('created_at', { ascending: false }).limit(n);
  if (error) fail('Meer van aanbieder ophalen', error);
  return (data as unknown as ListingRow[]).map((r) => toShoe(r));
}
