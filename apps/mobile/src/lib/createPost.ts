import { type PostResult, readCreatePostError } from './postResult';
import { supabase } from './supabase';

// Makes a post from photos that have already uploaded, as the signed-in user. imageIds are in
// display order, so the first is the cover. Alt text comes in #61. Blank text is stored as null.
export async function createPost(body: string, imageIds: string[]): Promise<PostResult> {
  const images = imageIds.map((id) => ({ id }));

  let response;
  try {
    response = await supabase.rpc('create_post', { p_body: body, p_images: images });
  } catch {
    // supabase-js reports most failures as results, but rethrows a timed-out request.
    return { ok: false, failure: 'network' };
  }

  const { data: post, error, status } = response;
  if (error) {
    console.warn(`create_post failed: ${status} ${error.code} ${error.message}`);
    return { ok: false, failure: readCreatePostError(status, error) };
  }
  return { ok: true, postId: post.id };
}
