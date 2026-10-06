-- Lets each signed-in user fetch the published documents shared with
-- them (individually, via their business, or as a group recipient)
-- without needing direct read access to business_contacts / participants.
-- Run once in the Supabase SQL editor.

create or replace function public.get_my_published_documents()
returns setof public.shared_documents
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_participant_id uuid;
  v_member_ids uuid[];
begin
  select p.id into v_participant_id
  from public.participants p
  where p.user_id = auth.uid()
  limit 1;

  select coalesce(array_agg(distinct x), '{}') into v_member_ids
  from (
    select v_participant_id as x where v_participant_id is not null
    union
    select bc.business_id from public.business_contacts bc where bc.user_id = auth.uid()
  ) t;

  return query
  select sd.*
  from public.shared_documents sd
  where sd.status = 'published'
    and (
      sd.member_id = any (v_member_ids)
      or exists (
        select 1 from public.shared_document_recipients r
        where r.document_id = sd.id and r.member_id = any (v_member_ids)
      )
    );
end;
$$;

revoke all on function public.get_my_published_documents() from public, anon;
grant execute on function public.get_my_published_documents() to authenticated;
