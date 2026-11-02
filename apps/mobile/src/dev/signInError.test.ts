import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

import { signInErrorMessage } from './signInError';

const url = 'http://192.168.1.20:54321';

describe('signInErrorMessage', () => {
  it('points at the address when the stack can not be reached', () => {
    const message = signInErrorMessage(new AuthRetryableFetchError('fetch failed', 0), url);
    expect(message).toContain(url);
    expect(message).toContain('EXPO_PUBLIC_SUPABASE_URL');
    expect(message).not.toContain('db:reset');
  });

  it('points at the seed when the credentials are refused', () => {
    const error = new AuthApiError('Invalid login credentials', 400, 'invalid_credentials');
    expect(signInErrorMessage(error, url)).toContain('pnpm db:reset');
  });

  it('passes anything else through', () => {
    const error = new AuthApiError('Too many requests', 429, 'over_request_rate_limit');
    expect(signInErrorMessage(error, url)).toBe('Dev sign-in failed: Too many requests');
  });
});
