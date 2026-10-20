-- Session documents: mentors (and admin) can attach files to a mentoring
-- session; the mentee on that session can view/download them.
-- Run once in the Supabase SQL editor.

-- 1) Helper functions (SECURITY DEFINER so policies never recurse).
create or replace function public.session_docs_is_staff()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.primary_role in ('admin', 'staff')
  );
$$;

-- The signed-in user is the mentor on this session.
create or replace function public.session_docs_is_mentor(sid uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.mentee_sessions s
    join public.mentors m on m.name = s.mentor_name
    join public.users u on lower(u.email) = lower(m.email)
    where s.id = sid and u.id = auth.uid()
  );
$$;

-- The signed-in user is the mentee on this session.
create or replace function public.session_docs_is_mentee(sid uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.mentee_sessions s
    join public.participants p on p.id = s.participant_id
    where s.id = sid and p.user_id = auth.uid()
  );
$$;

create or replace function public.session_docs_can_view(sid uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select public.session_docs_is_staff()
      or public.session_docs_is_mentor(sid)
      or public.session_docs_is_mentee(sid);
$$;

create or replace function public.session_docs_can_upload(sid uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select public.session_docs_is_staff() or public.session_docs_is_mentor(sid);
$$;

revoke all on function public.session_docs_is_staff() from public, anon;
revoke all on function public.session_docs_is_mentor(uuid) from public, anon;
revoke all on function public.session_docs_is_mentee(uuid) from public, anon;
revoke all on function public.session_docs_can_view(uuid) from public, anon;
revoke all on function public.session_docs_can_upload(uuid) from public, anon;
grant execute on function public.session_docs_is_staff() to authenticated;
grant execute on function public.session_docs_is_mentor(uuid) to authenticated;
grant execute on function public.session_docs_is_mentee(uuid) to authenticated;
grant execute on function public.session_docs_can_view(uuid) to authenticated;
grant execute on function public.session_docs_can_upload(uuid) to authenticated;

-- 2) Table
create table if not exists public.session_documents (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.mentee_sessions(id) on delete cascade,
  file_name text not null,
  file_path text not null unique,
  file_size bigint,
  mime_type text,
  uploaded_by uuid references public.users(id),
  uploaded_by_name text,
  created_at timestamptz not null default now()
);

create index if not exists session_documents_session_idx
  on public.session_documents (session_id);

alter table public.session_documents enable row level security;

do $$
declare pol record;
begin
  for pol in select policyname from pg_policies
             where schemaname = 'public' and tablename = 'session_documents' loop
    execute format('drop policy if exists %I on public.session_documents', pol.policyname);
  end loop;
end $$;

create policy "session_documents_select" on public.session_documents
  for select to authenticated
  using (public.session_docs_can_view(session_id));

create policy "session_documents_insert" on public.session_documents
  for insert to authenticated
  with check (public.session_docs_can_upload(session_id) and uploaded_by = auth.uid());

create policy "session_documents_delete" on public.session_documents
  for delete to authenticated
  using (public.session_docs_is_staff() or uploaded_by = auth.uid());

-- 3) Private storage bucket (10 MB per file; documents + images only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'session-documents', 'session-documents', false, 10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv',
    'image/png', 'image/jpeg', 'image/webp', 'image/gif'
  ]
)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      public = false;

-- Files are stored as  <session_id>/<unique-name>  so the first folder
-- tells the policies which session a file belongs to.
drop policy if exists "session_docs_storage_select" on storage.objects;
drop policy if exists "session_docs_storage_insert" on storage.objects;
drop policy if exists "session_docs_storage_delete" on storage.objects;

create policy "session_docs_storage_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'session-documents'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and public.session_docs_can_view(((storage.foldername(name))[1])::uuid)
  );

create policy "session_docs_storage_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'session-documents'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and public.session_docs_can_upload(((storage.foldername(name))[1])::uuid)
  );

create policy "session_docs_storage_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'session-documents'
    and (
      public.session_docs_is_staff()
      or exists (
        select 1 from public.session_documents d
        where d.file_path = storage.objects.name and d.uploaded_by = auth.uid()
      )
    )
  );
