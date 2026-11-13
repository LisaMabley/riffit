import { PHOTO_MAX_LONG_SIDE } from '@riffit/core';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { fitWithinLongSide } from './photoSize';

// The server re-encodes every upload (spec §9), so this only needs to be high enough that the
// second encode doesn't show artifacts from the first.
const UPLOAD_JPEG_QUALITY = 0.9;

export type PreparedPhoto = {
  uri: string;
  width: number;
  height: number;
};

// Shrinks a picked photo to fit PHOTO_MAX_LONG_SIDE and saves it as a JPEG in the cache directory,
// ready to upload. Every photo is re-saved, even one that already fits, so HEIC and PNG come out
// as JPEG too.
export async function preparePhoto(sourceUri: string): Promise<PreparedPhoto> {
  // Measure the decoded image rather than trusting the picker's width and height, so the size is
  // taken after the photo's orientation is applied and a portrait photo can't come out sideways.
  const original = await ImageManipulator.manipulate(sourceUri).renderAsync();
  const targetSize = fitWithinLongSide(original, PHOTO_MAX_LONG_SIDE);

  const resized = await ImageManipulator.manipulate(original).resize(targetSize).renderAsync();
  const saved = await resized.saveAsync({
    format: SaveFormat.JPEG,
    compress: UPLOAD_JPEG_QUALITY,
  });

  // The decoded images hold native memory until released, and a post can have six photos.
  original.release();
  resized.release();

  return { uri: saved.uri, width: saved.width, height: saved.height };
}
