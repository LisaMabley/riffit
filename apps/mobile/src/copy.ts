import { POST_BODY_MAX } from '@riffit/core';

import type { PostBlocker } from './lib/composePost';
import type { PhotoFailure } from './lib/pickedPhotos';
import type { PostFailure } from './lib/postResult';

// The app's user-facing text, kept in one place so it's easy to review and reword, and so a
// translation library can replace it later without a hunt through every screen. Drafts and the
// voice they follow live in docs/voice-and-community.md. Placeholder screens and dev tools aren't
// included: they'll be gone before release.

// Failures that can happen to a photo upload or to posting, with the same fix either way.
const networkFailure = "Couldn't reach Riffit. Check your connection and try again.";
const signedOut = "You've been signed out. Sign in again to keep going.";
const noProfile = 'Finish setting up your profile, then come back to this.';
const unexpectedFailure = 'Something went sideways on our end. Try again in a bit.';

// The server's three rejections all mean "this file," and the fix is the same, so they share one
// message. The specific reason goes to the logs.
const photoRejected = "This photo didn't make it through. Try a different one?";

const photoFailures: Record<PhotoFailure, string> = {
  unreadable: "This photo wouldn't open. Try a different one?",
  network: networkFailure,
  'not-signed-in': signedOut,
  'no-profile': noProfile,
  'too-large': photoRejected,
  'not-jpeg': photoRejected,
  corrupt: photoRejected,
  unexpected: unexpectedFailure,
};

const postFailures: Record<PostFailure, string> = {
  'photos-unavailable':
    'Some of these photos expired before posting. Remove them and add them again.',
  'body-too-long': `That's a bit long. Trim it to ${POST_BODY_MAX.toLocaleString('en-US')} characters and try again.`,
  network: networkFailure,
  'not-signed-in': signedOut,
  'no-profile': noProfile,
  unexpected: unexpectedFailure,
};

// Shown under the Post button while it's off.
const postBlockers: Record<PostBlocker, string> = {
  'no-photos': 'Add at least one photo to post.',
  'photo-failed': "One photo didn't make it. Try it again or remove it.",
  'photos-uploading': 'Hang tight, your photos are still uploading.',
  'body-too-long': 'Trim the text a little to post.',
};

export const newPostCopy = {
  addPhotos: 'Add photos',
  photoLimitReached: "That's six. Plenty of look to work with.",
  preparing: 'Getting it ready…',
  uploading: 'Uploading…',
  ready: 'ready',
  tryAgain: 'Try again',
  photoFailures,

  // The first photo is the one the feed shows (spec §9).
  cover: 'Cover',
  coverHint: "The first photo is your cover. It's the one the feed sees first.",

  // For screen readers, e.g. "Photo 2 of 4, ready" or "Photo 1 of 4, cover, ready".
  photoLabel(position: number, total: number, status: string): string {
    if (position === 1) {
      return `Photo 1 of ${total}, cover, ${status}`;
    }
    return `Photo ${position} of ${total}, ${status}`;
  },
  removePhoto(position: number): string {
    return `Remove photo ${position}`;
  },

  // Labels for the arrow buttons, which screen readers read without the photo in context.
  movePhotoEarlier(position: number): string {
    return `Move photo ${position} earlier`;
  },
  movePhotoLater(position: number): string {
    return `Move photo ${position} later`;
  },
  // VoiceOver actions on the photo itself, where the photo is already in context.
  moveEarlierAction: 'Move earlier',
  moveLaterAction: 'Move later',
  // Announced after a move.
  movedTo(position: number, total: number): string {
    return `Now photo ${position} of ${total}`;
  },

  bodyPlaceholder: 'Say something about the look, or let it speak for itself.',
  bodyLabel: 'Post text, optional',
  // Only shown near the limit.
  charactersLeft(remaining: number): string {
    const characters = remaining === 1 ? 'character' : 'characters';
    return `${remaining.toLocaleString('en-US')} ${characters} left`;
  },
  charactersOver(over: number): string {
    return `${over.toLocaleString('en-US')} over. Trim a little?`;
  },

  post: 'Post',
  posting: 'Posting…',
  posted: 'Posted. The world is now slightly better dressed.',
  postBlockers,
  postFailures,
};
