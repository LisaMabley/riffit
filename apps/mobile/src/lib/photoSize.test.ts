import { PHOTO_MAX_LONG_SIDE } from '@riffit/core';
import { describe, expect, it } from 'vitest';

import { fitWithinLongSide } from './photoSize';

describe('fitWithinLongSide', () => {
  it('shrinks a landscape photo to the limit on its width', () => {
    expect(fitWithinLongSide({ width: 4032, height: 3024 }, PHOTO_MAX_LONG_SIDE)).toEqual({
      width: 2048,
      height: 1536,
    });
  });

  it('shrinks a portrait photo to the limit on its height', () => {
    expect(fitWithinLongSide({ width: 3024, height: 4032 }, PHOTO_MAX_LONG_SIDE)).toEqual({
      width: 1536,
      height: 2048,
    });
  });

  it('shrinks a square photo on both sides', () => {
    expect(fitWithinLongSide({ width: 3000, height: 3000 }, PHOTO_MAX_LONG_SIDE)).toEqual({
      width: 2048,
      height: 2048,
    });
  });

  it('keeps the proportions of a tall mirror-selfie crop', () => {
    const tallCrop = { width: 1179, height: 3400 };

    const resized = fitWithinLongSide(tallCrop, PHOTO_MAX_LONG_SIDE);

    expect(resized).toEqual({ width: 710, height: 2048 });
    expect(resized.width / resized.height).toBeCloseTo(tallCrop.width / tallCrop.height, 2);
  });

  it('never makes the short side zero', () => {
    expect(fitWithinLongSide({ width: 10, height: 5000 }, PHOTO_MAX_LONG_SIDE)).toEqual({
      width: 4,
      height: 2048,
    });
    expect(fitWithinLongSide({ width: 1, height: 5000 }, PHOTO_MAX_LONG_SIDE)).toEqual({
      width: 1,
      height: 2048,
    });
  });

  it('leaves a photo exactly at the limit alone', () => {
    expect(fitWithinLongSide({ width: 2048, height: 1365 }, PHOTO_MAX_LONG_SIDE)).toEqual({
      width: 2048,
      height: 1365,
    });
  });

  it('never enlarges a small photo', () => {
    expect(fitWithinLongSide({ width: 800, height: 1200 }, PHOTO_MAX_LONG_SIDE)).toEqual({
      width: 800,
      height: 1200,
    });
  });

  it('rejects a size with no pixels', () => {
    expect(() => fitWithinLongSide({ width: 0, height: 1200 }, PHOTO_MAX_LONG_SIDE)).toThrow(
      'Photo size must be positive, got 0x1200',
    );
  });
});
