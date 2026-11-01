begin;
select plan(34);

select tests.create_profile('test_maya');
select tests.create_profile('test_jamie');

-- Grants --------------------------------------------------------------------

select table_privs_are('public', 'profiles', 'anon', array[]::text[], 'anon has no table privileges');
select table_privs_are(
  'public', 'profiles', 'authenticated', array['SELECT'],
  'authenticated can only select at the table level'
);
select column_privs_are(
  'public', 'profiles', 'display_name', 'authenticated', array['SELECT', 'UPDATE'],
  'authenticated can update display_name'
);
select column_privs_are(
  'public', 'profiles', 'bio', 'authenticated', array['SELECT', 'UPDATE'],
  'authenticated can update bio'
);
select column_privs_are(
  'public', 'profiles', 'username', 'authenticated', array['SELECT'],
  'authenticated cannot update username'
);
select column_privs_are(
  'public', 'profiles', 'age_confirmed_at', 'authenticated', array['SELECT'],
  'authenticated cannot update age_confirmed_at'
);

-- Reading -------------------------------------------------------------------

select tests.authenticate_as('test_maya');

select is(
  (select count(*)::integer from public.profiles where username like 'test\_%'),
  2,
  'signed-in users can read every profile'
);

select tests.authenticate_as_anon();

select throws_ok(
  $$ select * from public.profiles $$,
  '42501', null,
  'anon cannot read profiles'
);

-- Writing -------------------------------------------------------------------

select tests.authenticate_as('test_maya');

select lives_ok(
  $$ update public.profiles set display_name = 'Maya K', bio = 'Thrift everything.' where id = auth.uid() $$,
  'users can update their own display name and bio'
);

select is(
  (select bio from public.profiles where id = auth.uid()),
  'Thrift everything.',
  'the bio update is saved'
);

-- RLS filters out other people's rows, so this updates nothing instead of raising an error.
update public.profiles set display_name = 'Hacked' where username = 'test_jamie';

select is(
  (select display_name from public.profiles where username = 'test_jamie'),
  'test_jamie',
  'users cannot update someone else''s profile'
);

select throws_ok(
  $$ update public.profiles set username = 'test_maya_new' where id = auth.uid() $$,
  '42501', null,
  'usernames cannot be changed'
);

select throws_ok(
  $$ update public.profiles set age_confirmed_at = now() where id = auth.uid() $$,
  '42501', null,
  'age_confirmed_at is read-only'
);

select throws_ok(
  $$ insert into public.profiles (id, username, display_name, age_confirmed_at)
     values (auth.uid(), 'sneaky', 'Sneaky', now()) $$,
  '42501', null,
  'profiles cannot be inserted directly'
);

select throws_ok(
  $$ delete from public.profiles where id = auth.uid() $$,
  '42501', null,
  'profiles cannot be deleted directly'
);

-- Text limits ---------------------------------------------------------------

select lives_ok(
  $$ update public.profiles set display_name = repeat('x', 50), bio = repeat('x', 300) where id = auth.uid() $$,
  'a 50-character display name and 300-character bio are allowed'
);

select throws_ok(
  $$ update public.profiles set display_name = repeat('x', 51) where id = auth.uid() $$,
  '23514', null,
  'display names are limited to 50 characters'
);

select throws_ok(
  $$ update public.profiles set display_name = '   ' where id = auth.uid() $$,
  '23514', null,
  'display names cannot be blank'
);

select throws_ok(
  $$ update public.profiles set bio = repeat('x', 301) where id = auth.uid() $$,
  '23514', null,
  'bios are limited to 300 characters'
);

-- Username rules (inserted as the test runner, since only onboarding creates profiles) --------

select tests.as_superuser();

select throws_ok(
  $$ select tests.create_profile('Test_Upper') $$,
  '23514', null,
  'usernames must be stored lowercase'
);

select throws_ok(
  $$ select tests.create_profile('ab') $$,
  '23514', null,
  'usernames must be at least 3 characters'
);

select throws_ok(
  $$ select tests.create_profile('.test_maya2') $$,
  '23514', null,
  'usernames cannot start with a period'
);

select throws_ok(
  $$ select tests.create_profile('test_maya2.') $$,
  '23514', null,
  'usernames cannot end with a period'
);

select throws_ok(
  $$ select tests.create_profile('test..maya2') $$,
  '23514', null,
  'usernames cannot have two periods in a row'
);

select throws_ok(
  $$ select tests.create_profile('-test_maya2') $$,
  '23514', null,
  'usernames cannot start with a hyphen'
);

select throws_ok(
  $$ select tests.create_profile('test_maya2-') $$,
  '23514', null,
  'usernames cannot end with a hyphen'
);

select throws_ok(
  $$ select tests.create_profile('test--maya2') $$,
  '23514', null,
  'usernames cannot have two hyphens in a row'
);

select throws_ok(
  $$ select tests.create_profile('_test_maya2') $$,
  '23514', null,
  'usernames cannot start with an underscore'
);

select throws_ok(
  $$ select tests.create_profile('test_maya2_') $$,
  '23514', null,
  'usernames cannot end with an underscore'
);

select throws_ok(
  $$ select tests.create_profile('test__maya2') $$,
  '23514', null,
  'usernames cannot have two underscores in a row'
);

select lives_ok(
  $$ select tests.create_profile('test.mary-jo_k') $$,
  'usernames can have periods, hyphens, and underscores between other characters'
);

select throws_ok(
  $$ insert into public.profiles (id, username, display_name, age_confirmed_at)
     values (tests.create_user('test_dupe'), 'test_maya', 'Dupe', now()) $$,
  '23505', null,
  'usernames are unique'
);

-- updated_at ----------------------------------------------------------------

update public.profiles set updated_at = '2000-01-01' where username = 'test_jamie';

select is(
  (select updated_at from public.profiles where username = 'test_jamie'),
  now(),
  'updates always set updated_at to the current time'
);

-- Account deletion ----------------------------------------------------------

delete from auth.users where id = tests.get_user_id('test_maya');

select is(
  (select count(*)::integer from public.profiles where username = 'test_maya'),
  0,
  'deleting the account deletes the profile'
);

select * from finish();
rollback;
