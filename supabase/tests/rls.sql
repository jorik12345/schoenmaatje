-- Tests voor Row Level Security. Draai na supabase-stub.sql, de migraties en seed.sql (zie docs/supabase.md).
\set ON_ERROR_STOP 1
-- A = eigenaar (demo), B = geïnteresseerde, C = buitenstaander
insert into auth.users (id, raw_user_meta_data) values
 ('00000000-0000-4000-8000-00000000000b', '{"display_name":"Bea"}'),
 ('00000000-0000-4000-8000-00000000000c', '{}');

create or replace function pg_temp.expect_denied(sql text, label text) returns void language plpgsql as $$
begin
  execute sql;
  raise exception 'FOUT: % had geweigerd moeten worden', label;
exception when insufficient_privilege then
  raise notice 'ok  %', label;
end $$;
create or replace function pg_temp.ok(cond boolean, label text) returns void language plpgsql as $$
begin
  if not cond then raise exception 'FOUT: %', label; end if;
  raise notice 'ok  %', label;
end $$;

-- anon -------------------------------------------------------------
begin; set local role anon;
select pg_temp.ok((select count(*) from listings) = 12, 'anon ziet 12 actieve advertenties');
select pg_temp.ok((select count(*) from profiles) = 3, 'anon ziet profielen');
select pg_temp.expect_denied($$insert into listings (owner_id, side, brand, model, size, fit, color, condition, place) values ('00000000-0000-4000-8000-000000000001','links','X','Y',42,'Heren','Wit','Goed','Z')$$, 'anon kan geen advertentie plaatsen');
select pg_temp.expect_denied($$select * from reports$$, 'anon ziet geen meldingen');
commit;

-- A zet een advertentie op geruild -----------------------------------
begin; set local role authenticated; set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';
update listings set status = 'geruild' where model = 'Samba OG';
select pg_temp.ok((select count(*) from listings) = 12, 'eigenaar ziet ook eigen geruilde advertentie');
commit;
begin; set local role anon;
select pg_temp.ok((select count(*) from listings) = 11, 'anon ziet geruilde advertentie niet meer');
commit;

-- B --------------------------------------------------------------
begin; set local role authenticated; set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000b';
select pg_temp.ok((select count(*) from profiles where id = '00000000-0000-4000-8000-00000000000c' and display_name = 'Schoenmaatje') = 1, 'profiel zonder naam krijgt standaardnaam');
with u as (update listings set brand = 'Gehackt' where model = 'Air Max 90' returning 1) select pg_temp.ok((select count(*) from u) = 0, 'B kan advertentie van A niet wijzigen');
with u as (delete from listings where model = 'Air Max 90' returning 1) select pg_temp.ok((select count(*) from u) = 0, 'B kan advertentie van A niet verwijderen');
with u as (update profiles set display_name = 'X' where id = '00000000-0000-4000-8000-000000000001' returning 1) select pg_temp.ok((select count(*) from u) = 0, 'B kan profiel van A niet wijzigen');
select pg_temp.expect_denied($$insert into listings (owner_id, side, brand, model, size, fit, color, condition, place) values ('00000000-0000-4000-8000-000000000001','links','X','Y',42,'Heren','Wit','Goed','Z')$$, 'B kan geen advertentie op naam van A plaatsen');
insert into listings (owner_id, side, brand, model, size, fit, color, condition, place) values ('00000000-0000-4000-8000-00000000000b','rechts','Nike','Dunk',42,'Heren','Wit','Goed','Delft');
select pg_temp.ok(true, 'B kan eigen advertentie plaatsen');
insert into conversations (listing_id, starter_id) select id, '00000000-0000-4000-8000-00000000000b' from listings where model = 'Air Max 90';
insert into messages (conversation_id, sender_id, body) select id, '00000000-0000-4000-8000-00000000000b', 'Hoi, is hij er nog?' from conversations;
select pg_temp.ok(true, 'B start gesprek en stuurt bericht');
select pg_temp.expect_denied($$insert into conversations (listing_id, starter_id) select id, '00000000-0000-4000-8000-00000000000b' from listings where model = 'Dunk'$$, 'B kan geen gesprek starten op eigen advertentie');
insert into saved_searches (user_id, side, size) values ('00000000-0000-4000-8000-00000000000b', 'links', 43);
insert into reports (listing_id, reporter_id, reason) select id, '00000000-0000-4000-8000-00000000000b', 'spam' from listings where model = '574';
select pg_temp.expect_denied($$select * from reports$$, 'B kan melden maar meldingen niet lezen');
insert into storage.objects (bucket_id, name) values ('listing-photos', '00000000-0000-4000-8000-00000000000b/x/1.jpg');
select pg_temp.ok(true, 'B uploadt foto in eigen map');
select pg_temp.expect_denied($$insert into storage.objects (bucket_id, name) values ('listing-photos', '00000000-0000-4000-8000-000000000001/x/1.jpg')$$, 'B kan niet uploaden in map van A');
select pg_temp.expect_denied($$insert into listing_photos (listing_id, path) select id, 'a/b.jpg' from listings where model = 'Air Max 90'$$, 'B kan geen foto koppelen aan advertentie van A');
commit;

-- A leest het bericht ----------------------------------------------
begin; set local role authenticated; set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';
select pg_temp.ok((select count(*) from messages) = 1, 'A (eigenaar) ziet het bericht');
with u as (update messages set read_at = now() returning 1) select pg_temp.ok((select count(*) from u) = 1, 'A markeert bericht als gelezen');
select pg_temp.expect_denied($$update messages set body = 'aangepast'$$, 'A kan berichttekst niet aanpassen');
select pg_temp.ok((select count(*) from saved_searches) = 0, 'A ziet zoekopdrachten van B niet');
insert into messages (conversation_id, sender_id, body) select id, '00000000-0000-4000-8000-000000000001', 'Ja, nog beschikbaar.' from conversations;
select pg_temp.ok(true, 'A antwoordt');
commit;

-- C ---------------------------------------------------------------
begin; set local role authenticated; set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000c';
select pg_temp.ok((select count(*) from messages) = 0 and (select count(*) from conversations) = 0, 'C ziet gesprek van A en B niet');
commit;

-- Schrijven in andermans gesprek, met het echte gesprek-ID
select id as conv from conversations limit 1 \gset
begin; set local role authenticated; set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000c';
select pg_temp.expect_denied(format($$insert into messages (conversation_id, sender_id, body) values (%L, '00000000-0000-4000-8000-00000000000c', 'ik lees mee')$$, :'conv'), 'C kan niet in gesprek van A en B schrijven');
select pg_temp.expect_denied(format($$insert into messages (conversation_id, sender_id, body) values (%L, '00000000-0000-4000-8000-000000000001', 'namens A')$$, :'conv'), 'C kan niet namens A schrijven');
commit;
begin; set local role authenticated; set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000b';
select pg_temp.expect_denied(format($$insert into messages (conversation_id, sender_id, body) values (%L, '00000000-0000-4000-8000-000000000001', 'namens A')$$, :'conv'), 'B kan niet namens A schrijven');
commit;

-- Tabelrechten (grants) -------------------------------------------------
begin; set local role anon;
select pg_temp.expect_denied($$select * from saved_searches$$, 'anon heeft geen toegang tot zoekopdrachten');
select pg_temp.expect_denied($$select * from messages$$, 'anon heeft geen toegang tot berichten');
commit;
begin; set local role authenticated; set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000b';
select pg_temp.expect_denied($$update listings set owner_id = '00000000-0000-4000-8000-00000000000b'$$, 'eigenaar van een advertentie is niet te wijzigen');
select pg_temp.expect_denied($$update profiles set created_at = now()$$, 'alleen naam en plaats van een profiel zijn te wijzigen');
select pg_temp.expect_denied($$select * from reports$$, 'gebruikers kunnen meldingen niet lezen');
with u as (update listings set status = 'gereserveerd' where model = 'Dunk' returning 1) select pg_temp.ok((select count(*) from u) = 1, 'B kan status van eigen advertentie wijzigen');
with u as (update profiles set place = 'Delft' where id = '00000000-0000-4000-8000-00000000000b' returning 1) select pg_temp.ok((select count(*) from u) = 1, 'B kan eigen plaats wijzigen');
commit;

-- Account verwijderen ------------------------------------------------------
begin; set local role anon;
select pg_temp.expect_denied($$select public.delete_own_account()$$, 'anon kan geen account verwijderen');
commit;
begin; set local role authenticated; set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000c';
select public.delete_own_account();
commit;
select pg_temp.ok(
  not exists (select 1 from auth.users where id = '00000000-0000-4000-8000-00000000000c')
  and not exists (select 1 from public.profiles where id = '00000000-0000-4000-8000-00000000000c')
  and exists (select 1 from auth.users where id = '00000000-0000-4000-8000-00000000000b'),
  'C verwijdert alleen het eigen account, profiel gaat mee');
begin; set local role authenticated; set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000b';
select public.delete_own_account();
commit;
select pg_temp.ok(
  not exists (select 1 from public.listings where owner_id = '00000000-0000-4000-8000-00000000000b')
  and not exists (select 1 from public.conversations where starter_id = '00000000-0000-4000-8000-00000000000b')
  and not exists (select 1 from public.saved_searches where user_id = '00000000-0000-4000-8000-00000000000b'),
  'advertenties, gesprekken en zoekopdrachten van B zijn mee verwijderd');
