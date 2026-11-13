import type { PreparedPhoto } from './preparePhoto';
import { supabase, supabasePublishableKey, supabaseUrl } from './supabase';
import { readUploadResponse, type UploadResult } from './uploadResponse';

const PROCESS_IMAGE_URL = `${supabaseUrl}/functions/v1/process-image`;

// Sends a prepared photo to the process-image function as the signed-in user. The result is the
// new image's id, which create_post() takes, or the reason it failed.
//
// This calls fetch directly rather than supabase.functions.invoke so the response can go through
// readUploadResponse as is: invoke wraps error responses, and without a session it quietly sends
// the publishable key instead of a user token.
export async function uploadPhoto(photo: PreparedPhoto): Promise<UploadResult> {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) {
    return { ok: false, failure: 'not-signed-in' };
  }

  // React Native's fetch reads local files, and sends an ArrayBuffer body as raw bytes. This is
  // the approach Supabase's Expo guide uses for uploads, and it needs no extra library.
  const photoFile = await fetch(photo.uri);
  const photoBytes = await photoFile.arrayBuffer();

  let response: Response;
  try {
    response = await fetch(PROCESS_IMAGE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: supabasePublishableKey,
        'Content-Type': 'image/jpeg',
      },
      body: photoBytes,
    });
  } catch {
    // fetch only rejects when no response arrived: offline, timed out, or the server unreachable.
    return { ok: false, failure: 'network' };
  }

  const body = await readJsonBody(response);
  return readUploadResponse(response.status, body);
}

// The gateway and server errors don't always send JSON, so a body that isn't JSON reads as null.
async function readJsonBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
