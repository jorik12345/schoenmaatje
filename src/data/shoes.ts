// Types en hulpfuncties voor schoenen, plus voorbeelddata. Zonder Supabase-configuratie draait de site op deze voorbeelddata.
export type Side = 'links' | 'rechts';
export type Fit = 'Dames' | 'Heren' | 'Unisex';
export type Condition = 'Als nieuw' | 'Goed' | 'Gedragen';

export type Status = 'actief' | 'gereserveerd' | 'verkocht' | 'geruild' | 'verwijderd';
export type Offer = 'verkoop' | 'gratis' | 'ruil';
export type SellerType = 'particulier' | 'handelaar';

export interface Shoe {
  id: string;
  brand: string;
  model: string;
  side: Side;
  size: number;
  fit: Fit;
  condition: Condition;
  color: ColorName;
  place: string;
  addedAt: string;
  offer: Offer;
  /** Vraagprijs in centen; alleen bij `offer === 'verkoop'`. */
  priceCents?: number | null;
  status?: Status;
  description?: string | null;
  ownerId?: string;
  ownerName?: string;
  sellerType?: SellerType;
  /** Publieke foto-URL's, op volgorde. Leeg: de kaart toont de getekende schoen. */
  photos?: string[];
}

export const COLORS = {
  Zwart: '#1E1E24',
  Wit: '#FFFFFF',
  Grijs: '#8C8F96',
  Beige: '#EDE8DC',
  Bruin: '#5A2E2A',
  Blauw: '#7DA2C9',
  Groen: '#2F5D3A',
  Rood: '#C23B2E',
  Oranje: '#E8836B',
  Roze: '#E9A6BE',
  Meerkleurig: '#B9A6E0',
} as const;

/** Achtergrond voor het kleurbolletje in de filters. */
export const swatchBackground = (name: ColorName) =>
  name === 'Meerkleurig' ? 'conic-gradient(#C23B2E, #E8836B, #C8E85A, #7DA2C9, #2B3FD6, #C23B2E)' : COLORS[name];
export type ColorName = keyof typeof COLORS;

/** Profiel van de demo-aanbieder (alleen zonder Supabase). */
export const demoProfile = { id: 'demo', displayName: 'Demo', place: 'Utrecht', sellerType: 'particulier' as SellerType, createdAt: '2026-09-01T12:00:00Z' };

export const shoes: Shoe[] = [
  { id: 'nike-air-max-90-43', brand: 'Nike', model: 'Air Max 90', side: 'links', size: 43, fit: 'Heren', condition: 'Als nieuw', color: 'Wit', place: 'Utrecht', addedAt: '2026-10-20T08:00:00Z', offer: 'verkoop', priceCents: 2500, ownerId: 'demo', ownerName: 'Demo', sellerType: 'particulier' },
  { id: 'adidas-samba-39', brand: 'Adidas', model: 'Samba OG', side: 'rechts', size: 39, fit: 'Dames', condition: 'Goed', color: 'Zwart', place: 'Groningen', addedAt: '2026-10-20T06:00:00Z', offer: 'verkoop', priceCents: 3000, ownerId: 'demo', ownerName: 'Demo', sellerType: 'particulier' },
  { id: 'asics-kayano-445', brand: 'Asics', model: 'Gel-Kayano 30', side: 'rechts', size: 44.5, fit: 'Heren', condition: 'Als nieuw', color: 'Blauw', place: 'Eindhoven', addedAt: '2026-10-19T15:00:00Z', offer: 'verkoop', priceCents: 4000, ownerId: 'demo', ownerName: 'Demo', sellerType: 'particulier' },
  { id: 'veja-v10-38', brand: 'Veja', model: 'V-10', side: 'links', size: 38, fit: 'Dames', condition: 'Goed', color: 'Beige', place: 'Amsterdam', addedAt: '2026-10-19T10:00:00Z', offer: 'ruil', ownerId: 'demo', ownerName: 'Demo', sellerType: 'particulier' },
  { id: 'nb-574-42', brand: 'New Balance', model: '574', side: 'links', size: 42, fit: 'Unisex', condition: 'Gedragen', color: 'Grijs', place: 'Rotterdam', addedAt: '2026-10-18T12:00:00Z', offer: 'gratis', ownerId: 'demo', ownerName: 'Demo', sellerType: 'particulier' },
  { id: 'hoka-clifton-41', brand: 'Hoka', model: 'Clifton 9', side: 'rechts', size: 41, fit: 'Dames', condition: 'Als nieuw', color: 'Oranje', place: 'Zwolle', addedAt: '2026-10-17T12:00:00Z', offer: 'verkoop', priceCents: 3500, ownerId: 'demo', ownerName: 'Demo', sellerType: 'particulier' },
  { id: 'dm-1460-40', brand: 'Dr. Martens', model: '1460', side: 'links', size: 40, fit: 'Unisex', condition: 'Goed', color: 'Bruin', place: 'Den Haag', addedAt: '2026-10-16T12:00:00Z', offer: 'verkoop', priceCents: 4500, ownerId: 'demo', ownerName: 'Demo', sellerType: 'particulier' },
  { id: 'converse-chuck-45', brand: 'Converse', model: 'Chuck 70', side: 'rechts', size: 45, fit: 'Heren', condition: 'Goed', color: 'Groen', place: 'Nijmegen', addedAt: '2026-10-15T12:00:00Z', offer: 'gratis', ownerId: 'demo', ownerName: 'Demo', sellerType: 'particulier' },
  { id: 'on-cloud-37', brand: 'On', model: 'Cloud 5', side: 'links', size: 37, fit: 'Dames', condition: 'Als nieuw', color: 'Grijs', place: 'Leiden', addedAt: '2026-10-13T12:00:00Z', offer: 'verkoop', priceCents: 3000, ownerId: 'demo', ownerName: 'Demo', sellerType: 'particulier' },
  { id: 'nike-pegasus-43', brand: 'Nike', model: 'Pegasus 41', side: 'rechts', size: 43, fit: 'Heren', condition: 'Goed', color: 'Zwart', place: 'Breda', addedAt: '2026-10-12T12:00:00Z', offer: 'ruil', ownerId: 'demo', ownerName: 'Demo', sellerType: 'particulier' },
  { id: 'adidas-gazelle-42', brand: 'Adidas', model: 'Gazelle', side: 'links', size: 42, fit: 'Unisex', condition: 'Als nieuw', color: 'Rood', place: 'Arnhem', addedAt: '2026-10-10T12:00:00Z', offer: 'verkoop', priceCents: 2000, ownerId: 'demo', ownerName: 'Demo', sellerType: 'particulier' },
  { id: 'nb-990-44', brand: 'New Balance', model: '990v6', side: 'links', size: 44, fit: 'Heren', condition: 'Goed', color: 'Grijs', place: 'Haarlem', addedAt: '2026-10-08T12:00:00Z', offer: 'verkoop', priceCents: 6000, ownerId: 'demo', ownerName: 'Demo', sellerType: 'particulier' },
];

export const formatSize = (n: number) => String(n).replace('.', ',');

const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2 });
const euroCents = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });
export const formatEuro = (cents: number) => (cents % 100 === 0 ? euro : euroCents).format(cents / 100);

export const OFFER_LABELS: Record<Offer, string> = { verkoop: 'Te koop', gratis: 'Gratis', ruil: 'Ruilen' };

/** Wat er groot bij een schoen staat: de prijs, "Gratis" of "Ruilen". */
export const priceLabel = (shoe: Pick<Shoe, 'offer' | 'priceCents'>) =>
  shoe.offer === 'verkoop' && shoe.priceCents ? formatEuro(shoe.priceCents) : shoe.offer === 'gratis' ? 'Gratis' : 'Ruilen';

export function relativeDate(iso: string, now = new Date()): string {
  const hours = Math.floor((now.getTime() - new Date(iso).getTime()) / 36e5);
  if (hours < 1) return 'zojuist';
  if (hours < 24) return `${hours} uur geleden`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'gisteren';
  if (days < 7) return `${days} dagen geleden`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? '1 week geleden' : `${weeks} weken geleden`;
}
