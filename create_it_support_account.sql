-- IT Support account for You E (kry.ue59@gmail.com)
-- Run STEP 1 first and look at the result. Then run STEP 2.

-- STEP 1: does the account already exist?
select au.id as auth_id, u.primary_role, u.status, u.name
from auth.users au
left join public.users u on u.id = au.id
where lower(au.email) = 'kry.ue59@gmail.com';
-- 0 rows  -> no account yet: use "Request Staff or Admin Access" on the login
--            page with this email, then approve it in the admin dashboard.
-- 1 row   -> account exists: run STEP 2.

-- STEP 2: make it an admin account named "You E (IT Support)"
update public.users
set primary_role = 'admin', secondary_role = null, status = 'active',
    name = 'You E (IT Support)'
where lower(email) = 'kry.ue59@gmail.com';

update public.profiles
set primary_role = 'admin', name = 'You E (IT Support)'
where lower(email) = 'kry.ue59@gmail.com';

-- Remove any old test mentee/entrepreneur records so this account does not
-- count as a program participant in the reports.
delete from public.user_programs
where user_id in (select id from public.users where lower(email) = 'kry.ue59@gmail.com');
delete from public.participants
where lower(email) = 'kry.ue59@gmail.com';

-- Check: should show role admin, status active
select id, email, name, primary_role, status
from public.users where lower(email) = 'kry.ue59@gmail.com';
