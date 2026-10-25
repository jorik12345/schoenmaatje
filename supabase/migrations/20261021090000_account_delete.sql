-- Eigen account verwijderen (AVG: recht op vergetelheid).
-- Verwijdert de gebruiker uit auth.users; profiel, advertenties, berichten, zoekopdrachten en meldingen
-- gaan via "on delete cascade" mee. Foto-bestanden in storage ruimt de site vooraf op (src/lib/account.ts).
create function public.delete_own_account() returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then
    raise exception 'Niet ingelogd' using errcode = '42501';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
