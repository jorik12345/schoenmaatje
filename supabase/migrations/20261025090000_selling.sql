-- Fase 4a: verkopen en weggeven naast ruilen.
-- Betalen gebeurt buiten het platform (Tikkie, contant); we slaan alleen de vraagprijs op.

create type public.listing_offer as enum ('verkoop', 'gratis', 'ruil');
create type public.seller_type as enum ('particulier', 'handelaar');

-- Bestaande advertenties waren ruiladvertenties; ruilen blijft de standaard als er niets is gekozen.
alter table public.listings
  add column offer public.listing_offer not null default 'ruil',
  add column price_cents integer check (price_cents between 1 and 100000);
-- Te koop heeft altijd een prijs; gratis en ruilen nooit.
alter table public.listings add constraint listings_offer_price
  check ((offer = 'verkoop') = (price_cents is not null));

-- Verkocht naast geruild. Niet openbaar zichtbaar (RLS toont alleen actief en gereserveerd).
alter type public.listing_status add value if not exists 'verkocht' after 'gereserveerd';

-- Verplicht te tonen bij advertenties: particulier of handelaar.
alter table public.profiles add column seller_type public.seller_type not null default 'particulier';

create index listings_offer_idx on public.listings (offer, price_cents) where status = 'actief';

-- Tabelrechten voor de nieuwe kolommen (select geldt al voor de hele tabel).
grant update (offer, price_cents) on public.listings to authenticated;
grant update (seller_type) on public.profiles to authenticated;
