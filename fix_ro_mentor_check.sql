-- Lets a mentor add referrals/outcomes for their mentees even when the
-- mentor has no row in the `mentors` table (matches how the mentor
-- dashboard finds mentees: participants.mentor = the mentor's account name).
create or replace function public.ro_is_mentor_of(pid uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.participants p
    join public.users u on u.id = auth.uid()
    where p.id = pid
      and p.mentor is not null
      and lower(btrim(p.mentor)) = lower(btrim(u.name))
  )
  or exists (
    select 1
    from public.participants p
    join public.mentors m on m.name = p.mentor
    join public.users u on lower(u.email) = lower(m.email)
    where p.id = pid and u.id = auth.uid()
  );
$$;

grant execute on function public.ro_is_mentor_of(uuid) to authenticated;
