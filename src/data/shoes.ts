// Voorbeelddata voor fase 1. In fase 2 komt dit uit Supabase (tabel `listings`).
export type Side = 'links' | 'rechts';
export type Fit = 'Dames' | 'Heren' | 'Unisex';
export type Condition = 'Als nieuw' | 'Goed' | 'Gedragen';

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
} as const;
export type ColorName = keyof typeof COLORS;

export const shoes: Shoe[] = [
  { id: 'nike-air-max-90-43', brand: 'Nike', model: 'Air Max 90', side: 'links', size: 43, fit: 'Heren', condition: 'Als nieuw', color: 'Wit', place: 'Utrecht', addedAt: '2026-10-20T08:00:00Z' },
  { id: 'adidas-samba-39', brand: 'Adidas', model: 'Samba OG', side: 'rechts', size: 39, fit: 'Dames', condition: 'Goed', color: 'Zwart', place: 'Groningen', addedAt: '2026-10-20T06:00:00Z' },
  { id: 'asics-kayano-445', brand: 'Asics', model: 'Gel-Kayano 30', side: 'rechts', size: 44.5, fit: 'Heren', condition: 'Als nieuw', color: 'Blauw', place: 'Eindhoven', addedAt: '2026-10-19T15:00:00Z' },
  { id: 'veja-v10-38', brand: 'Veja', model: 'V-10', side: 'links', size: 38, fit: 'Dames', condition: 'Goed', color: 'Beige', place: 'Amsterdam', addedAt: '2026-10-19T10:00:00Z' },
  { id: 'nb-574-42', brand: 'New Balance', model: '574', side: 'links', size: 42, fit: 'Unisex', condition: 'Gedragen', color: 'Grijs', place: 'Rotterdam', addedAt: '2026-10-18T12:00:00Z' },
  { id: 'hoka-clifton-41', brand: 'Hoka', model: 'Clifton 9', side: 'rechts', size: 41, fit: 'Dames', condition: 'Als nieuw', color: 'Oranje', place: 'Zwolle', addedAt: '2026-10-17T12:00:00Z' },
  { id: 'dm-1460-40', brand: 'Dr. Martens', model: '1460', side: 'links', size: 40, fit: 'Unisex', condition: 'Goed', color: 'Bruin', place: 'Den Haag', addedAt: '2026-10-16T12:00:00Z' },
  { id: 'converse-chuck-45', brand: 'Converse', model: 'Chuck 70', side: 'rechts', size: 45, fit: 'Heren', condition: 'Goed', color: 'Groen', place: 'Nijmegen', addedAt: '2026-10-15T12:00:00Z' },
  { id: 'on-cloud-37', brand: 'On', model: 'Cloud 5', side: 'links', size: 37, fit: 'Dames', condition: 'Als nieuw', color: 'Grijs', place: 'Leiden', addedAt: '2026-10-13T12:00:00Z' },
  { id: 'nike-pegasus-43', brand: 'Nike', model: 'Pegasus 41', side: 'rechts', size: 43, fit: 'Heren', condition: 'Goed', color: 'Zwart', place: 'Breda', addedAt: '2026-10-12T12:00:00Z' },
  { id: 'adidas-gazelle-42', brand: 'Adidas', model: 'Gazelle', side: 'links', size: 42, fit: 'Unisex', condition: 'Als nieuw', color: 'Rood', place: 'Arnhem', addedAt: '2026-10-10T12:00:00Z' },
  { id: 'nb-990-44', brand: 'New Balance', model: '990v6', side: 'links', size: 44, fit: 'Heren', condition: 'Goed', color: 'Grijs', place: 'Haarlem', addedAt: '2026-10-08T12:00:00Z' },
];

export const formatSize = (n: number) => String(n).replace('.', ',');

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
