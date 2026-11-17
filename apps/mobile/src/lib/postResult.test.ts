import { describe, expect, it } from 'vitest';

import { readCreatePostError } from './postResult';

describe('readCreatePostError', () => {
  it('reads no response as a network failure', () => {
    const error = { code: '', message: 'TypeError: Network request failed' };

    expect(readCreatePostError(0, error)).toBe('network');
  });

  it('reads a rejected token as signed out', () => {
    const error = { code: 'PGRST303', message: 'JWT expired' };

    expect(readCreatePostError(401, error)).toBe('not-signed-in');
  });

  it('reads create_post’s not_authenticated as signed out', () => {
    const error = { code: '42501', message: 'not_authenticated' };

    expect(readCreatePostError(403, error)).toBe('not-signed-in');
  });

  it('reads not_onboarded as a missing profile', () => {
    const error = { code: 'P0001', message: 'not_onboarded' };

    expect(readCreatePostError(400, error)).toBe('no-profile');
  });

  it('reads image_not_available as photos that are no longer there', () => {
    const error = { code: 'P0001', message: 'image_not_available' };

    expect(readCreatePostError(400, error)).toBe('photos-unavailable');
  });

  it('reads the body length check as text that is too long', () => {
    const error = {
      code: '23514',
      message: 'new row for relation "posts" violates check constraint "posts_body_length"',
    };

    expect(readCreatePostError(400, error)).toBe('body-too-long');
  });

  it('reads any other check violation as unexpected', () => {
    const error = {
      code: '23514',
      message: 'new row for relation "post_images" violates check constraint "some_other_check"',
    };

    expect(readCreatePostError(400, error)).toBe('unexpected');
  });

  it('reads a bad request from the app as unexpected', () => {
    const error = { code: '22023', message: 'duplicate_image' };

    expect(readCreatePostError(400, error)).toBe('unexpected');
  });

  it('reads a server error as unexpected', () => {
    const error = { code: '', message: 'Internal Server Error' };

    expect(readCreatePostError(500, error)).toBe('unexpected');
  });
});
