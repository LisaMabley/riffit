import { isAuthRetryableFetchError, type AuthError } from '@supabase/supabase-js';

export function signInErrorMessage(error: AuthError, supabaseUrl: string): string {
  if (isAuthRetryableFetchError(error)) {
    return (
      `Dev sign-in couldn't reach ${supabaseUrl} (${error.message}). Is that still this computer's ` +
      `address? Check EXPO_PUBLIC_SUPABASE_URL in apps/mobile/.env, then restart Expo.`
    );
  }
  if (error.code === 'invalid_credentials') {
    return 'Dev sign-in was refused. Run `pnpm db:reset` to recreate the seed users.';
  }
  return `Dev sign-in failed: ${error.message}`;
}
