-- Referrals and Outcomes (reporting only - does NOT touch program access).
-- Run once in the Supabase SQL editor.

-- Businesses need a county so reports can filter by it.
alter table public.businesses add column if not exists county text;

-- ---------------------------------------------------------------------
-- Helpers (SECURITY DEFINER so policies never recurse)
-- ---------------------------------------------------------------------
create or replace function public.ro_is_staff()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.primary_role in ('admin', 'staff')
  );
$$;

-- The signed-in user is the assigned mentor of this participant.
create or replace function public.ro_is_mentor_of(pid uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.participants p
    join public.mentors m on m.name = p.mentor
    join public.users u on lower(u.email) = lower(m.email)
    where p.id = pid and u.id = auth.uid()
  );
$$;

revoke all on function public.ro_is_staff() from public, anon;
revoke all on function public.ro_is_mentor_of(uuid) from public, anon;
grant execute on function public.ro_is_staff() to authenticated;
grant execute on function public.ro_is_mentor_of(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Referrals: "we connected someone to a resource"
-- A record belongs to a business and/or a member (participant). When both
-- are set it is still ONE row, so it is only ever counted once.
-- ---------------------------------------------------------------------
create table if not exists public.rcp_referrals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  member_id uuid references public.participants(id) on delete cascade,
  subject_name text,
  referral_type text not null,
  other_label text,
  referred_date date not null,
  referred_to text,
  status text not null default 'pending'
    check (status in ('pending', 'connected', 'did_not_move_forward')),
  related_program text,
  notes text,
  created_by uuid references public.users(id),
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (business_id is not null or member_id is not null)
);

-- ---------------------------------------------------------------------
-- Outcomes: "a confirmed result from our work"
-- ---------------------------------------------------------------------
create table if not exists public.rcp_outcomes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  member_id uuid references public.participants(id) on delete cascade,
  subject_name text,
  outcome_type text not null,
  other_label text,
  achieved_date date not null,
  related_program text,
  description text,
  confirmation text,
  amount numeric(14, 2),          -- loans, grants, investment, owner funds, contracts/sales
  funding_source text,            -- loans, grants, investment, owner funds
  job_count integer,              -- jobs created / retained
  internship_count integer,       -- internships completed
  referral_id uuid references public.rcp_referrals(id) on delete set null,
  created_by uuid references public.users(id),
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (business_id is not null or member_id is not null)
);

create index if not exists rcp_referrals_business_idx on public.rcp_referrals (business_id);
create index if not exists rcp_referrals_member_idx on public.rcp_referrals (member_id);
create index if not exists rcp_outcomes_business_idx on public.rcp_outcomes (business_id);
create index if not exists rcp_outcomes_member_idx on public.rcp_outcomes (member_id);

alter table public.rcp_referrals enable row level security;
alter table public.rcp_outcomes enable row level security;

do $$
declare pol record;
begin
  for pol in select tablename, policyname from pg_policies
             where schemaname = 'public' and tablename in ('rcp_referrals', 'rcp_outcomes') loop
    execute format('drop policy if exists %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end $$;

-- Staff: everything.
create policy "rcp_referrals_staff_all" on public.rcp_referrals
  for all to authenticated
  using (public.ro_is_staff()) with check (public.ro_is_staff());
create policy "rcp_outcomes_staff_all" on public.rcp_outcomes
  for all to authenticated
  using (public.ro_is_staff()) with check (public.ro_is_staff());

-- Mentors: only for members they mentor (never businesses).
create policy "rcp_referrals_mentor_select" on public.rcp_referrals
  for select to authenticated
  using (member_id is not null and public.ro_is_mentor_of(member_id));
create policy "rcp_referrals_mentor_insert" on public.rcp_referrals
  for insert to authenticated
  with check (business_id is null and member_id is not null
              and public.ro_is_mentor_of(member_id) and created_by = auth.uid());
create policy "rcp_referrals_mentor_update" on public.rcp_referrals
  for update to authenticated
  using (created_by = auth.uid() and member_id is not null and public.ro_is_mentor_of(member_id))
  with check (business_id is null and created_by = auth.uid());
create policy "rcp_referrals_mentor_delete" on public.rcp_referrals
  for delete to authenticated
  using (created_by = auth.uid() and member_id is not null and public.ro_is_mentor_of(member_id));

create policy "rcp_outcomes_mentor_select" on public.rcp_outcomes
  for select to authenticated
  using (member_id is not null and public.ro_is_mentor_of(member_id));
create policy "rcp_outcomes_mentor_insert" on public.rcp_outcomes
  for insert to authenticated
  with check (business_id is null and member_id is not null
              and public.ro_is_mentor_of(member_id) and created_by = auth.uid());
create policy "rcp_outcomes_mentor_update" on public.rcp_outcomes
  for update to authenticated
  using (created_by = auth.uid() and member_id is not null and public.ro_is_mentor_of(member_id))
  with check (business_id is null and created_by = auth.uid());
create policy "rcp_outcomes_mentor_delete" on public.rcp_outcomes
  for delete to authenticated
  using (created_by = auth.uid() and member_id is not null and public.ro_is_mentor_of(member_id));
