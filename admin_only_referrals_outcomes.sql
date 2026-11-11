-- Referrals and Outcomes are managed by admin/staff only.
-- Removes mentor access to these tables (admin/staff policies stay).
drop policy if exists "rcp_referrals_mentor_select" on public.rcp_referrals;
drop policy if exists "rcp_referrals_mentor_insert" on public.rcp_referrals;
drop policy if exists "rcp_referrals_mentor_update" on public.rcp_referrals;
drop policy if exists "rcp_referrals_mentor_delete" on public.rcp_referrals;

drop policy if exists "rcp_outcomes_mentor_select" on public.rcp_outcomes;
drop policy if exists "rcp_outcomes_mentor_insert" on public.rcp_outcomes;
drop policy if exists "rcp_outcomes_mentor_update" on public.rcp_outcomes;
drop policy if exists "rcp_outcomes_mentor_delete" on public.rcp_outcomes;

-- Check: should list only staff/admin policies
select tablename, policyname
from pg_policies
where tablename in ('rcp_referrals', 'rcp_outcomes')
order by tablename, policyname;
