import { describe, expect, it } from 'vitest';

import { characterCount } from './text';

describe('characterCount', () => {
  it('counts plain text one per letter', () => {
    expect(characterCount('Riff on this')).toBe(12);
  });

  it('counts an emoji as one character, like char_length()', () => {
    expect(characterCount('new coat 👗')).toBe(10);
  });

  it('counts each part of a joined emoji, like char_length()', () => {
    // Woman, zero-width joiner, laptop: three code points that show as one picture.
    expect(characterCount('👩‍💻')).toBe(3);
  });

  it('counts nothing in empty text', () => {
    expect(characterCount('')).toBe(0);
  });
});
