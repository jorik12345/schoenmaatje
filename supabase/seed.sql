-- Voorbeelddata voor ontwikkeling en previews. NIET draaien op productie na de livegang.
-- Maakt één demo-gebruiker aan (het profiel volgt via de trigger) met twaalf advertenties.

insert into auth.users (id, email, raw_user_meta_data)
values ('00000000-0000-4000-8000-000000000001', 'demo@schoenmaatje.nl', '{"display_name": "Demo"}')
on conflict (id) do nothing;

update public.profiles set place = 'Utrecht' where id = '00000000-0000-4000-8000-000000000001';

insert into public.listings (owner_id, side, brand, model, size, fit, color, condition, place, description, created_at)
select '00000000-0000-4000-8000-000000000001', v.side::public.shoe_side, v.brand, v.model, v.size, v.fit::public.shoe_fit,
       v.color::public.shoe_color, v.condition::public.shoe_condition, v.place, v.description, now() - v.age
from (values
  ('links',  'Nike',        'Air Max 90',    43.0, 'Heren',  'Wit',    'Als nieuw', 'Utrecht',   'Twee keer gedragen, zool is nog helemaal schoon.', interval '3 hours'),
  ('rechts', 'Adidas',      'Samba OG',      39.0, 'Dames',  'Zwart',  'Goed',      'Groningen', null, interval '6 hours'),
  ('rechts', 'Asics',       'Gel-Kayano 30', 44.5, 'Heren',  'Blauw',  'Als nieuw', 'Eindhoven', 'Hardloopschoen, nooit buiten gedragen.', interval '20 hours'),
  ('links',  'Veja',        'V-10',          38.0, 'Dames',  'Beige',  'Goed',      'Amsterdam', null, interval '1 day 4 hours'),
  ('links',  'New Balance', '574',           42.0, 'Unisex', 'Grijs',  'Gedragen',  'Rotterdam', 'Lichte gebruikssporen aan de neus.', interval '2 days'),
  ('rechts', 'Hoka',        'Clifton 9',     41.0, 'Dames',  'Oranje', 'Als nieuw', 'Zwolle',    null, interval '3 days'),
  ('links',  'Dr. Martens', '1460',          40.0, 'Unisex', 'Bruin',  'Goed',      'Den Haag',  'Ingelopen, leer in goede staat.', interval '4 days'),
  ('rechts', 'Converse',    'Chuck 70',      45.0, 'Heren',  'Groen',  'Goed',      'Nijmegen',  null, interval '5 days'),
  ('links',  'On',          'Cloud 5',       37.0, 'Dames',  'Grijs',  'Als nieuw', 'Leiden',    null, interval '7 days'),
  ('rechts', 'Nike',        'Pegasus 41',    43.0, 'Heren',  'Zwart',  'Goed',      'Breda',     null, interval '8 days'),
  ('links',  'Adidas',      'Gazelle',       42.0, 'Unisex', 'Rood',   'Als nieuw', 'Arnhem',    null, interval '10 days'),
  ('links',  'New Balance', '990v6',         44.0, 'Heren',  'Grijs',  'Goed',      'Haarlem',   'Made in USA, ruim vallend.', interval '12 days')
) as v(side, brand, model, size, fit, color, condition, place, description, age);
