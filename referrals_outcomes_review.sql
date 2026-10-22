-- Review/approval step for Referrals and Outcomes.
-- Entries added by mentors wait for Jody's approval and are NOT counted in
-- reports until approved. Entries added by admin/staff are approved
-- automatically. Run once in the Supabase SQL editor (after
-- add_referrals_outcomes.sql).

alter table public.rcp_referrals
  add column if not exists review_status text not null default 'approved'
    check (review_status in ('approved', 'pending_review', 'rejected')),
  add column if not exists reviewed_by uuid references public.users(id),
  add column if not exists reviewed_at timestamptz;

alter table public.rcp_outcomes
  add column if not exists review_status text not null default 'approved'
    check (review_status in ('approved', 'pending_review', 'rejected')),
  add column if not exists reviewed_by uuid references public.users(id),
  add column if not exists reviewed_at timestamptz;

-- Whoever isn't staff can never self-approve:
--  * new rows from non-staff are always pending_review
--  * an edit by non-staff re-submits the row (back to pending_review) and
--    can never touch review fields
create or replace function public.ro_enforce_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.ro_is_staff() then
    if tg_op = 'INSERT' then
      new.review_status := 'pending_review';
      new.reviewed_by := null;
      new.reviewed_at := null;
    else
      new.review_status := 'pending_review';
      new.reviewed_by := old.reviewed_by;
      new.reviewed_at := old.reviewed_at;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists ro_referrals_enforce_review on public.rcp_referrals;
create trigger ro_referrals_enforce_review
  before insert or update on public.rcp_referrals
  for each row execute function public.ro_enforce_review();

drop trigger if exists ro_outcomes_enforce_review on public.rcp_outcomes;
create trigger ro_outcomes_enforce_review
  before insert or update on public.rcp_outcomes
  for each row execute function public.ro_enforce_review();

-- Mentors can only change or remove entries that haven't been approved.
drop policy if exists "rcp_referrals_mentor_update" on public.rcp_referrals;
create policy "rcp_referrals_mentor_update" on public.rcp_referrals
  for update to authenticated
  using (created_by = auth.uid() and review_status <> 'approved'
         and member_id is not null and public.ro_is_mentor_of(member_id))
  with check (business_id is null and created_by = auth.uid());

drop policy if exists "rcp_referrals_mentor_delete" on public.rcp_referrals;
create policy "rcp_referrals_mentor_delete" on public.rcp_referrals
  for delete to authenticated
  using (created_by = auth.uid() and review_status <> 'approved'
         and member_id is not null and public.ro_is_mentor_of(member_id));

drop policy if exists "rcp_outcomes_mentor_update" on public.rcp_outcomes;
create policy "rcp_outcomes_mentor_update" on public.rcp_outcomes
  for update to authenticated
  using (created_by = auth.uid() and review_status <> 'approved'
         and member_id is not null and public.ro_is_mentor_of(member_id))
  with check (business_id is null and created_by = auth.uid());

drop policy if exists "rcp_outcomes_mentor_delete" on public.rcp_outcomes;
create policy "rcp_outcomes_mentor_delete" on public.rcp_outcomes
  for delete to authenticated
  using (created_by = auth.uid() and review_status <> 'approved'
         and member_id is not null and public.ro_is_mentor_of(member_id));
