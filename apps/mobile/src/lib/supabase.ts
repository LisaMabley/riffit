import type { Database } from '@riffit/supabase';
import { createClient } from '@supabase/supabase-js';

import { parseEnv } from './env';

// Expo only inlines EXPO_PUBLIC_ variables written out in full, so process.env can't be passed as is.
const env = parseEnv({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});

export const supabase = createClient<Database>(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  {
    // Sign-in (#5) adds saving the session on the device.
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  },
);
