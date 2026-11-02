-- Generated from apps/mobile/src/dev/seedUsers.ts by `pnpm db:gen-seed`. Don't edit by hand.
-- Local development data. Runs after migrations on `supabase db reset`.
-- Users who have completed onboarding. Dev builds sign in as them with the password below.
--
-- This password is public. Never load this file into a hosted project.

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
values
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'maya@example.test', '', now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'jo@example.test', '', now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'sam@example.test', '', now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

update auth.users
set encrypted_password = extensions.crypt('riffit-dev-only', extensions.gen_salt('bf', 10))
where email like '%@example.test';

insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
select
  id::text, id, jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
  'email', now(), now()
from auth.users
where email like '%@example.test';

insert into public.profiles (id, username, display_name, bio, age_confirmed_at)
values
  ('00000000-0000-4000-8000-000000000001', 'maya', 'Maya', 'Thrift store maximalist.', now()),
  ('00000000-0000-4000-8000-000000000002', 'jo.makes', 'Jo', 'Visible mending and too many scarves.', now()),
  ('00000000-0000-4000-8000-000000000003', 'sam_k', 'Sam K', 'Mostly black, sometimes more black.', now());
