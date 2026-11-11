-- The post-images bucket and who can read its files (spec §9, §16).
begin;
select plan(19);

select tests.create_profile('test_maya');
select tests.create_profile('test_jamie');
select tests.create_post('test_maya', 1);
select tests.create_image('test_maya');
select tests.create_image('test_jamie');

create function pg_temp.posted_image_of(p_identifier text)
returns uuid
language sql
as $$
  select id from public.post_images
  where owner_id = tests.get_user_id(p_identifier) and post_id is not null
$$;

create function pg_temp.unattached_image_of(p_identifier text)
returns uuid
language sql
as $$
  select id from public.post_images
  where owner_id = tests.get_user_id(p_identifier) and post_id is null
$$;

create function pg_temp.folder_of(p_image_id uuid)
returns text
language sql
as $$
  select owner_id || '/' || id || '/' from public.post_images where id = p_image_id
$$;

-- Files as process-image will save them. Run as the superuser, like the service role.
create function pg_temp.add_files(p_image_id uuid)
returns void
language sql
as $$
  insert into storage.objects (bucket_id, name)
  select 'post-images', pg_temp.folder_of(p_image_id) || v || '.jpg'
  from unnest(array['full', 'feed-1024', 'feed-512']) as v
$$;

-- How many of an image's files the current user can read.
create function pg_temp.readable_files(p_image_id uuid)
returns integer
language sql
as $$
  select count(*)::integer from storage.objects
  where bucket_id = 'post-images' and split_part(name, '/', 2) = p_image_id::text
$$;

-- Saved before tests.authenticate_as changes the role, because RLS hides the rows afterward.
create temporary table image_ids as
select
  pg_temp.posted_image_of('test_maya') as maya_posted,
  pg_temp.unattached_image_of('test_maya') as maya_unattached,
  pg_temp.unattached_image_of('test_jamie') as jamie_unattached;
grant select on image_ids to authenticated, anon;

select pg_temp.add_files(maya_posted) from image_ids;
select pg_temp.add_files(maya_unattached) from image_ids;
select pg_temp.add_files(jamie_unattached) from image_ids;

-- A file of Maya's posted image under Jamie's folder, which only a bug could create.
insert into storage.objects (bucket_id, name)
select 'post-images', tests.get_user_id('test_jamie') || '/' || maya_posted || '/full.jpg'
from image_ids;

-- A path whose image folder isn't a uuid.
insert into storage.objects (bucket_id, name)
values ('post-images', tests.get_user_id('test_maya') || '/not-an-image/full.jpg');

-- The bucket ----------------------------------------------------------------

select is(
  (select public from storage.buckets where id = 'post-images'),
  false,
  'the post-images bucket is private'
);

select is(
  (select file_size_limit from storage.buckets where id = 'post-images'),
  8 * 1024 * 1024::bigint,
  'the post-images bucket allows files up to 8MiB'
);

select is(
  (select allowed_mime_types from storage.buckets where id = 'post-images'),
  array['image/jpeg'],
  'the post-images bucket only accepts JPEG'
);

-- Reading -------------------------------------------------------------------

select tests.authenticate_as('test_jamie');

select is(
  (select pg_temp.readable_files(maya_posted) from image_ids),
  3,
  'signed-in users can read every version of an image on someone else''s post'
);

select is(
  (select pg_temp.readable_files(maya_unattached) from image_ids),
  0,
  'users cannot read the files of someone else''s image before it is on a post'
);

select is(
  (select pg_temp.readable_files(jamie_unattached) from image_ids),
  3,
  'owners can read the files of their own image before it is on a post'
);

select is_empty(
  $$ select name from storage.objects
     where name like tests.get_user_id('test_jamie') || '/' ||
       (select maya_posted from image_ids) || '/%' $$,
  'a file under the wrong owner''s folder is not readable, even for a visible image'
);

select lives_ok(
  $$ select count(*) from storage.objects where bucket_id = 'post-images' $$,
  'a path that is not an image id does not break reading the bucket'
);

select tests.authenticate_as('test_maya');

select is(
  (select pg_temp.readable_files(maya_unattached) from image_ids),
  3,
  'the owner can read their image before it is on a post'
);

select lives_ok(
  $$ select public.create_post(null, jsonb_build_array(
       jsonb_build_object('id', (select maya_unattached from image_ids)))) $$,
  'the owner puts the image on a post'
);

select tests.authenticate_as('test_jamie');

select is(
  (select pg_temp.readable_files(maya_unattached) from image_ids),
  3,
  'other users can read an image''s files once it is on a post'
);

select tests.authenticate_as_anon();

select is_empty(
  $$ select name from storage.objects where bucket_id = 'post-images' $$,
  'signed-out visitors cannot read any files'
);

select tests.authenticate_without_user();

-- Such a token can read posts (posts' policy is `using (true)`), so it can read their files, but
-- it owns no images.
select is(
  (select pg_temp.readable_files(jamie_unattached) from image_ids),
  0,
  'a token without a user cannot read anyone''s images before they are on a post'
);

-- Writing -------------------------------------------------------------------

select tests.authenticate_as('test_maya');

select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     select 'post-images', pg_temp.folder_of(maya_posted) || 'extra.jpg' from image_ids $$,
  '42501',
  null,
  'owners cannot upload files directly'
);

update storage.objects set name = name || '.moved'
where bucket_id = 'post-images' and name like tests.get_user_id('test_maya') || '/%';

-- The Storage API sets this before deleting. Setting it here gets past storage's own guard
-- against SQL deletes, so this checks the policies.
select set_config('storage.allow_delete_query', 'true', true);
delete from storage.objects where bucket_id = 'post-images';

select tests.authenticate_as_anon();

select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('post-images', 'anon/anon/full.jpg') $$,
  '42501',
  null,
  'signed-out visitors cannot upload files'
);

select tests.as_superuser();

select is(
  (select count(*)::integer from storage.objects
   where bucket_id = 'post-images' and name like '%.moved'),
  0,
  'owners cannot rename their files'
);

select is(
  (select count(*)::integer from storage.objects where bucket_id = 'post-images'),
  11,
  'users cannot delete files, even with the Storage API''s delete setting'
);

-- Deleting a post -----------------------------------------------------------

select tests.authenticate_as('test_maya');
delete from public.posts where author_id = tests.get_user_id('test_maya');

select is(
  (select pg_temp.readable_files(maya_posted) + pg_temp.readable_files(maya_unattached)
   from image_ids),
  0,
  'once a post is deleted, nobody can read its files, not even the owner'
);

select tests.as_superuser();

select is(
  (select count(*)::integer from storage.objects where bucket_id = 'post-images'),
  11,
  'deleting a post leaves its files for cleanup (#45)'
);

select * from finish();
rollback;
