-- Lets each signed-in user see the meetings they were part of (date, time,
-- duration, who) WITHOUT exposing private admin note text.
-- Run once in the Supabase SQL editor.

create or replace function public.get_my_time_log()
returns table (
  entry_type text,
  person_name text,
  with_or_by text,
  meeting_date text,
  meeting_time text,
  duration_minutes integer,
  topic text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_email text;
  v_participant_id uuid;
  v_business_ids uuid[];
  v_mentor_name text;
begin
  select u.email into v_email from public.users u where u.id = auth.uid();

  select p.id into v_participant_id
  from public.participants p
  where p.user_id = auth.uid()
  limit 1;

  select coalesce(array_agg(distinct bc.business_id), '{}')
  into v_business_ids
  from public.business_contacts bc
  where bc.user_id = auth.uid();

  select m.name into v_mentor_name
  from public.mentors m
  where v_email is not null and lower(m.email) = lower(v_email)
  limit 1;

  return query
  -- Admin meetings about me / my business (note text is never returned)
  select
    'Admin Meeting'::text,
    coalesce(cn.member_name, '')::text,
    coalesce(cn.author, 'Staff')::text,
    cn.meeting_date::text,
    cn.meeting_time::text,
    cn.duration_minutes::integer,
    ''::text
  from public.case_notes cn
  where (cn.meeting_date is not null or cn.duration_minutes is not null)
    and (
      (v_participant_id is not null and cn.member_id = v_participant_id)
      or cn.member_id = any (v_business_ids)
    )

  union all

  -- Mentor sessions where I'm the mentee or the mentor
  select
    'Mentor Session'::text,
    coalesce(p.name, '')::text,
    coalesce(s.mentor_name, '')::text,
    s.date::text,
    s.time::text,
    s.duration::integer,
    coalesce(s.topic, '')::text
  from public.mentee_sessions s
  left join public.participants p on p.id = s.participant_id
  where (v_participant_id is not null and s.participant_id = v_participant_id)
     or (v_mentor_name is not null and s.mentor_name = v_mentor_name);
end;
$$;

revoke all on function public.get_my_time_log() from public, anon;
grant execute on function public.get_my_time_log() to authenticated;
