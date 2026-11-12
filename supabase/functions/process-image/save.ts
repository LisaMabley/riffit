// Saves an image's processed versions to the post-images bucket and records it as an unattached
// post_images row, which create_post() claims later. Runs with the service role, which bypasses
// RLS, so the caller must pass an owner id taken from a verified session.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../packages/supabase/src/database.types.ts';
import type { ImageVersion } from './process.ts';

export const BUCKET = 'post-images';

// Matches the path the bucket's read policy expects (see the post_images_bucket migration).
export function versionPath(ownerId: string, imageId: string, name: ImageVersion['name']): string {
  return `${ownerId}/${imageId}/${name}.jpg`;
}

// Returns the new image's id. The row is inserted last, so it only exists once all its files do.
// If anything fails, the files saved so far are removed before the error is rethrown.
export async function saveImage(
  admin: SupabaseClient<Database>,
  ownerId: string,
  versions: ImageVersion[],
): Promise<string> {
  const full = versions.find((version) => version.name === 'full');
  if (!full) throw new Error('missing the full version');

  const id = crypto.randomUUID();
  const paths = versions.map((version) => versionPath(ownerId, id, version.name));
  const bucket = admin.storage.from(BUCKET);

  try {
    // allSettled rather than all, so cleanup doesn't start while an upload is still running.
    const uploads = await Promise.allSettled(
      versions.map((version, i) =>
        bucket.upload(paths[i], version.data, { contentType: 'image/jpeg' })
      ),
    );
    for (const upload of uploads) {
      if (upload.status === 'rejected') throw upload.reason;
      if (upload.value.error) throw upload.value.error;
    }

    const { error } = await admin
      .from('post_images')
      .insert({ id, owner_id: ownerId, width: full.width, height: full.height });
    if (error) throw error;
    return id;
  } catch (error) {
    // Removing a path that was never uploaded is not an error.
    const { error: cleanupError } = await bucket.remove(paths);
    if (cleanupError) console.error(`couldn't remove ${paths.join(', ')}:`, cleanupError);
    throw error;
  }
}
