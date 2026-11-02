// The users from supabase/seed.sql. This password is public: never use it for anything real.
export const SEED_PASSWORD = 'riffit-dev-only';

export const SEED_USERS = [
  { label: 'Maya', email: 'maya@example.test' },
  { label: 'Jo', email: 'jo@example.test' },
  { label: 'Sam', email: 'sam@example.test' },
] as const;

export type SeedUser = (typeof SEED_USERS)[number];
