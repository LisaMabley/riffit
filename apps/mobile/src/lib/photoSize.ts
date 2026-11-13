export type PhotoSize = {
  width: number;
  height: number;
};

// The size to shrink a photo to so its long side fits within maxLongSide, keeping its proportions.
// Photos that already fit keep their size: enlarging adds bytes without adding detail.
export function fitWithinLongSide(photo: PhotoSize, maxLongSide: number): PhotoSize {
  const isValidSize = photo.width > 0 && photo.height > 0;
  if (!isValidSize) {
    throw new Error(`Photo size must be positive, got ${photo.width}x${photo.height}`);
  }

  const longSide = Math.max(photo.width, photo.height);
  if (longSide <= maxLongSide) {
    return { width: photo.width, height: photo.height };
  }

  const scale = maxLongSide / longSide;
  // Rounding keeps the short side as close to the original proportions as whole pixels allow.
  // The long side is set exactly, so rounding can never push it over the limit.
  const shortSide = Math.max(1, Math.round(Math.min(photo.width, photo.height) * scale));

  const isPortrait = photo.height > photo.width;
  if (isPortrait) {
    return { width: shortSide, height: maxLongSide };
  }
  return { width: maxLongSide, height: shortSide };
}
