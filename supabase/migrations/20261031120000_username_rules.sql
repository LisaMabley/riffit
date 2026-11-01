-- Username rules (spec §4): hyphens are allowed, separators (periods, hyphens, and underscores)
-- can't start, end, or repeat, and some names are reserved.

alter table public.profiles drop constraint profiles_username_format;

-- Mirrors USERNAME_PATTERN in packages/core/src/username.ts.
alter table public.profiles add constraint profiles_username_format check (
  username ~ '^(?![._-])(?!.*[._-]$)(?!.*(\.\.|--|__))[a-z0-9_.-]{3,30}$'
);

-- Names people could mistake for the app or its staff. Stored without separators, because
-- complete_onboarding() compares with them removed: 'admin' also covers 'ad.min' and 'ad_min'.
-- A table rather than a list in code, so a name can be added without a release. Only
-- complete_onboarding() reads it, and API users have no access.
create table public.reserved_usernames (
  username text primary key
);

alter table public.reserved_usernames enable row level security;

revoke all on public.reserved_usernames from anon, authenticated;

insert into public.reserved_usernames (username)
values
  ('admin'),
  ('help'),
  ('mod'),
  ('moderator'),
  ('official'),
  ('riff'),
  ('riffcollective'),
  ('riffit'),
  ('riffs'),
  ('staff'),
  ('support'),
  ('system'),
  ('team');

create or replace function public.complete_onboarding(
  p_username text,
  p_display_name text,
  p_birth_date text
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_username text := lower(btrim(p_username));
  v_birth_date date;
  v_profile public.profiles;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  -- Same rules as isAdult() in packages/core/src/age.ts: a real YYYY-MM-DD calendar date.
  if p_birth_date is null or p_birth_date !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'invalid_birth_date' using errcode = '22007';
  end if;
  begin
    v_birth_date := p_birth_date::date;
  exception when others then
    raise exception 'invalid_birth_date' using errcode = '22007';
  end;

  -- Future dates fail this comparison too.
  if v_birth_date > current_date - interval '18 years' then
    raise exception 'under_18' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.profiles where id = v_user_id) then
    raise exception 'already_onboarded' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.reserved_usernames
    where username = translate(v_username, '._-', '')
  ) then
    raise exception 'username_reserved' using errcode = 'P0001';
  end if;

  insert into public.profiles (id, username, display_name, age_confirmed_at)
  values (v_user_id, v_username, btrim(p_display_name), now())
  returning * into v_profile;

  return v_profile;
end;
$$;
