import { describe, expect, it } from 'vitest';
import { usernameSchema } from './username';

describe('usernameSchema', () => {
  it.each([
    'maya',
    'a_b.c',
    'abc',
    'x'.repeat(30),
    'thrift.2026',
    'mary-jo',
    'mary.jo.k',
    '_maya_',
    'a__b',
    'a.-b',
  ])('accepts %s', (name) => {
    expect(usernameSchema.safeParse(name).success).toBe(true);
  });

  it.each([
    'ab',
    'x'.repeat(31),
    'has space',
    'émile',
    '',
    '.maya',
    'maya.',
    'a..b',
    '-maya',
    'maya-',
    'a--b',
  ])('rejects %j', (name) => {
    expect(usernameSchema.safeParse(name).success).toBe(false);
  });

  it('normalizes case and whitespace', () => {
    expect(usernameSchema.parse('  Maya.K ')).toBe('maya.k');
  });
});
