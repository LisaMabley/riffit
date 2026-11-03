// supabase/seed.sql owns the test users. The app only needs what it takes to sign in as them, and
// lists who else to switch to from profiles. This password is public: never use it for anything real.
export const SEED_PASSWORD = 'riffit-dev-only';
export const SEED_EMAIL_DOMAIN = '@example.test';
export const FIRST_USERNAME = 'maya';

// Every user in seed.sql needs an email in this form.
export function seedEmail(username: string): string {
  return `${username}${SEED_EMAIL_DOMAIN}`;
}
