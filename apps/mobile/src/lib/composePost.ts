import { characterCount, POST_BODY_MAX } from '@riffit/core';

import type { PickedPhoto } from './pickedPhotos';

// Why the Post button is off. Each one has a line of copy that says what to do about it.
export type PostBlocker = 'no-photos' | 'photo-failed' | 'photos-uploading' | 'body-too-long';

export function whyPostIsBlocked(photos: PickedPhoto[], body: string): PostBlocker | null {
  if (photos.length === 0) {
    return 'no-photos';
  }

  // A failed photo comes first: it needs the person to act, while uploads finish on their own.
  const hasFailedPhoto = photos.some((photo) => photo.status.kind === 'failed');
  if (hasFailedPhoto) {
    return 'photo-failed';
  }

  const allUploaded = photos.every((photo) => photo.status.kind === 'done');
  if (!allUploaded) {
    return 'photos-uploading';
  }

  if (characterCount(body) > POST_BODY_MAX) {
    return 'body-too-long';
  }
  return null;
}

// The uploaded photos' image ids, in display order. Photos still uploading or failed are left out,
// but Post is only on when there are none.
export function uploadedImageIds(photos: PickedPhoto[]): string[] {
  const imageIds: string[] = [];
  for (const photo of photos) {
    if (photo.status.kind === 'done') {
      imageIds.push(photo.status.imageId);
    }
  }
  return imageIds;
}

// The count under the text only shows near the limit, so most posts never see it.
const SHOW_COUNT_WITHIN = 200;

export type BodyCount =
  { kind: 'hidden' } | { kind: 'remaining'; remaining: number } | { kind: 'over'; over: number };

export function describeBodyCount(body: string): BodyCount {
  const remaining = POST_BODY_MAX - characterCount(body);
  if (remaining < 0) {
    return { kind: 'over', over: -remaining };
  }
  if (remaining <= SHOW_COUNT_WITHIN) {
    return { kind: 'remaining', remaining };
  }
  return { kind: 'hidden' };
}
