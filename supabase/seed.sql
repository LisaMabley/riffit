-- Local development data. Runs after migrations on `supabase db reset`.
-- Users who have completed onboarding. To add one, add them to auth.users and public.profiles below.
-- Dev builds sign in with `<username>@example.test` and this password (see
-- apps/mobile/src/dev/seedCredentials.ts), and the switcher on the Profile tab lists them all.
--
-- This password is public. Never load this file into a hosted project.

-- Runs only on the local stack, so `supabase db reset --linked` can't load it into a hosted
-- project. Local databases carry the Supabase CLI's public development JWT secret, which a hosted
-- project never has. The CLI sends this file as one batch, so the exception stops all of it.
do $$
begin
  if current_setting('app.settings.jwt_secret', true) is distinct from
    'super-secret-jwt-token-with-at-least-32-characters-long' then
    raise exception 'seed.sql only runs on the local Supabase stack: its test users have a public password';
  end if;
end
$$;

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
   'authenticated', 'authenticated', 'jo.makes@example.test', '', now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'sam_k@example.test', '', now(),
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
