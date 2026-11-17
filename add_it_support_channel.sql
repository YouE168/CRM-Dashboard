-- IT Support channel: lets users message IT support separately from admin.
-- Existing messages stay in the 'admin' channel. Run this BEFORE pushing the code.
alter table public.direct_messages
  add column if not exists channel text not null default 'admin';

alter table public.direct_messages
  drop constraint if exists direct_messages_channel_check;
alter table public.direct_messages
  add constraint direct_messages_channel_check
  check (channel in ('admin', 'it_support'));

-- Check: existing rows should all show 'admin'
select channel, count(*) from public.direct_messages group by channel;
