# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Riffit (working name) is a fashion community built on **riffs**: someone posts a look, others post their own interpretations, and the riff network is the product. The full product and architecture spec is [riffit-plan.md](riffit-plan.md). Read the relevant section before building a feature, and don't invent answers to its open questions (§19). Ask instead.

## Status

Phase 1 (invite-only friends beta) is in progress. So far: the database foundation for users (profiles and the 18+ check), RLS, and tests. The Expo app exists as a scaffold in `apps/mobile`. **Not started:** posts, images, and riffs; everything after that. Sign-in and onboarding come last in Phase 1 (§17, item 11). Until then, dev builds sign in as seeded test users: read the current user from the session, never from a hard-coded ID. Build phase by phase (§17), extending the schema with new migrations rather than modeling future phases up front. Check §4 "Out of scope" and §20 before adding anything.

## Work in small chunks

Lisa reviews every change, so size work like a team ticket: about 3–5 story points, roughly a day or two of focused work.

- **PR size:** aim for 400 changed lines or fewer. Treat 800 as the ceiling. Generated files (`database.types.ts`), lockfiles, and snapshots don't count toward the limit. Call them out in the PR description instead.
- **Backlog:** [GitHub Issues](https://github.com/LisaMabley/riffit/issues) is the ticket list and the home for open questions that come up while building. Milestones are the spec's phases. Ask new questions in an issue with the `question` label instead of guessing, and record the answer in the spec (or in code, if it's purely technical) before closing it. Create issues for a later phase when that phase starts.
- **Docs-only changes** (`riffit-plan.md`, `README.md`, `docs/`, this file) commit straight to `main`, with no branch or PR. Code always goes through a PR.
- **Plan first:** before starting a feature, break it into tickets, each one small enough to fit the limit and useful on its own. Propose the list and let Lisa approve it before writing code. If a ticket turns out bigger than expected while you're building it, stop and propose a split. Don't keep going.
- **Slice vertically:** each PR should be a thin, complete piece, for example one table with its RLS, grants, and pgTAP tests. Avoid layers that don't work yet ("all the migrations now, all the policies later").
- **Tests stay in the same PR as the code they cover**, so `main` never has untested rules. Put them in their own commit if that makes the diff easier to read.
- **Commits inside a PR:** each commit does one thing and leaves the repo passing `pnpm typecheck`, `pnpm lint`, and the relevant tests. Separate refactors and renames from behavior changes.
- **PR description:** what this ticket does, what's left for later tickets, and how to verify it. Include `Closes #N` so the ticket closes when the PR merges.

## Commands

pnpm workspaces + Turborepo. The Supabase CLI is a root devDependency (`pnpm supabase …`). Local Supabase needs Docker, and on Windows Docker Desktop needs WSL 2.

```sh
pnpm install
pnpm typecheck | pnpm lint | pnpm test      # turbo across packages
pnpm format                                 # prettier (supabase/ and *.md are ignored)

pnpm db:start        # local Supabase stack (Studio URL etc. via `pnpm supabase status`)
pnpm db:reset        # re-apply migrations + supabase/seed.sql
pnpm test:db         # all pgTAP tests (supabase test db)
pnpm db:types        # regenerate packages/supabase/src/database.types.ts after changing a migration

pnpm --filter @riffit/mobile start   # Expo dev server; scan the QR code with Expo Go

# single tests
pnpm --filter @riffit/core exec vitest run src/age.test.ts
pnpm supabase test db supabase/tests/database/00010_profiles.test.sql
```

`supabase/tests/database/00000_helpers.test.sql` installs the `tests.*` helpers and must run before the other test files: a full `pnpm test:db` does this, and the helpers then persist until the next `db:reset`. Run the full suite once after a reset before running a single file.

## Layout

- `supabase/migrations/`: the schema. This is where the product rules live (see below).
- `supabase/tests/database/`: pgTAP, one file per area. Helpers: `tests.create_user`, `tests.create_profile`, `tests.authenticate_as(identifier)`, `tests.authenticate_as_anon`, `tests.authenticate_without_user`, `tests.as_superuser`. Test usernames must satisfy the 3–30 character rule.
- `apps/mobile`: the Expo app (React Native, Expo Router). Routes live in `src/app/`. Add Expo and React Native libraries with `npx expo install` from this folder, not `pnpm add`, so versions match the SDK.
- `packages/core`: framework-free domain helpers and zod schemas (username, `isAdult`, limits) that mirror database rules for client-side feedback. **The database is the source of truth.** When a rule or limit changes, change the migration, `packages/core/src/limits.ts`, and both test suites together.
- `packages/supabase`: generated `Database` types for the future app.
- `packages/tsconfig`: shared strict tsconfig. TypeScript is pinned to 6.0 because typescript-eslint doesn't support 7 yet.

## Architecture rules

**Logic placement:** database (constraints, triggers, RLS) first, then Supabase Edge Functions, then a small Hono/Node service only if needed. See the table in spec §16.

**RLS and grants (every migration):**
- Enable RLS on every table in `public`. `00001_schema_guards.test.sql` fails if one is missing.
- Supabase's default privileges grant `anon`/`authenticated` everything on new `public` tables. Each migration therefore `revoke all … from anon, authenticated` and grants back only what's needed, using **column-level grants** for immutable fields (e.g. `grant update (display_name, bio) on public.profiles`).
- Writes that need server-side checks go through `security definer` RPCs (e.g. `complete_onboarding`) with `set search_path = ''` and fully qualified names. Revoke `execute` from `public, anon`.
- Every policy, grant, and trigger ships with pgTAP tests for both the allowed and the denied case.

**18+ and birth dates:** `complete_onboarding(username, display_name, birth_date)` compares the birth date and discards it. Only `profiles.age_confirmed_at` is stored. It is read-only for users (left out of the column update grant) and is visible to other signed-in users, which reveals nothing beyond `created_at`. Never store, return, or log a birth date (keep Postgres parameter logging off). A schema guard test rejects any `birth`/`dob` column. More generally, don't keep personal data we have no use for.

**Non-negotiables from the spec (for upcoming work):**
- One "riffed from" link per post. Riffs outlive their original and show a neutral "Original not available" placeholder (§3).
- Each tag is stored once; private tag assignments live in their own table, readable only by the assigner (admins included).
- EXIF/GPS is stripped on the server.
- Favorites never leak: no notification, count, or list, and no effect on ranking.
- Blocks are bidirectional and enforced in RLS.

## Product language

- "Riff" everywhere (`Riff on this`, `12 riffs`, `riffed from @maya`).
- "Favorite", never "bookmark."
- Applause has no public count.
- The riff count is the one public number, hidden at zero.
- Placeholder and moderation copy stays vague ("Original not available," never "removed for violating rules").
- User-facing copy follows the voice in [docs/voice-and-community.md](docs/voice-and-community.md), which also holds draft copy.
- When unsure whether a feature belongs, apply the guiding question in spec §22.
