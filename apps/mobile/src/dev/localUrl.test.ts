import { describe, expect, it } from 'vitest';

import { isLocalUrl } from './localUrl';

describe('isLocalUrl', () => {
  it.each([
    'http://localhost:54321',
    'http://127.0.0.1:54321',
    'http://192.168.1.20:54321',
    'http://10.0.2.2:54321',
    'http://172.16.0.5:54321',
    'http://172.31.255.1:54321/',
  ])('accepts %s', (url) => {
    expect(isLocalUrl(url)).toBe(true);
  });

  it.each([
    'https://abcdefgh.supabase.co',
    'http://abcdefgh.supabase.co',
    // Hosted, but dressed up to look local.
    'https://192.168.1.20:54321',
    'http://192.168.1.20.example.com',
    'http://localhost.example.com',
    'http://192.168.1.20@example.com',
    'http://localhost:54321@example.com',
    // Public addresses that sit next to the private ranges.
    'http://172.15.0.1:54321',
    'http://172.32.0.1:54321',
    'http://192.169.1.20:54321',
    '',
    'not a url',
  ])('refuses %s', (url) => {
    expect(isLocalUrl(url)).toBe(false);
  });
});
