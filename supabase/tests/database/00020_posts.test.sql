begin;
select plan(47);

select tests.create_profile('test_maya');
select tests.create_profile('test_jamie');
select tests.create_post('test_maya', 2);
select tests.create_image('test_maya');
select tests.create_image('test_jamie');

create function pg_temp.post_of(p_identifier text)
returns uuid
language sql
as $$ select id from public.posts where author_id = tests.get_user_id(p_identifier) $$;

create function pg_temp.unattached_image_of(p_identifier text)
returns uuid
language sql
as $$
  select id from public.post_images
  where owner_id = tests.get_user_id(p_identifier) and post_id is null
$$;

-- Grants --------------------------------------------------------------------

select table_privs_are('public', 'posts', 'anon', array[]::text[], 'anon has no privileges on posts');
select table_privs_are(
  'public', 'post_images', 'anon', array[]::text[], 'anon has no privileges on post_images'
);
select table_privs_are(
  'public', 'posts', 'authenticated', array['SELECT', 'DELETE'],
  'authenticated can only select and delete posts at the table level'
);
select table_privs_are(
  'public', 'post_images', 'authenticated', array['SELECT'],
  'authenticated can only select post_images at the table level'
);
select column_privs_are(
  'public', 'posts', 'body', 'authenticated', array['SELECT', 'UPDATE'],
  'authenticated can update a post''s body'
);
select column_privs_are(
  'public', 'posts', 'author_id', 'authenticated', array['SELECT'],
  'authenticated cannot update a post''s author'
);
select column_privs_are(
  'public', 'post_images', 'alt_text', 'authenticated', array['SELECT', 'UPDATE'],
  'authenticated can update alt text'
);
select column_privs_are(
  'public', 'post_images', 'post_id', 'authenticated', array['SELECT'],
  'authenticated cannot move an image to another post'
);
select column_privs_are(
  'public', 'post_images', 'position', 'authenticated', array['SELECT'],
  'authenticated cannot reorder images'
);

-- Reading -------------------------------------------------------------------

select tests.authenticate_as('test_jamie');

select is(
  (select count(*)::integer from public.posts where id = pg_temp.post_of('test_maya')),
  1,
  'signed-in users can read other people''s posts'
);

select is(
  (select count(*)::integer from public.post_images where post_id = pg_temp.post_of('test_maya')),
  2,
  'signed-in users can read the images on other people''s posts'
);

select is(
  (select count(*)::integer from public.post_images
   where owner_id = tests.get_user_id('test_maya') and post_id is null),
  0,
  'users cannot read someone else''s image before it is on a post'
);

select tests.authenticate_as('test_maya');

select is(
  (select count(*)::integer from public.post_images where id = pg_temp.unattached_image_of('test_maya')),
  1,
  'owners can read their own image before it is on a post'
);

select tests.authenticate_as_anon();

select throws_ok($$ select * from public.posts $$, '42501', null, 'anon cannot read posts');
select throws_ok($$ select * from public.post_images $$, '42501', null, 'anon cannot read images');

-- Writing -------------------------------------------------------------------

select tests.authenticate_as('test_maya');

select lives_ok(
  $$ update public.posts set body = 'Thrifted the whole thing.' where author_id = auth.uid() $$,
  'authors can update their post''s body'
);

select is(
  (select body from public.posts where author_id = auth.uid()),
  'Thrifted the whole thing.',
  'the body update is saved'
);

select lives_ok(
  $$ update public.post_images set alt_text = 'A green corduroy jacket' where owner_id = auth.uid() $$,
  'owners can update their images'' alt text'
);

select is(
  (select count(*)::integer from public.post_images
   where owner_id = auth.uid() and alt_text = 'A green corduroy jacket'),
  3,
  'the alt text update is saved'
);

select throws_ok(
  $$ update public.posts set author_id = tests.get_user_id('test_jamie') where author_id = auth.uid() $$,
  '42501', null,
  'a post''s author cannot be changed'
);

select throws_ok(
  $$ update public.posts set created_at = now() where author_id = auth.uid() $$,
  '42501', null,
  'a post''s created_at cannot be changed'
);

select throws_ok(
  $$ update public.posts set updated_at = '2000-01-01' where author_id = auth.uid() $$,
  '42501', null,
  'a post''s updated_at cannot be set directly'
);

select throws_ok(
  $$ update public.post_images set position = 1 - position where post_id is not null $$,
  '42501', null,
  'images cannot be reordered'
);

select throws_ok(
  $$ update public.post_images set post_id = pg_temp.post_of('test_maya')
     where id = pg_temp.unattached_image_of('test_maya') $$,
  '42501', null,
  'images cannot be added to a post directly'
);

select throws_ok(
  $$ update public.post_images set width = 100 where owner_id = auth.uid() $$,
  '42501', null,
  'image sizes cannot be changed'
);

select throws_ok(
  $$ insert into public.posts (author_id) values (auth.uid()) $$,
  '42501', null,
  'posts cannot be inserted directly'
);

select throws_ok(
  $$ insert into public.post_images (owner_id, width, height) values (auth.uid(), 100, 100) $$,
  '42501', null,
  'images cannot be inserted directly'
);

select throws_ok(
  $$ delete from public.post_images where owner_id = auth.uid() $$,
  '42501', null,
  'images cannot be deleted directly'
);

select tests.authenticate_as('test_jamie');

-- RLS filters out other people's rows, so these change nothing instead of raising an error.
update public.posts set body = 'Hacked' where id = pg_temp.post_of('test_maya');
update public.post_images set alt_text = 'Hacked' where post_id = pg_temp.post_of('test_maya');
delete from public.posts where id = pg_temp.post_of('test_maya');

select is(
  (select body from public.posts where id = pg_temp.post_of('test_maya')),
  'Thrifted the whole thing.',
  'users cannot update someone else''s post'
);

select is(
  (select count(*)::integer from public.post_images
   where post_id = pg_temp.post_of('test_maya') and alt_text = 'Hacked'),
  0,
  'users cannot update the alt text on someone else''s images'
);

select is(
  (select count(*)::integer from public.posts where id = pg_temp.post_of('test_maya')),
  1,
  'users cannot delete someone else''s post'
);

-- Constraints (as the test runner) ------------------------------------------

select tests.as_superuser();

select lives_ok(
  $$ update public.posts set body = repeat('x', 2000) where id = pg_temp.post_of('test_maya') $$,
  'a 2,000-character body is allowed'
);

select throws_ok(
  $$ update public.posts set body = repeat('x', 2001) where id = pg_temp.post_of('test_maya') $$,
  '23514', null,
  'bodies are limited to 2,000 characters'
);

select lives_ok(
  $$ update public.post_images set alt_text = repeat('x', 1000) where post_id = pg_temp.post_of('test_maya') $$,
  '1,000-character alt text is allowed'
);

select throws_ok(
  $$ update public.post_images set alt_text = repeat('x', 1001) where post_id = pg_temp.post_of('test_maya') $$,
  '23514', null,
  'alt text is limited to 1,000 characters'
);

select throws_ok(
  $$ update public.post_images set post_id = pg_temp.post_of('test_maya'), position = 6
     where id = pg_temp.unattached_image_of('test_maya') $$,
  '23514', null,
  'a post has at most 6 images'
);

select throws_ok(
  $$ update public.post_images set post_id = pg_temp.post_of('test_maya'), position = 0
     where id = pg_temp.unattached_image_of('test_maya') $$,
  '23505', null,
  'two images on a post cannot share a position'
);

select throws_ok(
  $$ update public.post_images set position = 2 where id = pg_temp.unattached_image_of('test_maya') $$,
  '23514', null,
  'an image has a position only when it is on a post'
);

select throws_ok(
  $$ update public.post_images set post_id = pg_temp.post_of('test_maya'), position = 2
     where id = pg_temp.unattached_image_of('test_jamie') $$,
  '23503', null,
  'an image can only be on its owner''s post'
);

select throws_ok(
  $$ update public.post_images set width = 2049 where id = pg_temp.unattached_image_of('test_jamie') $$,
  '23514', null,
  'images are at most 2048px on each side'
);

select throws_ok(
  $$ update public.post_images set height = 0 where id = pg_temp.unattached_image_of('test_jamie') $$,
  '23514', null,
  'images are at least 1px on each side'
);

-- updated_at ----------------------------------------------------------------

update public.posts set updated_at = '2000-01-01' where id = pg_temp.post_of('test_maya');
update public.posts set body = 'Edited' where id = pg_temp.post_of('test_maya');

select is(
  (select updated_at from public.posts where id = pg_temp.post_of('test_maya')),
  now(),
  'editing a post sets updated_at to the current time'
);

-- Deletion ------------------------------------------------------------------

create temporary table maya_post_images as
  select id from public.post_images where post_id = pg_temp.post_of('test_maya');

select tests.authenticate_as('test_maya');

select lives_ok(
  $$ delete from public.posts where author_id = auth.uid() $$,
  'authors can delete their own posts'
);

select tests.as_superuser();

select is(
  (select count(*)::integer from public.post_images where id in (select id from maya_post_images)),
  0,
  'deleting a post deletes its images'
);

select is(
  (select count(*)::integer from public.post_images where id = pg_temp.unattached_image_of('test_maya')),
  1,
  'deleting a post leaves the author''s other images'
);

select tests.create_post('test_jamie', 1);
create temporary table jamie as select tests.get_user_id('test_jamie') as id;
delete from auth.users where id = (select id from jamie);

select is(
  (select count(*)::integer from public.posts where author_id = (select id from jamie)),
  0,
  'deleting the account deletes the posts'
);

select is(
  (select count(*)::integer from public.post_images where owner_id = (select id from jamie)),
  0,
  'deleting the account deletes the images, on posts or not'
);

select * from finish();
rollback;
