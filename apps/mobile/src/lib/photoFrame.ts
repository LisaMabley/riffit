import type { PhotoSize } from './photoSize';

// Photo previews share one tall frame, width to height, so a look always shows head to shoes.
// Trying 3:5 for now. The feed's shape is still open, and the post view never crops (spec §9).
export const PHOTO_FRAME_ASPECT = 3 / 5;

export type FramedPhotoLayout = {
  width: number;
  height: number;
  // From the frame's left edge. Negative when the photo is wider than the frame and its sides are
  // trimmed; positive when it's narrower and shows bars on both sides.
  left: number;
};

// Where to draw a photo inside a frame so its full height shows, centered from side to side. The
// frame clips anything that sticks out.
export function layoutFullHeight(photo: PhotoSize, frame: PhotoSize): FramedPhotoLayout {
  const isValidSize = photo.width > 0 && photo.height > 0;
  if (!isValidSize) {
    throw new Error(`Photo size must be positive, got ${photo.width}x${photo.height}`);
  }

  const photoAspect = photo.width / photo.height;
  const width = frame.height * photoAspect;
  const left = (frame.width - width) / 2;
  return { width, height: frame.height, left };
}
