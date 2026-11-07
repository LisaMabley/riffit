-- create_post() turns the caller's unattached images into a post (spec §3, §9).
--
-- p_images is a JSON array in display order: [{"id": "<image id>", "alt_text": "..."}, ...].
-- alt_text is optional. The first image is the one shown in the feed. Blank text is stored as
-- null, and text over the limits fails the table's check constraints.
--
-- Images that don't exist, belong to someone else, or are already on a post all raise the same
-- error, so callers can't learn anything about other people's images.

create function public.create_post(p_body text, p_images jsonb)
returns public.posts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_image_count integer;
  v_ids uuid[];
  v_alt_texts text[];
  v_available integer;
  v_post public.posts;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if not exists (select 1 from public.profiles where id = v_user_id) then
    raise exception 'not_onboarded' using errcode = 'P0001';
  end if;

  if p_images is null or jsonb_typeof(p_images) <> 'array' then
    raise exception 'invalid_images' using errcode = '22023';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_images) as e
    where jsonb_typeof(e) <> 'object'
      or jsonb_typeof(e -> 'id') is distinct from 'string'
      or coalesce(jsonb_typeof(e -> 'alt_text'), 'null') not in ('string', 'null')
  ) then
    raise exception 'invalid_images' using errcode = '22023';
  end if;

  -- 1 to POST_IMAGES_MAX.
  v_image_count := jsonb_array_length(p_images);
  if v_image_count not between 1 and 6 then
    raise exception 'invalid_image_count' using errcode = '22023';
  end if;

  begin
    select
      array_agg((e ->> 'id')::uuid order by ord),
      array_agg(nullif(btrim(e ->> 'alt_text'), '') order by ord)
    into v_ids, v_alt_texts
    from jsonb_array_elements(p_images) with ordinality as t (e, ord);
  exception when invalid_text_representation then
    raise exception 'invalid_images' using errcode = '22023';
  end;

  if (select count(distinct id) from unnest(v_ids) as id) <> v_image_count then
    raise exception 'duplicate_image' using errcode = '22023';
  end if;

  -- Lock the images, so a second call with the same image waits and then finds it taken.
  select count(*) into v_available
  from (
    select 1 from public.post_images
    where id = any (v_ids) and owner_id = v_user_id and post_id is null
    for update
  ) as available;

  if v_available <> v_image_count then
    raise exception 'image_not_available' using errcode = 'P0001';
  end if;

  insert into public.posts (author_id, body)
  values (v_user_id, nullif(btrim(p_body), ''))
  returning * into v_post;

  update public.post_images as i
  set post_id = v_post.id, position = t.ord - 1, alt_text = t.alt_text
  from unnest(v_ids, v_alt_texts) with ordinality as t (id, alt_text, ord)
  where i.id = t.id;

  return v_post;
end;
$$;

revoke execute on function public.create_post(text, jsonb) from public, anon;
grant execute on function public.create_post(text, jsonb) to authenticated;
