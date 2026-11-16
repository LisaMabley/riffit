import { POST_IMAGES_MAX } from '@riffit/core';

import type { UploadFailure } from './uploadResponse';

// Why a picked photo has no image id: an upload failure, or 'unreadable' when the phone couldn't
// open or convert the photo before uploading it.
export type PhotoFailure = UploadFailure | 'unreadable';

export type PhotoStatus =
  | { kind: 'preparing' }
  | { kind: 'uploading' }
  | { kind: 'done'; imageId: string }
  | { kind: 'failed'; failure: PhotoFailure };

export type PickedPhoto = {
  // Identifies the photo while it's on screen. The picker's own asset id can be missing, and the
  // same photo can be picked twice.
  key: string;
  sourceUri: string;
  status: PhotoStatus;
};

export type PickedPhotosAction =
  | { type: 'added'; photos: PickedPhoto[] }
  | { type: 'statusChanged'; key: string; status: PhotoStatus }
  | { type: 'removed'; key: string };

export function pickedPhotosReducer(
  photos: PickedPhoto[],
  action: PickedPhotosAction,
): PickedPhoto[] {
  switch (action.type) {
    case 'added':
      return [...photos, ...action.photos];

    // A photo removed while it was still uploading gets no update, so its upload finishing late
    // can't bring it back. The unused image is cleaned up on the server later (#45).
    case 'statusChanged':
      return photos.map((photo) => {
        if (photo.key !== action.key) {
          return photo;
        }
        return { ...photo, status: action.status };
      });

    case 'removed':
      return photos.filter((photo) => photo.key !== action.key);
  }
}

export function remainingPhotoSlots(photos: PickedPhoto[]): number {
  return Math.max(POST_IMAGES_MAX - photos.length, 0);
}
