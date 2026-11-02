// The only place the test users are defined. After changing this file, run `pnpm db:gen-seed` to
// regenerate supabase/seed.sql, then `pnpm db:reset`. CI fails if the two don't match.
// This password is public: never use it for anything real.
export const SEED_PASSWORD = 'riffit-dev-only';

export const SEED_USERS = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    email: 'maya@example.test',
    username: 'maya',
    displayName: 'Maya',
    bio: 'Thrift store maximalist.',
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    email: 'jo@example.test',
    username: 'jo.makes',
    displayName: 'Jo',
    bio: 'Visible mending and too many scarves.',
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    email: 'sam@example.test',
    username: 'sam_k',
    displayName: 'Sam K',
    bio: 'Mostly black, sometimes more black.',
  },
] as const;

export type SeedUser = (typeof SEED_USERS)[number];
