begin;
select plan(30);

select tests.create_profile('test_maya');
select tests.create_profile('test_jamie');
select tests.create_user('test_newcomer');
select tests.create_post('test_maya', 1);

-- Named images, so the tests can refer to them as any user.
create temporary table img (name text primary key, id uuid not null);
insert into img select 'maya_' || i, tests.create_image('test_maya') from generate_series(1, 9) as i;
insert into img values ('jamie_1', tests.create_image('test_jamie'));
insert into img
  select 'posted', id from public.post_images
  where owner_id = tests.get_user_id('test_maya') and post_id is not null;
grant select on img to authenticated;

create function pg_temp.img_id(p_name text)
returns uuid
language sql
as $$ select id from img where name = p_name $$;

-- The p_images argument for the named images, in order, without alt text.
create function pg_temp.images(variadic p_names text[])
returns jsonb
language sql
as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', img.id) order by n.ord), '[]')
  from unnest(p_names) with ordinality as n (name, ord)
  join img using (name)
$$;

-- Who can call it -----------------------------------------------------------

select function_privs_are(
  'public', 'create_post', array['text', 'jsonb'], 'anon', array[]::text[],
  'anon cannot execute create_post'
);
select function_privs_are(
  'public', 'create_post', array['text', 'jsonb'], 'authenticated', array['EXECUTE'],
  'authenticated can execute create_post'
);

select tests.authenticate_as_anon();

select throws_ok(
  $$ select public.create_post(null, pg_temp.images('maya_1')) $$,
  '42501', null,
  'anon cannot create posts'
);

select tests.authenticate_without_user();

select throws_ok(
  $$ select public.create_post(null, pg_temp.images('maya_1')) $$,
  '42501', 'not_authenticated',
  'creating a post requires a signed-in user'
);

select tests.authenticate_as('test_newcomer');

select throws_ok(
  $$ select public.create_post(null, pg_temp.images('maya_1')) $$,
  'P0001', 'not_onboarded',
  'creating a post requires a profile'
);

-- Malformed image lists -----------------------------------------------------

select tests.authenticate_as('test_maya');

select throws_ok(
  $$ select public.create_post(null, null) $$,
  '22023', 'invalid_images',
  'the image list is required'
);

select throws_ok(
  $$ select public.create_post(null, jsonb_build_object('id', pg_temp.img_id('maya_1'))) $$,
  '22023', 'invalid_images',
  'the image list must be an array'
);

select throws_ok(
  $$ select public.create_post(null, '[{"alt_text": "No id"}]') $$,
  '22023', 'invalid_images',
  'every image needs an id'
);

select throws_ok(
  $$ select public.create_post(null, '[{"id": "not-a-uuid"}]') $$,
  '22023', 'invalid_images',
  'image ids must be uuids'
);

select throws_ok(
  $$ select public.create_post(
       null, jsonb_build_array(jsonb_build_object('id', pg_temp.img_id('maya_1'), 'alt_text', 5))
     ) $$,
  '22023', 'invalid_images',
  'alt text must be a string'
);

-- How many images -----------------------------------------------------------

select throws_ok(
  $$ select public.create_post('No photos', '[]') $$,
  '22023', 'invalid_image_count',
  'a post needs at least 1 image'
);

select throws_ok(
  $$ select public.create_post(
       null, pg_temp.images('maya_1', 'maya_2', 'maya_3', 'maya_4', 'maya_5', 'maya_6', 'maya_7')
     ) $$,
  '22023', 'invalid_image_count',
  'a post has at most 6 images'
);

select throws_ok(
  $$ select public.create_post(null, pg_temp.images('maya_1', 'maya_1')) $$,
  '22023', 'duplicate_image',
  'an image can only be used once in a post'
);

-- Whose images --------------------------------------------------------------

select throws_ok(
  $$ select public.create_post(null, pg_temp.images('maya_1', 'jamie_1')) $$,
  'P0001', 'image_not_available',
  'users cannot post someone else''s image'
);

select throws_ok(
  $$ select public.create_post(null, pg_temp.images('posted')) $$,
  'P0001', 'image_not_available',
  'an image already on a post cannot be posted again'
);

select throws_ok(
  $$ select public.create_post(null, jsonb_build_array(jsonb_build_object('id', gen_random_uuid()))) $$,
  'P0001', 'image_not_available',
  'an image that doesn''t exist cannot be posted'
);

select is(
  (select post_id from public.post_images where id = pg_temp.img_id('maya_1')),
  null,
  'a failed call leaves the caller''s images unattached'
);

-- Text limits ---------------------------------------------------------------

select throws_ok(
  $$ select public.create_post(repeat('x', 2001), pg_temp.images('maya_1')) $$,
  '23514', null,
  'bodies are limited to 2,000 characters'
);

select throws_ok(
  $$ select public.create_post(
       null,
       jsonb_build_array(jsonb_build_object('id', pg_temp.img_id('maya_1'), 'alt_text', repeat('x', 1001)))
     ) $$,
  '23514', null,
  'alt text is limited to 1,000 characters'
);

-- Creating a post -----------------------------------------------------------

select is(
  (select author_id from public.create_post(
     '  Corduroy, but make it spring.  ',
     jsonb_build_array(
       jsonb_build_object('id', pg_temp.img_id('maya_3'), 'alt_text', ' A green corduroy jacket '),
       jsonb_build_object('id', pg_temp.img_id('maya_1'), 'alt_text', '   '),
       jsonb_build_object('id', pg_temp.img_id('maya_2'))
     )
   )),
  auth.uid(),
  'create_post returns the new post, by the caller'
);

create function pg_temp.post_of_image(p_name text)
returns uuid
language sql
as $$ select post_id from public.post_images where id = pg_temp.img_id(p_name) $$;

select is(
  (select body from public.posts where id = pg_temp.post_of_image('maya_3')),
  'Corduroy, but make it spring.',
  'the body is saved without surrounding whitespace'
);

select results_eq(
  $$ select id from public.post_images where post_id = pg_temp.post_of_image('maya_3') order by position $$,
  $$ values (pg_temp.img_id('maya_3')), (pg_temp.img_id('maya_1')), (pg_temp.img_id('maya_2')) $$,
  'images are positioned in the order given'
);

select is(
  (select position from public.post_images where id = pg_temp.img_id('maya_3')),
  0::smallint,
  'the first image is at position 0'
);

select is(
  (select alt_text from public.post_images where id = pg_temp.img_id('maya_3')),
  'A green corduroy jacket',
  'alt text is saved without surrounding whitespace'
);

select is(
  (select alt_text from public.post_images where id = pg_temp.img_id('maya_1')),
  null,
  'blank alt text is saved as null'
);

select is(
  (select alt_text from public.post_images where id = pg_temp.img_id('maya_2')),
  null,
  'alt text is optional'
);

select lives_ok(
  $$ select public.create_post(
       '   ', pg_temp.images('maya_4', 'maya_5', 'maya_6', 'maya_7', 'maya_8', 'maya_9')
     ) $$,
  'a post can have 6 images'
);

select is(
  (select body from public.posts where id = pg_temp.post_of_image('maya_4')),
  null,
  'a blank body is saved as null'
);

select throws_ok(
  $$ select public.create_post(null, pg_temp.images('maya_3')) $$,
  'P0001', 'image_not_available',
  'an image can only be on one post'
);

select tests.authenticate_as('test_jamie');

select is(
  (select count(*)::integer from public.post_images p
   join img on img.id = p.id
   where img.name in ('maya_1', 'maya_2', 'maya_3')),
  3,
  'other users can read the images once they are posted'
);

select * from finish();
rollback;
