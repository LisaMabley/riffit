// Writes supabase/seed.sql from src/dev/seedUsers.ts. Run with `pnpm db:gen-seed`.
import { writeFileSync } from 'node:fs';

import { SEED_PASSWORD, SEED_USERS } from '../src/dev/seedUsers.ts';

const text = (value) => `'${value.replaceAll("'", "''")}'`;

const authUsers = SEED_USERS.map(
  (user) => `  (${text(user.id)}, '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', ${text(user.email)}, '', now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')`,
).join(',\n');

const profiles = SEED_USERS.map(
  (user) =>
    `  (${text(user.id)}, ${text(user.username)}, ${text(user.displayName)}, ${text(user.bio)}, now())`,
).join(',\n');

const seed = `-- Generated from apps/mobile/src/dev/seedUsers.ts by \`pnpm db:gen-seed\`. Don't edit by hand.
-- Local development data. Runs after migrations on \`supabase db reset\`.
-- Users who have completed onboarding. Dev builds sign in as them with the password below.
--
-- This password is public. Never load this file into a hosted project.

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
values
${authUsers};

update auth.users
set encrypted_password = extensions.crypt(${text(SEED_PASSWORD)}, extensions.gen_salt('bf', 10))
where email like '%@example.test';

insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
select
  id::text, id, jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
  'email', now(), now()
from auth.users
where email like '%@example.test';

insert into public.profiles (id, username, display_name, bio, age_confirmed_at)
values
${profiles};
`;

writeFileSync(new URL('../../../supabase/seed.sql', import.meta.url), seed);
