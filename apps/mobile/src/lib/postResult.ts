// Why create_post() didn't make a post. 'photos-unavailable' covers an image that was cleaned up
// after sitting unposted (#45), or is somehow already on a post. The rest mirror UploadFailure.
export type PostFailure =
  | 'not-signed-in'
  | 'no-profile'
  | 'photos-unavailable'
  | 'body-too-long'
  | 'network'
  | 'unexpected';

export type PostResult = { ok: true; postId: string } | { ok: false; failure: PostFailure };

// The parts of supabase-js's error that tell failures apart. For create_post's own exceptions,
// the message is the exception's name, such as 'not_onboarded'.
export type RpcError = {
  code: string;
  message: string;
};

const CHECK_VIOLATION = '23514';
const INSUFFICIENT_PRIVILEGE = '42501';

// Turns create_post()'s error into a PostFailure. `status` is the HTTP status, which supabase-js
// sets to 0 when no response arrived.
export function readCreatePostError(status: number, error: RpcError): PostFailure {
  if (status === 0) {
    return 'network';
  }

  // Without a valid session the request runs as anon, which can't call create_post at all. A
  // session with no user id gets create_post's own not_authenticated, which has the same code.
  const isSignedOut = status === 401 || error.code === INSUFFICIENT_PRIVILEGE;
  if (isSignedOut) {
    return 'not-signed-in';
  }

  if (error.message === 'not_onboarded') {
    return 'no-profile';
  }
  if (error.message === 'image_not_available') {
    return 'photos-unavailable';
  }

  const isBodyTooLong =
    error.code === CHECK_VIOLATION && error.message.includes('posts_body_length');
  if (isBodyTooLong) {
    return 'body-too-long';
  }

  // The rest, such as invalid_images or duplicate_image, mean the app sent something wrong.
  return 'unexpected';
}
