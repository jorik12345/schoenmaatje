import { COLORS, formatSize, type ColorName, type Fit, type Shoe, type Side } from './shoes';

// Filters leven in de URL (/aanbod?zijde=links&maat=43&merk=Nike), zodat ze zonder JavaScript werken en deelbaar zijn.
export interface Filters {
  zijde?: Side;
  pasvorm: Fit[];
  maat: number[];
  merk: string[];
  kleur: ColorName[];
  sorteer: 'nieuw' | 'maat';
}

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
    sorteer: params.get('sorteer') === 'maat' ? 'maat' : 'nieuw',
  };
}

export function applyFilters(list: Shoe[], f: Filters): Shoe[] {
  return list
    .filter((s) => !f.zijde || s.side === f.zijde)
    .filter((s) => !f.pasvorm.length || f.pasvorm.includes(s.fit))
    // Een gekozen hele maat toont ook de halve maat erboven (43 → 43 en 43,5).
    .filter((s) => !f.maat.length || f.maat.includes(Math.floor(s.size)))
    .filter((s) => !f.merk.length || f.merk.includes(s.brand))
    .filter((s) => !f.kleur.length || f.kleur.includes(s.color))
    .sort((a, b) => (f.sorteer === 'maat' ? a.size - b.size : b.addedAt.localeCompare(a.addedAt)));
}

/** Actieve filters als labels, elk met de URL waarin dat ene filter is weggehaald. */
export function activeChips(params: URLSearchParams): { key: string; label: string; href: string; side?: Side }[] {
  const chips: { key: string; label: string; href: string; side?: Side }[] = [];
  for (const [key, value] of params) {
    if (!['zijde', 'pasvorm', 'maat', 'merk', 'kleur'].includes(key)) continue;
    const next = new URLSearchParams([...params].filter(([k, v]) => !(k === key && v === value)));
    const qs = next.toString();
    const label = key === 'maat' ? `Maat ${formatSize(Number(value))}` : key === 'zijde' ? (value === 'links' ? 'Links' : 'Rechts') : value;
    chips.push({ key, label, href: `/aanbod${qs ? `?${qs}` : ''}`, side: key === 'zijde' ? (value as Side) : undefined });
  }
  return chips;
}
