import { POST_IMAGES_MAX } from '@riffit/core';
import { describe, expect, it } from 'vitest';

import { type PickedPhoto, pickedPhotosReducer, remainingPhotoSlots } from './pickedPhotos';

function preparingPhoto(key: string): PickedPhoto {
  return { key, sourceUri: `file:///picked/${key}.heic`, status: { kind: 'preparing' } };
}

describe('pickedPhotosReducer', () => {
  it('adds new photos after the ones already picked', () => {
    const existing = [preparingPhoto('a')];
    const added = [preparingPhoto('b'), preparingPhoto('c')];

    const photos = pickedPhotosReducer(existing, { type: 'added', photos: added });

    expect(photos.map((photo) => photo.key)).toEqual(['a', 'b', 'c']);
  });

  it('changes the status of only the matching photo', () => {
    const existing = [preparingPhoto('a'), preparingPhoto('b')];
    const done = { kind: 'done', imageId: 'image-b' } as const;

    const photos = pickedPhotosReducer(existing, { type: 'statusChanged', key: 'b', status: done });

    expect(photos[0]?.status).toEqual({ kind: 'preparing' });
    expect(photos[1]?.status).toEqual(done);
  });

  it('removes a photo', () => {
    const existing = [preparingPhoto('a'), preparingPhoto('b')];

    const photos = pickedPhotosReducer(existing, { type: 'removed', key: 'a' });

    expect(photos.map((photo) => photo.key)).toEqual(['b']);
  });

  it('ignores a status change for a photo that was removed', () => {
    const afterRemoval = pickedPhotosReducer([preparingPhoto('a')], { type: 'removed', key: 'a' });

    const photos = pickedPhotosReducer(afterRemoval, {
      type: 'statusChanged',
      key: 'a',
      status: { kind: 'done', imageId: 'image-a' },
    });

    expect(photos).toEqual([]);
  });
});

describe('remainingPhotoSlots', () => {
  it('allows the full limit when nothing is picked', () => {
    expect(remainingPhotoSlots([])).toBe(POST_IMAGES_MAX);
  });

  it('counts down as photos are picked', () => {
    expect(remainingPhotoSlots([preparingPhoto('a'), preparingPhoto('b')])).toBe(
      POST_IMAGES_MAX - 2,
    );
  });

  it('never goes below zero', () => {
    const tooMany = Array.from({ length: POST_IMAGES_MAX + 1 }, (_, index) =>
      preparingPhoto(String(index)),
    );
    expect(remainingPhotoSlots(tooMany)).toBe(0);
  });
});
