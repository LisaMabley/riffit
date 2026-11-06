-- Checks that the test helpers set the role and auth.uid() the way the other tests expect.
begin;
select plan(9);

select tests.create_user('helper_check');

select tests.authenticate_as('helper_check');
select is(current_user::text, 'authenticated', 'authenticate_as switches to the authenticated role');
select is(auth.uid(), tests.get_user_id('helper_check'), 'authenticate_as sets auth.uid()');

select tests.authenticate_as_anon();
select is(current_user::text, 'anon', 'authenticate_as_anon switches to the anon role');
select is(auth.uid(), null, 'authenticate_as_anon has no auth.uid()');

select tests.authenticate_without_user();
select is(auth.uid(), null, 'authenticate_without_user has no auth.uid()');

select tests.as_superuser();
select is(current_user::text, 'postgres', 'as_superuser switches back to the test runner');

select throws_ok(
  $$ select tests.authenticate_as('nobody_here') $$,
  'tests.authenticate_as: no user nobody_here',
  'authenticate_as fails for an unknown user'
);

select tests.create_profile('helper_poster');

select is(
  (select post_id from public.post_images where id = tests.create_image('helper_poster')),
  null,
  'create_image makes an image that is not on a post'
);

select tests.create_post('helper_poster', 3);

select results_eq(
  $$ select i.position from public.post_images i
     join public.posts p on p.id = i.post_id
     where p.author_id = tests.get_user_id('helper_poster')
     order by i.position $$,
  $$ values (0::smallint), (1::smallint), (2::smallint) $$,
  'create_post makes a post with images at positions 0 to n - 1'
);

select * from finish();
rollback;
