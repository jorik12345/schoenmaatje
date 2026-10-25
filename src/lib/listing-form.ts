// Formulier "Schoen aanbieden" / "Advertentie bewerken": uitlezen en controleren.
import { COLORS, type ColorName, type Condition, type Fit, type Offer, type Side, type Status } from '../data/shoes';
import { FITS, OFFERS } from '../data/filters';

export const CONDITIONS: Condition[] = ['Als nieuw', 'Goed', 'Gedragen'];
export const STATUSES: { value: Status; label: string }[] = [
  { value: 'actief', label: 'Actief' },
  { value: 'gereserveerd', label: 'Gereserveerd' },
  { value: 'verkocht', label: 'Verkocht' },
  { value: 'geruild', label: 'Geruild' },
];
export const MAX_PRICE_EUROS = 1000;
/** Maten in het formulier: 30 t/m 50, met halve maten. */
export const FORM_SIZES = Array.from({ length: 41 }, (_, i) => 30 + i / 2);

export const MAX_PHOTOS = 5;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // gelijk aan de limiet van de storage-bucket
/** Netlify Functions accepteren tot ~6 MB per verzoek; de browser verkleint foto's vooraf. */
export const MAX_UPLOAD_BYTES = 5.5 * 1024 * 1024;
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface ListingInput {
  side: Side;
  brand: string;
  model: string;
  size: number;
  fit: Fit;
  color: ColorName;
  condition: Condition;
  place: string;
  description: string | null;
  offer: Offer;
  /** Alleen bij `offer === 'verkoop'`, anders null. */
  price_cents: number | null;
}

export type FieldErrors = Partial<Record<keyof ListingInput | 'photos', string>>;

/** "25", "25,50", "€ 25.5" → centen; null als het geen geldig bedrag is. */
export function parseEuros(input: string): number | null {
  const cleaned = input.replace(/[€\s]/g, '').replace(',', '.');
  if (!/^\d{1,4}(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}

/** Centen → wat er in het prijsveld staat ("25" of "25,50"). */
export const centsToInput = (cents: number | null | undefined) =>
  cents == null ? '' : cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2).replace('.', ',');

const text = (form: FormData, key: string) => String(form.get(key) ?? '').trim();

export function parseListingForm(form: FormData): { values: Partial<ListingInput>; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const side = text(form, 'side');
  const brand = text(form, 'brand');
  const model = text(form, 'model');
  const size = Number(text(form, 'size').replace(',', '.'));
  const fit = text(form, 'fit');
  const color = text(form, 'color');
  const condition = text(form, 'condition');
  const place = text(form, 'place');
  const description = text(form, 'description');
  const offer = text(form, 'offer');
  const priceText = text(form, 'price');
  const price = parseEuros(priceText);

  if (side !== 'links' && side !== 'rechts') errors.side = 'Kies of het een linker- of rechterschoen is.';
  if (!brand) errors.brand = 'Vul het merk in.';
  else if (brand.length > 60) errors.brand = 'Het merk mag maximaal 60 tekens zijn.';
  if (!model) errors.model = 'Vul het model in.';
  else if (model.length > 80) errors.model = 'Het model mag maximaal 80 tekens zijn.';
  if (!FORM_SIZES.includes(size)) errors.size = 'Kies een maat.';
  if (!(FITS as string[]).includes(fit)) errors.fit = 'Kies een pasvorm.';
  if (!(color in COLORS)) errors.color = 'Kies een kleur.';
  if (!(CONDITIONS as string[]).includes(condition)) errors.condition = 'Kies de staat van de schoen.';
  if (!place) errors.place = 'Vul je woonplaats in.';
  else if (place.length > 60) errors.place = 'De plaats mag maximaal 60 tekens zijn.';
  if (description.length > 1000) errors.description = 'De omschrijving mag maximaal 1000 tekens zijn.';
  if (!(OFFERS as string[]).includes(offer)) errors.offer = 'Kies of je de schoen verkoopt, weggeeft of wilt ruilen.';
  else if (offer === 'verkoop') {
    if (!priceText) errors.price_cents = 'Vul een vraagprijs in.';
    else if (price === null || price < 100) errors.price_cents = 'Vul een bedrag in euro\'s in, minstens € 1 (bijvoorbeeld 25 of 25,50).';
    else if (price > MAX_PRICE_EUROS * 100) errors.price_cents = `De vraagprijs mag maximaal € ${MAX_PRICE_EUROS} zijn.`;
  }

  return {
    values: {
      side: side as Side, brand, model, size: Number.isFinite(size) ? size : undefined,
      fit: fit as Fit, color: color as ColorName, condition: condition as Condition, place,
      description: description || null,
      offer: offer as Offer,
      // Bij gratis of ruilen wordt een ingevulde prijs genegeerd.
      price_cents: offer === 'verkoop' ? price : null,
    },
    errors,
  };
}

/** Nieuwe foto's uit het formulier, gecontroleerd. `existing` = aantal foto's dat blijft staan. */
export function parsePhotos(form: FormData, existing = 0): { files: File[]; error?: string } {
  const files = form.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0);
  if (existing + files.length > MAX_PHOTOS) return { files: [], error: `Je kunt maximaal ${MAX_PHOTOS} foto's toevoegen.` };
  if (files.some((f) => !PHOTO_TYPES.includes(f.type))) return { files: [], error: "Foto's moeten JPG, PNG of WebP zijn." };
  if (files.some((f) => f.size > MAX_PHOTO_BYTES)) return { files: [], error: 'Een foto mag maximaal 5 MB zijn.' };
  if (files.reduce((n, f) => n + f.size, 0) > MAX_UPLOAD_BYTES) {
    return { files: [], error: "Je foto's zijn samen te groot. Voeg er minder tegelijk toe, of gebruik kleinere foto's." };
  }
  return { files };
}

export function parseStatus(value: FormDataEntryValue | null): Status | null {
  return STATUSES.some((s) => s.value === value) ? (value as Status) : null;
}
