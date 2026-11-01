# Riffit — Project Plan

_Updated 2026-10-31_

## 1. Overview

Riffit is a fashion community built around inspiration, interpretation, and creative response. Someone posts a look or styling idea; others make their own versions (**riffs**), which can inspire more riffs. The resulting network of ideas and interpretations is the core experience.

The product focuses on fashion and personal style. Expanding into other creative fields can wait.

- **App name:** undecided. Riffit is the working name; Riff Collective is another candidate.
- **Action word:** "riff" (button: _Riff on this_; count: _12 riffs_; attribution: _riffed from @maya_). Pairs with the working app name. Alternatives considered: remix, take, spin.

## 2. Product principles

- Creativity and participation over popularity and passive scrolling.
- Interpretation over imitation.
- Meaningful interaction without public popularity contests.
  - **Exception, on purpose:** riff counts are public, because they reward making something. Applause stays private.
- Make room for different bodies, budgets, identities, abilities, modesty needs, and styles.
- Treat safety and accessibility as part of the product.
- As little friction as possible for kindness, and as much as reasonable for cruelty. Voice, draft copy, and community culture ideas live in [docs/voice-and-community.md](docs/voice-and-community.md).

## 3. Posts and riffs

- A post has 1–6 images plus text, public tags, and an optional riff link.
- A riff has exactly **one** "riffed from" post. Multiple inspirations are out of scope.
- The riff link can be set or changed for **24 hours** after posting. After that it can only be removed.
- The original post shows all its riffs together. Riffs can be riffed on, forming branching chains.
- Publishing a riff gets a small celebration that credits both the original and the new riff. Save full-screen effects for milestones such as a first riff, and respect Reduce Motion.
- **Riffs always survive their original.** When the original can't be shown, the "riffed from" spot shows a neutral placeholder card ("Original not available"):

| Why the original is gone | Who sees the placeholder |
|---|---|
| Block between the two users | Only those two users; everyone else still sees the credit |
| Hidden while a report is reviewed | Everyone it is hidden from |
| Removed by a moderator | Everyone |
| Deleted by its creator | Everyone |
| Creator deleted their account | Everyone |

Keep the wording vague; don't say "removed for violating rules."

## 4. MVP scope

_This is the full MVP. It's built in three phases; see section 17 for what comes first._

**In the core MVP**

- Accounts (18+) and profiles
- Image posts and riff relationships
- Feed with filters and sort
- Public and private tags
- Comments (one level of replies)
- Favorites (posts and profiles) and private applause
- In-app notifications
- Reporting and blocking, plus a minimal admin page
- Mobile app (iOS and Android) and a web app (participation, no posting)

**Later in the MVP, after the core works**

- Push notifications for riffs only, with batching

**Out of scope for the MVP**

- Private posts; per-post controls to disable applause, comments, or riffing
- Server-saved drafts, video
- External images and links
- Following or mutual friends; a public social graph
- Shopping and affiliate links, creator monetization, federation, advanced analytics, AI styling
- Automated moderation, appeals, strike systems

**Usernames**

- 3–30 characters: lowercase letters, numbers, underscores, periods, and hyphens. Case is ignored, so `Maya` and `maya` are the same name.
- Periods, hyphens, and underscores can't come first or last, or twice in a row.
- Names people could mistake for the app or its staff are reserved (`admin`, `support`, `riff`, and similar). The check ignores case, periods, hyphens, and underscores, so `ad.min` is reserved too.
- Offensive names use the blocked-words list from §8, matching whole names only, because matching inside names blocks innocent ones. Anything that gets through is handled through reports.
- Web profile URLs use `/u/<username>`, so a username can't collide with a page like `/login`.

## 5. Feed and discovery

- **Default:** most recent first. Shows both original posts and riffs; riffs show "riffed from @someone."
- **Sort options:** most recent, or most riffed on over the last 30 / 60 / 90 days / all time (default 30).
- **Riff count** shows on every post card and is hidden when it's zero.
- **Filters:**
  - Favorites only (new posts from favorited profiles)
  - Include tags: a post must have **all** of them (AND)
  - Exclude tags: a post is hidden if it has **any** of them
  - Your own private tags can be used in filters
- Filter settings are saved, with a clear button.
- **Always excluded:** blocked users (in both directions), reported content that's hidden, and AI images if the user has opted out.

## 6. Applause and favorites

- **Applause:** a lightweight cheer. No public count; the creator can see who applauded. Users can't turn it off in the MVP. Creators get a batched in-app notification (see section 11).
- **Favorites (♡):** for posts and profiles, for the favoriter's personal use only. Favorited posts appear in a private "Saved" view on your profile.
  - **No one else ever learns about a favorite.** The person or post favorited is never told: no notification, no count, no list of who favorited them. Favoriting never sends applause.
  - Favorites never affect what other people see. They don't factor into sort order, ranking, or anything shown publicly.
  - RLS: only the favoriter can read their own favorites.
- "Favorite" is the term everywhere; never "bookmark."

## 7. Comments

- Comments belong on posts, not profiles. On by default; can't be disabled per post in the MVP.
- One level of replies, with room to expand later.
- No comment likes or emoji reactions.
- Authors can edit their comments (shown as "edited") and delete them.
- **Post owners can delete any comment on their posts.**
- The comment field shows rotating prompts that invite curiosity and appreciation.

## 8. Tags

- Each tag is stored **once** and shared by public and private use.
- **Public tags:** only the owner can add them, to their own posts and profile. No suggesting tags on other people's content.
- **Private tags:** anyone can add them to any post or profile. Only the person who added a private tag can see that assignment, admins included. The platform can see tag words, not who used them or where. Say this plainly in the privacy policy.
- **Autocomplete** suggests tags used publicly somewhere plus your own private tags. A tag used only privately by someone else never appears.
- **Blocked words:** every new tag, public or private, is checked against a blocked-words list. Blocked words never enter the database.
- **Display:** public tags are blue; private tags are green **with a lock icon or dashed outline**, so color isn't the only cue.
- **Admin review:** common public tags can be promoted, and synonyms and duplicates merged. Tag statuses: normal, promoted, merged-into-another-tag.

## 9. Images

- Up to 6 per post. Users can reorder them before posting; the first image is shown in the feed.
- **Feed:** full width, natural height, cropped only at the bottom if taller than 2:3 portrait. Never forced square.
- **Post view:** full image, never cropped.
- **Location data (EXIF/GPS) is always stripped on the server.**
- Accept HEIC. Resize to about 2048px on the long side and generate smaller versions for the feed.
- **Alt text:** prompted but optional ("Describe this look for people using screen readers"). Posts where every image has alt text show a "described" badge.
- Images can't be swapped after posting.
- No video in the MVP.

## 10. AI-generated images

- Allowed when labeled. Labeling is **per image**: an "AI-generated" toggle on each image when posting.
- Definition shown next to the toggle: "generated or substantially changed by AI." Ordinary filters, lighting fixes, and background blur don't count.
- AI images show an AI icon in a corner everywhere they appear (feed, post view, "riffed from" previews). Screen readers announce "AI-generated image" before the alt text.
- A post with any AI image counts as AI for filtering.
- Shown by default. Onboarding offers a one-tap "Hide AI images."
- AI images can be riffed on. Each post is labeled by its own images.
- Moderators can add a missing AI label instead of removing the post.

## 11. Notifications

In-app (a bell with a list) for:

- Someone riffed on your post
- Someone commented on your post
- Someone replied to your comment
- A moderation action on your content (always on; can't be disabled)
- Your report was resolved ("Thanks, we reviewed your report")
- People applauded your post, **batched**:
  - grouped per post, at most once a day: "Maya and 4 others applauded your look"
  - shows names, not a number; "4 others" can be tapped to see who
  - in-app only, never push

Each type except moderation notices can be switched off. No notifications for being favorited.

**Later in the MVP:** push notifications for riffs only, batched.

## 12. Editing and deletion

- **Posts:** text and public tags can be edited at any time. Images can't be swapped. Posts can be deleted at any time; their riffs show the placeholder.
- **Riff link:** set or changed within 24 hours of posting; after that, removable only.
- **Comments:** editable (marked "edited") and deletable by their author; deletable by the post owner.
- **Account deletion:** available in the app (an app store requirement). It removes the person's posts, comments, applause, favorites, and tags. Riffs on their posts show the placeholder.
- **Drafts:** no server drafts. An unfinished post is saved on the device until it's posted or thrown away.

## 13. Safety and moderation

### Code of conduct

- Everyone agrees to a short, readable code of conduct during onboarding, on one screen.
- We store the date they agreed and the version they agreed to. Like `age_confirmed_at`, users can't edit these.
- When the code of conduct changes, existing members don't need to agree again. Once notifications exist, we may tell them about the change.

### Reporting

Posts, comments, and profiles can be reported.

- A report **always hides the content for the reporter**.
- It's hidden for **everyone** once **2 different accounts** report it. The threshold is a setting, not hardcoded, and rises as the community grows.
- Reports from accounts **under 3 days old** don't count toward the threshold.
- **Instant hide for everyone on a single report** in these categories:
  - Nudity or sexual content
  - Sexual content involving minors (wording matters: a child appearing in an outfit photo is not a violation)
  - Violence or threats
  - Sharing someone's private info (doxxing)
- Each account can trigger hiding for everyone on up to **3 reports per day**. Past that, their reports still reach the moderation queue and still hide the content for them. The reporter sees no difference.
- There's no mechanism to ban someone from reporting.

**Standard report categories** (normal threshold): harassment or bullying; body shaming; hate or discrimination; harmful or insulting tags (the reporter can point to the specific tag); spam or scams; impersonation; unlabeled AI image; stolen or copyrighted image (ask whether the reporter is the owner); something else (free text).

**Self-harm or suicide:** don't hide the post. Move it to the top of the queue and show crisis resources to the reporter, and possibly to the poster.

Keep the in-app category list to about 8 options plus "Something else."

### Blocking

If A blocks B:

- Neither person sees the other's posts, profile, or comments anywhere: feeds, search, riff chains.
- Neither can comment on, riff on, applaud, or favorite the other's posts.
- B isn't told. A's profile shows B "not available."
- Comments B already left on A's posts are hidden from everyone.
- Existing riffs between them stay. A and B see the placeholder in place of the other's post; everyone else still sees the credit.
- Blocking is available on both mobile and web.

### Moderation tooling (single moderator at launch)

- One admin page listing open reports, oldest first. Each shows the content, category, reporter, and reason, with actions: **Remove**, **Dismiss**, **Preserve & report** (child safety), and **Add AI label**.
- An email alert to the moderator whenever something is instantly hidden.
- No assignments, queues, or moderator roles until a second moderator joins.

### Child safety

US law requires reporting sexual content involving minors to NCMEC and preserving the evidence rather than simply deleting it. "Preserve & report" must exist before the public launch.

Moderation also covers harassment, body shaming, discrimination, harmful tags, spam, impersonation, scams, and copyright concerns.

## 14. Legal

_Not legal advice. Have someone qualified review before the public launch._

- **Minimum age:** 18+, with birth date entered at signup. The birth date is checked and discarded; only the time of the age check (`age_confirmed_at`) is stored.
- **Region:** US only. App store listings are US only; the terms say US users (web can't strictly block other regions).
- **Code of conduct:** a friendly summary of community expectations (section 13), separate from the terms of service.
- **Terms of service and privacy policy:** start from a reputable template, then add the Riffit specifics:
  - by posting, you allow others to make and post their own interpretations (riffs) of your look
  - the private-tag promise: the platform sees tag words, not who used them
  - location data is removed from photos
  - the reporting and removal rules
- **Copyright takedowns (DMCA):** register a designated agent with the US Copyright Office; publish a takedown contact; have a counter-notice process and a repeat-infringer policy. The "Stolen or copyrighted image" report category feeds into this process.

## 15. Platforms

- **Mobile (iOS and Android, through Expo):** everything, including posting and riffing. Mobile is built first.
- **Web (Expo + React Native Web):** browse the feed and filters, view posts and riff chains, comment, favorite, applaud, tag (public tags on your own content, private tags on anything), report, and block. No posting or riffing on the web for now.
- **Sign-in (mobile and web):** email one-time code (no passwords), Sign in with Apple, and Google. Apple requires Sign in with Apple when other social sign-in is offered.

## 16. Technology and architecture

- **Language:** TypeScript throughout.
- **Repository:** a monorepo sharing types, validation, domain logic, and UI between the mobile and web apps.
- **Data:** PostgreSQL on Supabase (auth, storage, managed infrastructure).
- **Row-Level Security:** turned on for **every** table in the `public` schema. Tables meant to be open get explicit "anyone can read" rules, so a table someone forgets to configure stays locked.
- **Logic placement:** in the database first, then Edge Functions, then a separate service only if needed.

| Logic | Where |
|---|---|
| Report thresholds, daily report limit, account-age rule | Database (rules and triggers) |
| 24-hour riff-link rule | Database |
| Blocked-words check on tag creation | Database |
| Block visibility | RLS |
| Image processing (EXIF stripping, resizing, HEIC conversion) | Server: Supabase Edge Functions if feasible, otherwise a small Hono service on Node (e.g. Fly.io or Railway) |
| Moderation actions, moderator email alerts, push (later) | Supabase Edge Functions or Hono |

- **Early check:** confirm whether image processing runs reliably on Supabase Edge Functions (Deno has limited image libraries) before building the upload flow.

**Tag tables (sketch):**

| Table | Contents | Who can read |
|---|---|---|
| `tags` | One row per tag: text, status (normal / promoted / merged into another tag) | Tags used publicly somewhere, plus tags you've used yourself |
| `post_tags`, `profile_tags` | Public tag assignments | Anyone; only the post or profile owner can add or remove them |
| `private_tag_assignments` | Which tag a user put on which post or profile | Only that user |

**Ownership rules RLS must cover:** profiles, posts, images, riff links, comments, applause, favorites, public and private tag assignments, reports, blocks, notifications.

### Testing

| Layer | Tool | Notes |
|---|---|---|
| RLS rules and database logic | **pgTAP**, run with `supabase test db` | The most important layer: privacy promises (private tags, favorites, blocks, report hiding) live in RLS. Every policy gets tests for who can and can't read or write. |
| Shared packages (domain logic, validation) and the Hono service | **Vitest** | |
| React Native components | **Jest with `jest-expo`** + **React Native Testing Library** | Expo's supported setup; the one place a second test runner is worth it. |
| End-to-end, mobile | **Maestro** | First flow: the Phase 1 core loop (post, riff, comment, block). |
| End-to-end, web | **Playwright** | |

**When each comes in:**
- **Phase 1:** pgTAP and Vitest from the start.
- **Once the UI settles:** component tests, then the Maestro core-loop flow.
- **Phase 2:** Playwright, when web participation is built.

## 17. Build phases

This document describes the full MVP. **Build it in phases, not all at once.** Each phase ships something people can use, and later phases add to the data model with migrations rather than building everything up front.

### Get right from day one (cheap now, painful later)

- One "riffed from" link per post; riffs survive their original (placeholder card)
- RLS on every table
- Tags stored once; private tag assignments in their own table
- Location data stripped from photos on the server
- 18+ check at signup (birth date not stored)
- pgTAP tests for every RLS policy, written alongside the policy

### Phase 1 — Friends beta

_Goal: test success milestones 1 and 2 with an invite-only group (TestFlight / Expo)._

1. Monorepo, Expo app, Supabase project, sign-in (email code, Apple, Google), 18+ check at signup (birth date not stored), code of conduct agreement, basic profiles.
2. **Early check:** image processing on Supabase Edge Functions (fall back to a small Hono/Node service if needed).
3. Image posts: upload, EXIF stripping, resizing, reordering, alt text prompt.
4. Riffs: the "riffed from" link with the 24-hour rule, riffs listed on the original, placeholder card, a celebration on publishing.
5. Feed: newest first, plus a tag filter. Riff count on cards.
6. Comments and one level of replies; post owners can delete comments; comment prompts.
7. Public tags (owner only) with the blocked-words check.
8. Blocking (full rules from section 13).
9. **Simple reporting:** every report hides the content for the reporter and emails the moderator. All review is manual, using the Supabase dashboard and a saved query for open reports.
10. Riff and comment notifications (in-app).

**End-to-end milestone:** a user creates a profile and an outfit post; another user riffs on it; the original shows its riffs; both users can comment and tag; reporting and blocking work.

### Phase 2 — Core MVP

_Goal: make exploring and organizing rewarding; test milestones 3 and 4._

1. Feed sort (most riffed on over 30 / 60 / 90 days / all time), exclude-tag and favorites filters, saved filters with a clear button.
2. Private tags, autocomplete rules, filtering by your own private tags.
3. Favorites (posts and profiles) and the private "Saved" view.
4. Applause.
5. Full in-app notifications, including batched applause and reply notifications.
6. AI labels per image, the AI icon, and "Hide AI images" in onboarding.
7. "Described" badge for posts with alt text.
8. Web app with participation features (section 15).
9. Tag promotion and merging, once there are enough tags to tidy.

### Phase 3 — Public launch

_Goal: everything required to open to the public and pass App Store review._

1. Full reporting rules: 2-account threshold (as a setting), account-age rule, instant-hide categories, daily limits, full category list, self-harm handling.
2. Admin page with Remove, Dismiss, Preserve & report, and Add AI label; email alerts on instant hides.
3. "Preserve & report" workflow for child-safety content.
4. Report-resolved and moderation-action notifications.
5. Account deletion in the app.
6. Terms of service, privacy policy, DMCA agent and takedown process.
7. Push notifications for riffs, batched.

### Phase 4 — After launch

_Goal: gather posts of public figures who aren't members into style reference pages (section 20). Not part of the MVP. Start once members are actually posting these looks, and after the legal review._

1. `people`, `post_people`, and `person_links` tables with RLS.
2. Name and source link at upload, with simple name autocomplete.
3. Style reference pages, opened by tapping a person's name on a post.
4. Moderator tool to review and merge duplicate people, plus a way to request a page's removal.

Claiming a page, identity verification, and automatic matching come later still.

## 18. Success milestones

Each step matters once the previous one is happening:

1. **People show up:** someone invited signs up and makes a post.
2. **People riff:** someone riffs on a post without being asked.
3. **Strangers connect:** someone riffs on a post by someone they don't know personally. _This is the real signal that Riffit works._
4. **People come back:** someone posts a second time without being reminded.

Possible later metrics, once there's a real user base: share of posts that are riffs; share of originals riffed on within 30 days; chains 3+ levels deep; 2-week return rate.

## 19. Open questions

- Final app name.
- Profile fields (display name, pronouns, bio, profile tags, links?).
- Search scope: tags only, or also usernames and post text?
- Text limits for posts, comments, and tags.
- **Holding harmful comments before they reach the recipient.** Moderation today is reactive (§13): content goes live, then reports hide it. Holding comments first needs either automated detection, which §4 puts out of scope, or a moderator reviewing them, and there's one moderator at launch. Undecided whether to do this, and how.
- **"Who is in this photo?" at upload** (Me / Someone else / AI-generated / Unknown). Proposed 2026-10-29 so that style reference pages (§20) stay possible later. Not yet in the MVP spec. Undecided:
  - whether it's in the MVP, and in which phase;
  - per post or per image (AI labels are per image, §10), and how its "AI-generated" option relates to the AI toggle;
  - whether to collect a name and source link for "Someone else," given that §4 puts external links out of scope;
  - how to avoid storing the names of private people who aren't members (a friend in the photo, not a public figure).

## 20. Later (not MVP)

- Push notifications for comments and replies
- A teens-only space (separate audience, likely age verification, stricter defaults)
- Server-saved drafts that sync across devices
- Video
- Multiple inspirations per riff
- Posting and riffing on the web
- External images and links, with clear attribution and copyright rules (especially for sources like Pinterest)
- Saved named feeds ("My thrift people") and OR tag filters
- Per-post controls for applause, comments, and riffing; private posts
- Appeals and strike systems; automated moderation; moderator roles and queues
- A tone check that offers a second look before a harsh comment posts (needs automated detection)
- Escalating limits for repeated harm: slower posting or commenting, temporary commenting restrictions, moderation review, and suspension or removal for serious or repeated violations
- Expanding beyond the US
- Style reference pages for public figures who aren't members (see below; planned for Phase 4, section 17)
- Creator communities and challenges, creator tools or services, optional paid features, open social protocols. Core participation should stay accessible. Business model and open-source vs. commercial direction are undecided.

### Style reference pages (people who aren't members)

_Added 2026-10-29. Not MVP; planned for Phase 4 (section 17). Recorded here so that MVP choices don't rule it out._

Members may post photos of looks worn by public figures (celebrities, influencers, a favorite comedian) who aren't on Riffit. Later, posts that show the same person could be gathered on a **style reference page**: that person's looks plus the riffs they inspired. Treat these outfits as starting points for interpretation, not ideals to copy. The interesting part is how a look changes as people riff on it, including cheaper, more accessible, more personal, or completely different versions. Celebrity looks should add to the riff network, not dominate it.

**Pages**

- Call them "style reference pages," never profiles or unclaimed accounts.
- Show the person's name and say clearly that they aren't a Riffit member. Nothing may imply that they take part in or endorse Riffit.
- Contents: posts showing the person, riffs on those posts, external links, attribution.
- Later, the person can verify their identity and either connect the page to their own account or ask for it to be removed. Removal requests are separate from copyright complaints.

**Data model direction** (a concept, not an approved migration)

- People are entities, not tags. **Tags describe the look, people identify who's in it, and riff links record creative influence.** Keep all three separate.
- Sketch: `people` (id, display_name, slug, claimed_by_user_id nullable, status), `post_people` (post_id, person_id), `person_links` (person_id, url, type). The nullable claim column can link a page to a real account later, so no account is ever created on someone's behalf.

**Matching and merging**

- Posts can be matched to the same person through attribution links, such as an official Instagram profile or a personal website. Different links can point to the same person, so moderators need a tool to review and merge records.
- Never merge records automatically because a name matches or a source URL is ambiguous.

**Navigation**

- Tapping a person's name on a post opens their page, and uploading offers simple name autocomplete. Neither needs general text search, and people never become tags just so they can be searched.

**Copyright**

- Pinterest is the model: members can post inspiration photos they didn't take, backed by a takedown process ([Pinterest copyright policy](https://policy.pinterest.com/en/copyright)).
- Uploaders are responsible for having the rights or legal basis to post. Encourage source URLs and photographer credit, but credit isn't permission.
- Builds on the DMCA process in §14 (designated agent, counter-notice, repeat-infringer policy). Get a legal review before the public launch.

**Deferred until after the MVP:** the pages themselves, merging duplicates, and name autocomplete go in Phase 4. Claiming, identity verification, and automatic matching come after that. What the MVP collects at upload is an open question (§19).

## 21. Visual direction

Creative, inclusive, down-to-earth, and a little rebellious, without prescribing one fashion subculture. References: BUST Magazine, Miranda July's Somebody app, Wet Leg, The Linda Lindas, Lola Young. Use them for attitude, not imitation. The app's written voice is in [docs/voice-and-community.md](docs/voice-and-community.md).

## 22. Guiding question

> Does this make it easier, safer, or more rewarding for people to inspire one another and create their own interpretations?

If not, and it mainly adds popularity signals or complexity, it probably doesn't belong in the early product.
