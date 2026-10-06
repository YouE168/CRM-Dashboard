-- Self-healing link between a business contact and their login account.
-- Matches on email, so it works no matter how the person signed up.
-- Run once in the Supabase SQL editor.

create or replace function public.link_my_business_contacts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_count integer;
begin
  select lower(u.email) into v_email from public.users u where u.id = auth.uid();
  if v_email is null then
    return 0;
  end if;

  update public.business_contacts bc
  set user_id = auth.uid()
  where bc.user_id is null
    and lower(bc.email) = v_email;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.link_my_business_contacts() from public, anon;
grant execute on function public.link_my_business_contacts() to authenticated;

-- One-time backfill: link every unlinked contact whose email already
-- matches a real account (fixes Larry and anyone else in the same spot).
update public.business_contacts bc
set user_id = u.id
from public.users u
where bc.user_id is null
  and bc.email is not null
  and lower(bc.email) = lower(u.email);

-- Check: contacts still unlinked (their email doesn't match any account).
select b.name as business, bc.name, bc.email
from public.business_contacts bc
join public.businesses b on b.id = bc.business_id
where bc.user_id is null;
