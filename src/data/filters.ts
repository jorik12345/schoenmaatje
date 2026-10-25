import { COLORS, OFFER_LABELS, formatEuro, formatSize, type ColorName, type Fit, type Offer, type Shoe, type Side } from './shoes';

// Filters leven in de URL (/aanbod?zijde=links&maat=43&merk=Nike), zodat ze zonder JavaScript werken en deelbaar zijn.
export interface Filters {
  zijde?: Side;
  pasvorm: Fit[];
  maat: number[];
  merk: string[];
  kleur: ColorName[];
  soort: Offer[];
  /** Maximale prijs in hele euro's; gratis en ruilen vallen er altijd onder. */
  maxprijs?: number;
  sorteer: Sort;
}

export type Sort = 'nieuw' | 'maat' | 'prijs';
export const SORTS: { value: Sort; label: string }[] = [
  { value: 'nieuw', label: 'Nieuwste' },
  { value: 'prijs', label: 'Prijs' },
  { value: 'maat', label: 'Maat' },
];
export const OFFERS: Offer[] = ['verkoop', 'gratis', 'ruil'];
export const MAX_PRICES = [10, 25, 50, 100];

export const FITS: Fit[] = ['Dames', 'Heren', 'Unisex'];
export const SIZES = Array.from({ length: 13 }, (_, i) => 36 + i);

export function parseFilters(params: URLSearchParams): Filters {
  const zijde = params.get('zijde');
  return {
    zijde: zijde === 'links' || zijde === 'rechts' ? zijde : undefined,
    pasvorm: params.getAll('pasvorm').filter((f): f is Fit => (FITS as string[]).includes(f)),
    maat: params.getAll('maat').map(Number).filter((n) => Number.isFinite(n)),
    merk: params.getAll('merk'),
    kleur: params.getAll('kleur').filter((k): k is ColorName => k in COLORS),
    soort: params.getAll('soort').filter((o): o is Offer => (OFFERS as string[]).includes(o)),
    maxprijs: MAX_PRICES.find((p) => p === Number(params.get('maxprijs'))),
    sorteer: SORTS.find((s) => s.value === params.get('sorteer'))?.value ?? 'nieuw',
  };
}

export function parsePage(params: URLSearchParams): number {
  const n = Number(params.get('pagina'));
  return Number.isInteger(n) && n > 1 && n <= 50 ? n : 1;
}

export function applyFilters(list: Shoe[], f: Filters): Shoe[] {
  return list
    .filter((s) => !f.zijde || s.side === f.zijde)
    .filter((s) => !f.pasvorm.length || f.pasvorm.includes(s.fit))
    // Een gekozen hele maat toont ook de halve maat erboven (43 → 43 en 43,5).
    .filter((s) => !f.maat.length || f.maat.includes(Math.floor(s.size)))
    .filter((s) => !f.merk.length || f.merk.includes(s.brand))
    .filter((s) => !f.kleur.length || f.kleur.includes(s.color))
    .filter((s) => !f.soort.length || f.soort.includes(s.offer))
    .filter((s) => !f.maxprijs || s.offer !== 'verkoop' || (s.priceCents ?? 0) <= f.maxprijs * 100)
    .sort((a, b) =>
      f.sorteer === 'maat' ? a.size - b.size
      : f.sorteer === 'prijs' ? sortPrice(a) - sortPrice(b)
      : b.addedAt.localeCompare(a.addedAt));
}

/** Voor sorteren op prijs: gratis en ruilen eerst (0), dan oplopend. */
export const sortPrice = (s: Pick<Shoe, 'offer' | 'priceCents'>) => (s.offer === 'verkoop' ? s.priceCents ?? 0 : 0);

function chipLabel(key: string, value: string): string {
  if (key === 'maat') return `Maat ${formatSize(Number(value))}`;
  if (key === 'zijde') return value === 'links' ? 'Links' : 'Rechts';
  if (key === 'soort') return OFFER_LABELS[value as Offer] ?? value;
  if (key === 'maxprijs') return `Tot ${formatEuro(Number(value) * 100)}`;
  return value;
}

/** Actieve filters als labels, elk met de URL waarin dat ene filter is weggehaald. */
export function activeChips(params: URLSearchParams): { key: string; label: string; href: string; side?: Side }[] {
  const chips: { key: string; label: string; href: string; side?: Side }[] = [];
  for (const [key, value] of params) {
    if (!['zijde', 'soort', 'maxprijs', 'pasvorm', 'maat', 'merk', 'kleur'].includes(key)) continue;
    const next = new URLSearchParams([...params].filter(([k, v]) => !(k === key && v === value) && k !== 'pagina'));
    const qs = next.toString();
    const label = chipLabel(key, value);
    chips.push({ key, label, href: `/aanbod${qs ? `?${qs}` : ''}`, side: key === 'zijde' ? (value as Side) : undefined });
  }
  return chips;
}
