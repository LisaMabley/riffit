import { describe, expect, it } from 'vitest';

import { readUploadResponse } from './uploadResponse';

const imageId = '8d7f4c2e-3b1a-4f6e-9c5d-2a1b0e9f8c7d';

describe('readUploadResponse', () => {
  it('returns the image id from a created response', () => {
    expect(readUploadResponse(201, { id: imageId })).toEqual({ ok: true, imageId });
  });

  it('treats a created response without a valid id as unexpected', () => {
    expect(readUploadResponse(201, { id: 'not-a-uuid' })).toEqual({
      ok: false,
      failure: 'unexpected',
    });
    expect(readUploadResponse(201, null)).toEqual({ ok: false, failure: 'unexpected' });
  });

  it.each([
    [401, 'not-signed-in'],
    [403, 'no-profile'],
    [422, 'too-large'],
    [422, 'not-jpeg'],
    [422, 'corrupt'],
  ] as const)('reads a %i with %s', (status, failure) => {
    expect(readUploadResponse(status, { error: failure })).toEqual({ ok: false, failure });
  });

  it("treats the gateway's own 401 as not signed in", () => {
    expect(readUploadResponse(401, { msg: 'Invalid JWT' })).toEqual({
      ok: false,
      failure: 'not-signed-in',
    });
    expect(readUploadResponse(401, null)).toEqual({ ok: false, failure: 'not-signed-in' });
  });

  it('treats a server error as unexpected', () => {
    expect(readUploadResponse(500, null)).toEqual({ ok: false, failure: 'unexpected' });
  });

  it('treats an error code it does not know as unexpected', () => {
    expect(readUploadResponse(422, { error: 'too-blurry' })).toEqual({
      ok: false,
      failure: 'unexpected',
    });
  });

  it('only reports success for a 201', () => {
    expect(readUploadResponse(200, { id: imageId })).toEqual({ ok: false, failure: 'unexpected' });
  });
});
