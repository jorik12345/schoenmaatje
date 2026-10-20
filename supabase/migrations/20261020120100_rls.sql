-- Row Level Security: de database bepaalt zelf wie wat mag.

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_photos enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.saved_searches enable row level security;
alter table public.reports enable row level security;

-- profiles: openbaar leesbaar (alleen weergavenaam en plaats), alleen zelf aanpassen
create policy "profielen zijn openbaar" on public.profiles
  for select to anon, authenticated using (true);
create policy "eigen profiel aanpassen" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- listings: actieve en gereserveerde advertenties zijn openbaar; de eigenaar ziet ook de rest
create policy "advertenties zijn openbaar" on public.listings
  for select to anon, authenticated using (status in ('actief', 'gereserveerd'));
create policy "eigen advertenties zien" on public.listings
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "advertentie plaatsen" on public.listings
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "eigen advertentie aanpassen" on public.listings
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "eigen advertentie verwijderen" on public.listings
  for delete to authenticated using (owner_id = (select auth.uid()));

-- listing_photos: zichtbaar als de advertentie zichtbaar is; beheer door de eigenaar
create policy "foto's van zichtbare advertenties" on public.listing_photos
  for select to anon, authenticated using (
    exists (select 1 from public.listings l where l.id = listing_id)
  );
create policy "foto's beheren door eigenaar" on public.listing_photos
  for all to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid())));

-- conversations: alleen de twee deelnemers; starten kan alleen op andermans actieve advertentie
create policy "eigen gesprekken zien" on public.conversations
  for select to authenticated using (public.is_conversation_member(id));
create policy "gesprek starten" on public.conversations
  for insert to authenticated with check (
    starter_id = (select auth.uid())
    and exists (
      select 1 from public.listings l
      where l.id = listing_id and l.status = 'actief' and l.owner_id <> (select auth.uid())
    )
  );

-- messages: lezen en sturen alleen binnen je eigen gesprekken, als jezelf
create policy "berichten in eigen gesprekken" on public.messages
  for select to authenticated using (public.is_conversation_member(conversation_id));
create policy "bericht sturen" on public.messages
  for insert to authenticated with check (
    sender_id = (select auth.uid()) and public.is_conversation_member(conversation_id)
  );
create policy "ontvangen bericht als gelezen markeren" on public.messages
  for update to authenticated
  using (sender_id <> (select auth.uid()) and public.is_conversation_member(conversation_id))
  with check (sender_id <> (select auth.uid()) and public.is_conversation_member(conversation_id));
-- Alleen read_at mag worden aangepast, niet de tekst of afzender.
revoke update on public.messages from authenticated;
grant update (read_at) on public.messages to authenticated;

-- saved_searches: volledig privé
create policy "eigen zoekopdrachten" on public.saved_searches
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- reports: iedereen met een account kan melden, niemand kan meldingen lezen (alleen service role)
create policy "advertentie melden" on public.reports
  for insert to authenticated with check (reporter_id = (select auth.uid()));
