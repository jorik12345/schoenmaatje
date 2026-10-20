import type { AstroGlobal } from 'astro';

/**
 * Server-pagina's kort cachen op het Netlify CDN: bezoekers krijgen een kopie van maximaal een minuut oud,
 * terwijl op de achtergrond ververst wordt. Scheelt functie-aanroepen en databasequeries.
 */
export function cacheBriefly(Astro: AstroGlobal, seconds = 60) {
  Astro.response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  Astro.response.headers.set('Netlify-CDN-Cache-Control', `public, durable, s-maxage=${seconds}, stale-while-revalidate=600`);
}
