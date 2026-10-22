-- Sarah@gmail.com signed in fine, but has no row in public.users,
-- so the login page says "couldn't load your profile".
-- This creates the missing rows (safe to run more than once).

insert into public.users (id, email, name, primary_role, status)
select au.id, au.email, 'Sarah', 'mentor', 'active'
from auth.users au
where lower(au.email) = 'sarah@gmail.com'
on conflict (id) do update
  set primary_role = 'mentor', status = 'active';

insert into public.profiles (id, name, email, primary_role)
select au.id, 'Sarah', au.email, 'mentor'
from auth.users au
where lower(au.email) = 'sarah@gmail.com'
on conflict (id) do nothing;

-- Shows the result (should be one row: mentor / active)
select u.id, u.email, u.primary_role, u.status
from public.users u
where lower(u.email) = 'sarah@gmail.com';
