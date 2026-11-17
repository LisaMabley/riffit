import { POST_BODY_MAX } from '@riffit/core';
import { describe, expect, it } from 'vitest';

import { describeBodyCount, uploadedImageIds, whyPostIsBlocked } from './composePost';
import type { PhotoStatus, PickedPhoto } from './pickedPhotos';

function photoWith(key: string, status: PhotoStatus): PickedPhoto {
  return { key, sourceUri: `file:///picked/${key}.heic`, status };
}

function uploadedPhoto(key: string): PickedPhoto {
  return photoWith(key, { kind: 'done', imageId: `image-${key}` });
}

describe('whyPostIsBlocked', () => {
  it('blocks a post with no photos', () => {
    expect(whyPostIsBlocked([], 'Just words')).toBe('no-photos');
  });

  it('blocks while a photo is still uploading', () => {
    const photos = [uploadedPhoto('a'), photoWith('b', { kind: 'uploading' })];

    expect(whyPostIsBlocked(photos, '')).toBe('photos-uploading');
  });

  it('blocks while a photo is still being prepared', () => {
    const photos = [photoWith('a', { kind: 'preparing' })];

    expect(whyPostIsBlocked(photos, '')).toBe('photos-uploading');
  });

  it('reports a failed photo ahead of one still uploading', () => {
    const photos = [
      photoWith('a', { kind: 'uploading' }),
      photoWith('b', { kind: 'failed', failure: 'network' }),
    ];

    expect(whyPostIsBlocked(photos, '')).toBe('photo-failed');
  });

  it('blocks text over the limit', () => {
    const tooLong = 'x'.repeat(POST_BODY_MAX + 1);

    expect(whyPostIsBlocked([uploadedPhoto('a')], tooLong)).toBe('body-too-long');
  });

  it('allows text right at the limit', () => {
    const atLimit = 'x'.repeat(POST_BODY_MAX);

    expect(whyPostIsBlocked([uploadedPhoto('a')], atLimit)).toBeNull();
  });

  it('allows uploaded photos with no text', () => {
    expect(whyPostIsBlocked([uploadedPhoto('a'), uploadedPhoto('b')], '')).toBeNull();
  });
});

describe('uploadedImageIds', () => {
  it('lists image ids in display order', () => {
    const photos = [uploadedPhoto('b'), uploadedPhoto('a')];

    expect(uploadedImageIds(photos)).toEqual(['image-b', 'image-a']);
  });

  it('leaves out photos without an image id', () => {
    const photos = [uploadedPhoto('a'), photoWith('b', { kind: 'uploading' })];

    expect(uploadedImageIds(photos)).toEqual(['image-a']);
  });
});

describe('describeBodyCount', () => {
  it('hides the count for short text', () => {
    expect(describeBodyCount('A good coat')).toEqual({ kind: 'hidden' });
  });

  it('shows what is left near the limit', () => {
    const nearLimit = 'x'.repeat(POST_BODY_MAX - 120);

    expect(describeBodyCount(nearLimit)).toEqual({ kind: 'remaining', remaining: 120 });
  });

  it('shows zero left right at the limit', () => {
    expect(describeBodyCount('x'.repeat(POST_BODY_MAX))).toEqual({
      kind: 'remaining',
      remaining: 0,
    });
  });

  it('shows how far over the limit the text is', () => {
    const overLimit = 'x'.repeat(POST_BODY_MAX + 15);

    expect(describeBodyCount(overLimit)).toEqual({ kind: 'over', over: 15 });
  });
});
