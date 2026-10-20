# Accounts instellen (Supabase Auth)

Vervang overal `jouw-site` door de naam van je Netlify-site (zoals in `jouw-site.netlify.app`).

## 1. Database bijwerken
Draai in de SQL Editor `supabase/migrations/20261021090000_account_delete.sql` (nodig voor "Account verwijderen").

## 2. Adressen (Authentication → URL Configuration)
- **Site URL:** `https://jouw-site.netlify.app`
- **Redirect URLs** (alle drie toevoegen):
  - `https://jouw-site.netlify.app/**`
  - `https://deploy-preview-*--jouw-site.netlify.app/**` (zodat inloggen ook op PR-previews werkt)
  - `http://localhost:4321/**`

Staat een adres hier niet, dan stuurt Supabase links uit e-mails naar de Site URL in plaats van naar de juiste pagina.

## 3. E-mail versturen (Authentication → Emails → SMTP Settings)
De ingebouwde mail van Supabase verstuurt maar een paar berichten per uur. Gebruik een eigen dienst:

**Resend** (gratis tot 3.000 mails per maand) of **Brevo** (gratis tot 300 per dag, servers in de EU).
1. Maak een account aan en een API-sleutel / SMTP-wachtwoord.
2. Zonder eigen domein: gebruik het testadres van de dienst (bij Resend `onboarding@resend.dev`, alleen naar je eigen adres) of je eigen e-mailadres als afzender (Brevo, na verificatie). Voor echte gebruikers heb je een eigen domein nodig; dat komt bij de livegang.
3. Vul in Supabase in: host, poort (587), gebruikersnaam, wachtwoord, afzendernaam `Schoenmaatje`.
4. Zet daarna onder **Rate Limits** het aantal e-mails per uur hoger (bijv. 100).

## 4. E-mailteksten (Authentication → Emails → Templates)
De standaardlinks van Supabase werken alleen als iemand de mail opent in dezelfde browser waarin hij inlogde. Met deze templates werkt het op elk apparaat. Pas ze aan per template:

**Confirm signup** — onderwerp: `Bevestig je account bij Schoenmaatje`
```html
<h2>Welkom bij Schoenmaatje</h2>
<p>Klik op de link hieronder om je e-mailadres te bevestigen en je account te activeren.</p>
<p><a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Account bevestigen</a></p>
<p>Heb je geen account aangemaakt? Dan kun je deze mail negeren.</p>
```

**Magic Link** — onderwerp: `Je inloglink voor Schoenmaatje`
```html
<h2>Inloggen bij Schoenmaatje</h2>
<p>Klik op de link hieronder om in te loggen. De link werkt één keer en verloopt na een uur.</p>
<p><a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Inloggen</a></p>
<p>Heb je niet geprobeerd in te loggen? Dan kun je deze mail negeren.</p>
```

**Reset Password** — onderwerp: `Nieuw wachtwoord voor Schoenmaatje`
```html
<h2>Nieuw wachtwoord kiezen</h2>
<p>Klik op de link hieronder om een nieuw wachtwoord in te stellen.</p>
<p><a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery">Nieuw wachtwoord kiezen</a></p>
<p>Heb je dit niet aangevraagd? Dan kun je deze mail negeren; je wachtwoord blijft hetzelfde.</p>
```

`{{ .RedirectTo }}` is altijd een adres als `https://jouw-site.netlify.app/auth/bevestigen?naar=…`, daarom volgt er `&` en geen `?`.

## 5. Beveiliging tegen bots (Cloudflare Turnstile)
1. Cloudflare-dashboard → **Turnstile** → **Add widget**. Hostnames: `jouw-site.netlify.app` (en `localhost` om lokaal te testen). Widget mode: *Managed*.
2. Kopieer de **site key** en de **secret key**.
3. Supabase → Authentication → **Attack Protection** → Captcha aan → provider *Turnstile* → plak de **secret key**.
4. Netlify → Environment variables → `PUBLIC_TURNSTILE_SITE_KEY` = de **site key**. Opnieuw deployen.

Zet captcha in Supabase pas aan als de site key in Netlify staat; anders kan niemand meer inloggen. Om lokaal zonder captcha te werken: laat `PUBLIC_TURNSTILE_SITE_KEY` leeg en gebruik een Supabase-project waar captcha uit staat, of gebruik de testsleutels van Cloudflare (site key `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`).

## 6. Overige instellingen (Authentication → Sign In / Providers → Email)
- **Confirm email:** aan (standaard).
- **Minimum password length:** 8.
- **Secure email change:** aan.

## Hoe het werkt in de code
- `src/middleware.ts` maakt alleen op accountroutes (`/account`, `/aanbieden`, `/inloggen`, `/registreren`, `/uitloggen`, `/wachtwoord-vergeten`, `/auth/*`) een Supabase-client met de cookies van de bezoeker, en stuurt niet-ingelogde bezoekers van `/account` en `/aanbieden` naar `/inloggen`. Die pagina's krijgen `Cache-Control: private, no-store`.
- Openbare pagina's (home, aanbod, schoen) lezen nooit cookies, zodat het CDN ze veilig kan cachen.
- Links uit e-mails komen binnen op `/auth/bevestigen` (`src/pages/auth/bevestigen.ts`).
- Acties namens de gebruiker staan in `src/lib/account.ts`; RLS in de database controleert alles opnieuw.
