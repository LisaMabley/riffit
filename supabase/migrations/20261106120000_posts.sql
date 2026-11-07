-- Posts and their images (spec §3, §9, §12).
--
-- process-image inserts an image row with the service role once it has saved the files (#40).
-- The image has no post until create_post() (next migration) claims it, and only its owner can
-- see it until then. API users can't insert into either table directly.
--
-- Once posted, images can't be swapped or reordered (§9), so the only editable columns are the
-- post's body and each image's alt text. Deleting a post deletes its image rows.

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  -- Optional. Limits mirror packages/core/src/limits.ts. Placeholders until spec §19 is settled
  -- (#37).
  body text,
  created_at timestamptz not null default now(),
  -- When the body last changed, so a moderator can tell whether a reported post was edited
  -- afterward. Can't be backfilled, so it's kept from the start.
  updated_at timestamptz not null default now(),
  constraint posts_body_length check (char_length(body) <= 2000),
  -- Target for post_images' composite foreign key, so an image can only be on its owner's post.
  constraint posts_id_author_id_key unique (id, author_id)
);

create index posts_author_id_created_at_idx on public.posts (author_id, created_at desc);

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

create table public.post_images (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  -- Null until create_post() puts the image on a post.
  post_id uuid,
  -- 0 is the image shown in the feed. Set together with post_id.
  position smallint,
  -- Size of the full version. process-image rejects anything over PHOTO_MAX_LONG_SIDE.
  width integer not null,
  height integer not null,
  alt_text text,
  created_at timestamptz not null default now(),
  -- post_id is null for unattached images, and then the foreign key isn't checked.
  constraint post_images_post_fkey foreign key (post_id, owner_id)
    references public.posts (id, author_id) on delete cascade,
  constraint post_images_post_id_position_key unique (post_id, position),
  constraint post_images_position_with_post check ((post_id is null) = (position is null)),
  -- Up to POST_IMAGES_MAX images per post.
  constraint post_images_position_range check (position between 0 and 5),
  constraint post_images_size check (width between 1 and 2048 and height between 1 and 2048),
  constraint post_images_alt_text_length check (char_length(alt_text) <= 1000)
);

create index post_images_owner_id_idx on public.post_images (owner_id);

alter table public.posts enable row level security;
alter table public.post_images enable row level security;

-- Column-level update grants keep everything except the body and alt text immutable.
revoke all on public.posts from anon, authenticated;
grant select, delete on public.posts to authenticated;
grant update (body) on public.posts to authenticated;

revoke all on public.post_images from anon, authenticated;
grant select on public.post_images to authenticated;
grant update (alt_text) on public.post_images to authenticated;

create policy "Signed-in users can read posts"
  on public.posts for select
  to authenticated
  using (true);

create policy "Authors can update their own posts"
  on public.posts for update
  to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);

create policy "Authors can delete their own posts"
  on public.posts for delete
  to authenticated
  using ((select auth.uid()) = author_id);

-- An image on a post is visible to whoever can see the post, so later rules that hide posts
-- (blocks, #12; reports, #13) hide their images too.
create policy "Users can read their own images and images on visible posts"
  on public.post_images for select
  to authenticated
  using (
    (select auth.uid()) = owner_id
    or exists (select 1 from public.posts p where p.id = post_images.post_id)
  );

create policy "Owners can update their own images"
  on public.post_images for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
