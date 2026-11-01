begin;
select plan(11);

select tests.create_user('test_maya');

-- Access --------------------------------------------------------------------

select table_privs_are(
  'public', 'reserved_usernames', 'anon', array[]::text[],
  'anon has no table privileges'
);
select table_privs_are(
  'public', 'reserved_usernames', 'authenticated', array[]::text[],
  'authenticated has no table privileges'
);

select tests.authenticate_as('test_maya');

select throws_ok(
  $$ select * from public.reserved_usernames $$,
  '42501', null,
  'signed-in users cannot read the list'
);

select throws_ok(
  $$ insert into public.reserved_usernames (username) values ('maya') $$,
  '42501', null,
  'signed-in users cannot add to the list'
);

-- Onboarding ----------------------------------------------------------------

select throws_ok(
  $$ select public.complete_onboarding('admin', 'Maya', '1990-01-01') $$,
  'P0001', 'username_reserved',
  'a reserved name is rejected'
);

select throws_ok(
  $$ select public.complete_onboarding('  Riff ', 'Maya', '1990-01-01') $$,
  'P0001', 'username_reserved',
  'the reserved check ignores case and surrounding spaces'
);

select throws_ok(
  $$ select public.complete_onboarding('ad.min', 'Maya', '1990-01-01') $$,
  'P0001', 'username_reserved',
  'the reserved check ignores periods'
);

select throws_ok(
  $$ select public.complete_onboarding('riff-it', 'Maya', '1990-01-01') $$,
  'P0001', 'username_reserved',
  'the reserved check ignores hyphens'
);

select throws_ok(
  $$ select public.complete_onboarding('sup_port', 'Maya', '1990-01-01') $$,
  'P0001', 'username_reserved',
  'the reserved check ignores underscores'
);

select is(
  (select count(*)::integer from public.profiles where id = auth.uid()),
  0,
  'a reserved name creates no profile'
);

-- Only whole names match, so this isn't blocked for containing 'mod'.
select lives_ok(
  $$ select public.complete_onboarding('mod.girl', 'Maya', '1990-01-01') $$,
  'a name that only contains a reserved word is allowed'
);

select * from finish();
rollback;
