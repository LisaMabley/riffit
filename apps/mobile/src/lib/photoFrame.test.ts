import { describe, expect, it } from 'vitest';

import { layoutFullHeight } from './photoFrame';

// A 3:5 frame. The math doesn't depend on the shape the app uses.
const frame = { width: 120, height: 200 };

describe('layoutFullHeight', () => {
  it('fills a frame of the same shape exactly', () => {
    expect(layoutFullHeight({ width: 1200, height: 2000 }, frame)).toEqual({
      width: 120,
      height: 200,
      left: 0,
    });
  });

  it('trims both sides of a normal 3:4 camera photo evenly', () => {
    const layout = layoutFullHeight({ width: 3024, height: 4032 }, frame);

    expect(layout.height).toBe(200);
    expect(layout.width).toBeCloseTo(150);
    expect(layout.left).toBeCloseTo(-15);
  });

  it('shows bars on both sides of a tall mirror-selfie crop', () => {
    const layout = layoutFullHeight({ width: 1000, height: 2000 }, frame);

    expect(layout).toEqual({ width: 100, height: 200, left: 10 });
  });

  it('keeps the full height of a landscape photo and trims most of its width', () => {
    const layout = layoutFullHeight({ width: 4032, height: 3024 }, frame);

    expect(layout.height).toBe(200);
    expect(layout.width).toBeCloseTo(266.67);
    expect(layout.left).toBeCloseTo(-73.33);
  });

  it('rejects a photo with no size', () => {
    expect(() => layoutFullHeight({ width: 0, height: 2000 }, frame)).toThrow();
  });
});
