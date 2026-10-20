-- Schoenmaatje — basisschema (fase 2)
-- Uitgangspunt privacy: we slaan geen gezondheidsgegevens op. Alleen de schoen die iemand aanbiedt of zoekt.

-- Keuzelijsten -----------------------------------------------------------------
create type public.shoe_side as enum ('links', 'rechts');
create type public.shoe_fit as enum ('Dames', 'Heren', 'Unisex');
create type public.shoe_condition as enum ('Als nieuw', 'Goed', 'Gedragen');
create type public.shoe_color as enum ('Zwart', 'Wit', 'Grijs', 'Beige', 'Bruin', 'Blauw', 'Groen', 'Rood', 'Oranje', 'Roze', 'Meerkleurig');
create type public.listing_status as enum ('actief', 'gereserveerd', 'geruild', 'verwijderd');
create type public.report_reason as enum ('nep', 'ongepast', 'spam', 'anders');

-- Profielen: alleen wat andere gebruikers mogen zien ----------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  place text check (char_length(place) <= 60),
  created_at timestamptz not null default now()
);

-- Advertenties -------------------------------------------------------------------
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  side public.shoe_side not null,
  brand text not null check (char_length(brand) between 1 and 60),
  model text not null check (char_length(model) between 1 and 80),
  size numeric(3, 1) not null check (size between 15 and 55 and size * 2 = round(size * 2)),
  fit public.shoe_fit not null,
  color public.shoe_color not null,
  condition public.shoe_condition not null,
  description text check (char_length(description) <= 1000),
  place text not null check (char_length(place) between 1 and 60),
  status public.listing_status not null default 'actief',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index listings_active_idx on public.listings (status, created_at desc);
create index listings_match_idx on public.listings (side, size) where status = 'actief';
create index listings_owner_idx on public.listings (owner_id);

create table public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  path text not null unique, -- pad in storage-bucket 'listing-photos': <owner_id>/<listing_id>/<bestand>
  position smallint not null default 0,
  created_at timestamptz not null default now()
);
create index listing_photos_listing_idx on public.listing_photos (listing_id, position);

-- Berichten: één gesprek per advertentie per geïnteresseerde ---------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  starter_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (listing_id, starter_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);

-- Opgeslagen zoekopdrachten (voor matchmails in fase 4) --------------------------
create table public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  side public.shoe_side not null,
  size numeric(3, 1) not null check (size between 15 and 55),
  fit public.shoe_fit,
  notify boolean not null default true,
  created_at timestamptz not null default now()
);
create index saved_searches_match_idx on public.saved_searches (side, size) where notify;

-- Meldingen van misbruik: alleen beheerders (service role) lezen ze ---------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason public.report_reason not null,
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  unique (listing_id, reporter_id)
);

-- updated_at bijhouden -------------------------------------------------------------
create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger listings_touch before update on public.listings
  for each row execute function public.touch_updated_at();

-- Profiel aanmaken bij een nieuwe gebruiker -------------------------------------------
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'Schoenmaatje'));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Hulpfunctie voor RLS: is de huidige gebruiker deelnemer aan dit gesprek? -----------
create function public.is_conversation_member(conv uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.conversations c
    join public.listings l on l.id = c.listing_id
    where c.id = conv and (select auth.uid()) in (c.starter_id, l.owner_id)
  );
$$;
