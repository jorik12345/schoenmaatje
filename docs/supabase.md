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
4. Optioneel `supabase/seed.sql` voor twaalf voorbeeldadvertenties (van een demo-gebruiker). **Verwijder die demo-gebruiker voor de livegang** (Authentication → Users → demo@schoenmaatje.nl); de advertenties gaan dan automatisch mee.

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

## 4. Gratis project actief houden
Gratis Supabase-projecten pauzeren na een week zonder verkeer. Tijdens het bouwen: gewoon weer aanzetten in het dashboard. Bij de livegang: overstappen op Pro.

## Database-tests lokaal draaien
De toegangsregels hebben tests in `supabase/tests/rls.sql`. Ze draaien op gewone PostgreSQL (16+) met een nabootsing van Supabase:

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
