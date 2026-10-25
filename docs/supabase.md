# Supabase instellen

De site werkt ook zonder Supabase: dan toont hij de voorbeelddata uit `src/data/shoes.ts`. Met de stappen hieronder komt het aanbod uit de database.

## 1. Project aanmaken
1. Maak op [supabase.com](https://supabase.com) een nieuw project aan, regio **Central EU (Frankfurt)**.
2. Bewaar het databasewachtwoord in je wachtwoordmanager.

## 2. Database inrichten
Kies één van twee manieren.

**Via de SQL Editor (geen installatie nodig).** Plak en draai in deze volgorde:
1. `supabase/migrations/20261020120000_schema.sql`
2. `supabase/migrations/20261020120100_rls.sql`
3. `supabase/migrations/20261020120200_storage.sql`
4. `supabase/migrations/20261020130000_grants.sql`: de tabelrechten. Nieuwe Supabase-projecten geven die niet meer automatisch; zonder dit bestand krijg je `permission denied for table listings`.
5. `supabase/migrations/20261021090000_account_delete.sql`: eigen account verwijderen.
6. `supabase/migrations/20261025090000_selling.sql`: verkopen en weggeven naast ruilen, particulier/handelaar.
7. Optioneel `supabase/seed.sql` voor twaalf voorbeeldadvertenties (van een demo-gebruiker). **Verwijder die demo-gebruiker voor de livegang** (Authentication → Users → demo@schoenmaatje.nl); de advertenties gaan dan automatisch mee.

**Via de Supabase CLI.**
```sh
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

## 3. Sleutels in Netlify zetten
Supabase → Project Settings → API Keys. Zet in Netlify (Site configuration → Environment variables):

| Variabele | Waarde |
|---|---|
| `PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | de **publishable** key (`sb_publishable_…`), of de oude `anon`-key |

Deze sleutel mag openbaar zijn: de Row Level Security in de database bepaalt wat iemand mag. Zet de **secret/service_role**-key nooit in een `PUBLIC_`-variabele.

Lokaal: kopieer `.env.example` naar `.env` en vul dezelfde waarden in.

Start daarna een nieuwe deploy in Netlify; de variabelen worden tijdens de build ingelezen.

## Problemen oplossen
- **`permission denied for table …`**: de tabelrechten ontbreken. Draai `20261020130000_grants.sql`.
- **`relation "public.…" does not exist`** bij de RLS-migratie: de schemamigratie is maar half uitgevoerd (bijvoorbeeld omdat er tekst geselecteerd was; de SQL Editor draait dan alleen de selectie). Zolang er geen echte data in staat: alles opruimen en opnieuw draaien:
  ```sql
  drop trigger if exists on_auth_user_created on auth.users;
  drop table if exists public.reports, public.saved_searches, public.messages, public.conversations,
    public.listing_photos, public.listings, public.profiles cascade;
  drop function if exists public.is_conversation_member(uuid), public.handle_new_user(), public.touch_updated_at();
  drop type if exists public.shoe_side, public.shoe_fit, public.shoe_condition, public.shoe_color,
    public.listing_status, public.report_reason;
  drop policy if exists "foto uploaden in eigen map" on storage.objects;
  drop policy if exists "eigen foto aanpassen" on storage.objects;
  drop policy if exists "eigen foto verwijderen" on storage.objects;
  ```

## 4. Gratis project actief houden
Gratis Supabase-projecten pauzeren na een week zonder verkeer. Tijdens het bouwen: gewoon weer aanzetten in het dashboard. Bij de livegang: overstappen op Pro.

## Database-tests lokaal draaien
De toegangsregels en tabelrechten hebben tests in `supabase/tests/rls.sql`. Ze draaien op gewone PostgreSQL (16+) met een nabootsing van Supabase (zonder automatische tabelrechten, zoals nieuwe projecten):

```sh
createdb schoenmaatje_test
for f in supabase/tests/supabase-stub.sql supabase/migrations/*.sql supabase/seed.sql supabase/tests/rls.sql; do
  psql -d schoenmaatje_test -v ON_ERROR_STOP=1 -q -f "$f" || break
done
```

Elke regel `ok  …` is een geslaagde controle; bij een fout stopt het script met `FOUT: …`. Opslag (storage) wordt alleen op het niveau van de mapregels getest.

## Schema in het kort
| Tabel | Wat | Wie leest |
|---|---|---|
| `profiles` | weergavenaam en plaats (aangemaakt bij registratie) | iedereen |
| `listings` | advertenties | iedereen (actief en gereserveerd); de eigenaar ziet alles van zichzelf |
| `listing_photos` | foto's per advertentie, bestanden in bucket `listing-photos` onder `<user_id>/…` | zoals de advertentie |
| `conversations`, `messages` | berichten per advertentie | alleen de twee deelnemers |
| `saved_searches` | zoekopdrachten voor matchmails | alleen de eigenaar |
| `reports` | meldingen van misbruik | niemand behalve beheer (service role) |

Er wordt geen gezondheidsinformatie opgeslagen, alleen de schoen die iemand aanbiedt of zoekt.

## Accounts
Inloggen, e-mail en beveiliging tegen bots stel je in volgens [docs/auth.md](auth.md).
