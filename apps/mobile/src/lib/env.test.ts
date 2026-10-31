import { describe, expect, it } from 'vitest';

import { parseEnv } from './env';

const valid = {
  EXPO_PUBLIC_SUPABASE_URL: 'http://192.168.1.20:54321',
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
};

describe('parseEnv', () => {
  it('returns the values when they are valid', () => {
    expect(parseEnv(valid)).toEqual(valid);
  });

  it('accepts an https URL', () => {
    const env = { ...valid, EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co' };
    expect(parseEnv(env)).toEqual(env);
  });

  it('drops variables it does not know about', () => {
    expect(parseEnv({ ...valid, EXPO_PUBLIC_OTHER: 'x' })).toEqual(valid);
  });

  it('names a missing URL', () => {
    expect(() => parseEnv({ ...valid, EXPO_PUBLIC_SUPABASE_URL: undefined })).toThrow(
      'EXPO_PUBLIC_SUPABASE_URL must be an http or https URL',
    );
  });

  it('names a missing key', () => {
    expect(() => parseEnv({ ...valid, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: undefined })).toThrow(
      'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required',
    );
  });

  it('treats an empty key as missing', () => {
    expect(() => parseEnv({ ...valid, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '' })).toThrow(
      'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required',
    );
  });

  it.each(['192.168.1.20:54321', 'ftp://192.168.1.20', 'not a url'])(
    'rejects the URL %s',
    (url) => {
      expect(() => parseEnv({ ...valid, EXPO_PUBLIC_SUPABASE_URL: url })).toThrow(
        'EXPO_PUBLIC_SUPABASE_URL must be an http or https URL',
      );
    },
  );

  it('reports every problem at once', () => {
    expect(() => parseEnv({})).toThrow(
      /EXPO_PUBLIC_SUPABASE_URL .*\nEXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY /,
    );
  });
});
