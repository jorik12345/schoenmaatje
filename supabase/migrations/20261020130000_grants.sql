-- Expliciete tabelrechten voor de Data API.
-- Nieuwe Supabase-projecten (vanaf 30 mei 2026, bestaande vanaf 30 oktober 2026) geven anon en authenticated
-- niet meer automatisch rechten op nieuwe tabellen. Zonder deze grants: "permission denied for table".
-- Grants bepalen óf een rol een tabel mag gebruiken; RLS (zie _rls.sql) bepaalt welke rijen.
-- We trekken eerst alles in, zodat oude en nieuwe projecten precies dezelfde rechten hebben.

revoke all on public.profiles, public.listings, public.listing_photos, public.conversations,
  public.messages, public.saved_searches, public.reports from anon, authenticated;

-- Iedereen (ook zonder account): het openbare aanbod lezen
grant select on public.profiles, public.listings, public.listing_photos to anon, authenticated;

-- Met account
grant update (display_name, place) on public.profiles to authenticated;
grant insert, delete on public.listings to authenticated;
grant update (side, brand, model, size, fit, color, condition, description, place, status) on public.listings to authenticated;
grant insert, delete on public.listing_photos to authenticated;
grant update (position) on public.listing_photos to authenticated;
grant select, insert on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;
grant update (read_at) on public.messages to authenticated;
grant select, insert, update, delete on public.saved_searches to authenticated;
grant insert on public.reports to authenticated;

-- Beheer en achtergrondtaken (matchmails, moderatie)
grant all on public.profiles, public.listings, public.listing_photos, public.conversations,
  public.messages, public.saved_searches, public.reports to service_role;

-- Functies: alleen wat RLS nodig heeft
revoke execute on function public.is_conversation_member(uuid) from public, anon;
grant execute on function public.is_conversation_member(uuid) to authenticated, service_role;
revoke execute on function public.handle_new_user(), public.touch_updated_at() from public, anon, authenticated;
