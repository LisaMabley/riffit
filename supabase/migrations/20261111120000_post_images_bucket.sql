-- Private storage for the processed post images (spec §9, §16).
--
-- Each image's versions live at <owner id>/<image id>/<version>.jpg, where the version is
-- `full`, `feed-1024`, or `feed-512`. Only process-image writes here, with the service role
-- (which bypasses RLS), so there are no insert, update, or delete policies.
--
-- The bucket is private because files in a public bucket can be fetched by URL by anyone,
-- including blocked users and signed-out visitors. The app reads files through signed URLs, and
-- signing one needs the select policy below.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  false,
  -- Matches process-image's MAX_INPUT_BYTES. Its output is re-encoded at no more than 2048px, so
  -- real photos stay far below this; the limit only catches a bug, like storing the raw upload.
  8 * 1024 * 1024,
  array['image/jpeg']
);

-- A file is readable exactly when its post_images row is. The subquery runs under the caller's
-- RLS on post_images, so the owner sees an image before it's on a post, everyone signed in sees
-- it once it is, and later rules that hide posts (blocks, #12; reports, #13) hide the files too.
-- When a post is deleted its image rows go with it, so its files become unreadable at once, even
-- before they're cleaned up (#45).
--
-- The path's owner folder must match the row's owner. A path whose image folder isn't a uuid
-- matches nothing; the case expression keeps the cast from failing the whole query.
create policy "Users can read the files of images they can see"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'post-images'
    and exists (
      select 1 from public.post_images i
      where i.id = case
          when (storage.foldername(name))[2]
            ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          then ((storage.foldername(name))[2])::uuid
        end
        and i.owner_id::text = (storage.foldername(name))[1]
    )
  );
