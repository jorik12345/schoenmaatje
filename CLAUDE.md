# Schoenmaatje

Ruilplatform (Nederlandstalig) voor mensen met één voet of één been om losse schoenen te ruilen.

## Stack
- **Astro 7** met `@astrojs/netlify`. Pagina's zijn statisch, behalve als ze `export const prerender = false` hebben (dan Netlify Function), zoals `/aanbod`.
- **Geen UI-framework.** Componenten zijn `.astro`-bestanden die de CSS-klassen uit `src/styles/components.css` gebruiken (prefix `sm-`). Kleine interactie in een `<script>` in het component.
- **Netlify Forms** voor `contact` en `interesse` (wachtlijst). Elk formulier heeft `data-netlify`, een hidden `form-name` en een honeypot `bot-field`. Formulieren moeten op een geprerenderde pagina staan, anders ziet Netlify ze niet.

## Design system
- Bron: het Schoenmaatje design system (claude.ai artifact). `src/styles/tokens.css` en `components.css` zijn daaruit overgenomen; pas tokens daar aan en gebruik altijd `var(--…)`, nooit losse hexwaarden (uitzondering: productkleuren in `src/data/shoes.ts`).
- `left` (kobalt) = links, `right` (limoen) = rechts. Altijd met het woord Links/Rechts erbij.
- Toon: direct en volwassen, geen verkleinwoorden of woordgrappen over beperking. Speelsheid zit in vorm en kleur.

## Conventies
- Routes en URL-parameters in het Nederlands (`zijde`, `maat`, `pasvorm`); TypeScript-types en -velden in het Engels zoals nu.
- Filters op `/aanbod` staan in de URL en moeten zonder JavaScript werken (`src/data/filters.ts`).
- Een gezondheidsgegeven (één voet/been) nooit opslaan of tonen op een profiel. Alleen de schoen die iemand zoekt of aanbiedt.

## Plan
1. **Fase 1 (klaar):** Astro + Netlify, design system, Home, Aanbod (voorbeelddata), Zo werkt het, Contact, wachtlijst via Netlify Forms.
2. **Fase 2:** Supabase (EU, Frankfurt): tabellen `profiles`, `listings`, `listing_photos`, `messages`, `saved_searches`, `reports` met Row Level Security. `/aanbod` leest uit `listings` in plaats van `src/data/shoes.ts`. Detailpagina per schoen.
3. **Fase 3:** Supabase Auth (magic link + wachtwoord, Cloudflare Turnstile), sessie via `@supabase/ssr` in Astro-middleware, "Schoen aanbieden" met foto-upload (Supabase Storage, Netlify Image CDN), accountpagina.
4. **Fase 4:** berichten per advertentie, matchmails (Resend of Brevo als SMTP), opgeslagen zoekopdrachten.
5. **Livegang:** privacyverklaring en voorwaarden, moderatie, Supabase Pro, eigen domein, toegankelijkheids- en Lighthouse-check.

## Controleren
`npm run build` moet slagen. Bekijk wijzigingen met `npm run dev`.
