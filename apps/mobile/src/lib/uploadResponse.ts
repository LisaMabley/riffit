import { z } from 'zod';

// Why an upload didn't produce an image. The first five are the process-image function's own
// error codes (see supabase/functions/process-image). The last two come from outside it:
// - 'network': the request never got a response, so retrying may work.
// - 'unexpected': any other response, such as a server error.
export type UploadFailure =
  'not-signed-in' | 'no-profile' | 'too-large' | 'not-jpeg' | 'corrupt' | 'network' | 'unexpected';

export type UploadResult = { ok: true; imageId: string } | { ok: false; failure: UploadFailure };

const createdImageSchema = z.object({ id: z.uuid() });

const functionErrorSchema = z.object({
  error: z.enum(['not-signed-in', 'no-profile', 'too-large', 'not-jpeg', 'corrupt']),
});

// Turns process-image's response into an UploadResult. `body` is the parsed JSON, or null when
// the response had none or it wasn't JSON.
export function readUploadResponse(status: number, body: unknown): UploadResult {
  if (status === 201) {
    const created = createdImageSchema.safeParse(body);
    if (!created.success) {
      return { ok: false, failure: 'unexpected' };
    }
    return { ok: true, imageId: created.data.id };
  }

  // The gateway in front of the function rejects an expired or invalid token with a 401 of its
  // own, which has a different body. Either way, the user needs to sign in again.
  if (status === 401) {
    return { ok: false, failure: 'not-signed-in' };
  }

  const functionError = functionErrorSchema.safeParse(body);
  if (!functionError.success) {
    return { ok: false, failure: 'unexpected' };
  }
  return { ok: false, failure: functionError.data.error };
}
