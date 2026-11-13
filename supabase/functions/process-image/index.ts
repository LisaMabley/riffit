// POST a JPEG as a signed-in user. Makes the versions we store (process.ts), saves them as an
// unattached image (save.ts), and responds with the image's id for create_post(). The upload
// itself is only ever held in memory.
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../packages/supabase/src/database.types.ts';
import { processImage, RejectedImage } from './process.ts';
import { saveImage } from './save.ts';

const admin = createClient<Database>(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response(null, { status: 405 });

  // The owner always comes from the caller's session, never from the request body. The gateway
  // has already checked the JWT's signature, but the anon key is a valid JWT too, so ask Auth
  // which user (if any) the token belongs to.
  const token = request.headers.get('Authorization')?.replace(/^Bearer /, '');
  const { data: { user } } = token ? await admin.auth.getUser(token) : { data: { user: null } };
  if (!user) return Response.json({ error: 'not-signed-in' }, { status: 401 });

  // Images belong to a profile, which a user only has once they've finished onboarding. Check
  // before spending CPU on a photo that couldn't be saved.
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) return Response.json({ error: 'no-profile' }, { status: 403 });

  let versions;
  try {
    versions = await processImage(new Uint8Array(await request.arrayBuffer()));
  } catch (error) {
    if (error instanceof RejectedImage) {
      console.warn(error.message);
      return Response.json({ error: error.reason }, { status: 422 });
    }
    throw error;
  }

  const id = await saveImage(admin, user.id, versions);
  return Response.json({ id }, { status: 201 });
});
