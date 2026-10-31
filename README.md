# Riffit

Riffit (working name) is a fashion community built on **riffs**. Someone posts a look or styling idea, others post their own versions of it, and those riffs can be riffed on in turn. The riff network is the product. It values creativity and participation over popularity: the only public number is a post's riff count.

The full product and architecture spec is [riffit-plan.md](riffit-plan.md). Read the relevant section before building a feature.

## Status

**Phase 1, an invite-only friends beta, is in progress.** The spec splits the build into phases (§17).

[GitHub Issues](https://github.com/LisaMabley/riffit/issues) has the current tickets and open questions.

## Tech stack

- **TypeScript** throughout, in a **pnpm workspaces + Turborepo** monorepo
- **Supabase**: Postgres, auth, and storage. Most product rules live in the database as constraints, triggers, and RLS policies.
- **pgTAP** for database tests and **Vitest** for TypeScript packages
- **Expo** (React Native) for the mobile app, and a web app later. The mobile app is a scaffold so far.

## Getting started

### Prerequisites

- **Node.js 24** or newer
- **pnpm 11.** The exact version is pinned in `packageManager` in [package.json](package.json). Running `corepack enable` picks it up automatically.
- **Docker**, for the local Supabase stack. On Windows, Docker Desktop needs the WSL 2 backend.

You don't need to install the Supabase CLI globally. It's a dev dependency, so run it as `pnpm supabase …`.

### Setup

```sh
pnpm install
pnpm db:start        # start the local Supabase stack in Docker (first run downloads images)
pnpm db:reset        # apply migrations and load supabase/seed.sql
pnpm test:db         # run the database tests
pnpm test            # run the TypeScript tests
```

`pnpm supabase status` prints the local URLs and keys, including Supabase Studio, a web UI for browsing tables and running SQL. Stop the stack with `pnpm db:stop`.

The seed creates three users who have finished onboarding: `maya`, `jo.makes`, and `sam_k`. They can't sign in yet because sign-in isn't built.

### Running the app on a phone

The app talks to the local Supabase stack. On a phone, `localhost` and `127.0.0.1` mean the phone itself, so the app needs your computer's address on the network.

1. Find your computer's LAN address, such as `192.168.1.20`. On Windows, run `ipconfig` and use the IPv4 address of your Wi-Fi adapter, not one from WSL or Docker. On macOS, run `ipconfig getifaddr en0`.
2. Copy `apps/mobile/.env.example` to `apps/mobile/.env`.
3. Set `EXPO_PUBLIC_SUPABASE_URL` to `http://<LAN address>:54321`.
4. Set `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to `PUBLISHABLE_KEY` from `pnpm supabase status`. Never use the secret key, because this value ships inside the app.
5. Start Supabase and Expo, then open the app on a phone on the same Wi-Fi.

Expo reads `.env` when it starts, so restart it after changing the file, and update the address if your router assigns a new one. A missing or invalid value stops the app with an error naming the variable.

The Feed screen shows `Supabase: reached` with a status code when the phone gets an answer. It's a temporary check, and the 401 you'll see is expected: signed-out users can't read profiles. If it says `not reached`, check that the phone and computer are on the same network, that your firewall allows inbound connections on port 54321, and that Expo Go has Local Network permission in the iPhone's settings.

## Commands

| Command | What it does |
|---|---|
| `pnpm typecheck` | Type-checks every package (Turborepo) |
| `pnpm lint` | ESLint across packages |
| `pnpm test` | Vitest across packages |
| `pnpm format` / `pnpm format:check` | Formats with Prettier, or checks formatting. Skips `supabase/` and Markdown. |
| `pnpm --filter @riffit/mobile start` | Starts the Expo dev server. Scan the QR code with Expo Go on a phone on the same Wi-Fi. On an iPhone, sign in to the same Expo account in Expo Go and with `npx expo login --no-browser` first (the default browser login crashes on Windows in Expo CLI 58.1.17). |
| `pnpm db:start` / `pnpm db:stop` | Starts or stops local Supabase |
| `pnpm db:reset` | Recreates the local database from migrations and the seed |
| `pnpm test:db` | Runs all pgTAP tests (`supabase test db`) |
| `pnpm db:types` | Regenerates `packages/supabase/src/database.types.ts` from the local database |

Running a single test:

```sh
pnpm --filter @riffit/core exec vitest run src/age.test.ts
pnpm supabase test db supabase/tests/database/00010_profiles.test.sql
```

Single pgTAP files depend on helpers installed by `00000_helpers.test.sql`. After a `db:reset`, run the full `pnpm test:db` once before running files on their own.

## Working on the project

Read [CLAUDE.md](CLAUDE.md) before your first change. It's written for AI coding assistants, but its conventions apply to everyone: the repository layout, the rules every migration follows (RLS, grants, `security definer` functions, tests), and how work is split into small PRs.

## Privacy rules

- **No birth dates.** The 18+ check compares the birth date and then discards it. Only `profiles.age_confirmed_at` is stored. Never store, return, or log a birth date. A schema guard test rejects any `birth` or `dob` column.
- **Keep only what we use.** Don't collect personal data the product has no use for.

Upcoming features have more privacy rules of this kind: favorites never leak, private tags are readable only by the person who assigned them, blocks are enforced in RLS, and location data is stripped from photos. [CLAUDE.md](CLAUDE.md) and the spec list them all.

## Product language

Words matter here. Use these consistently in code, UI copy, and docs:

- **Riff**, everywhere: "Riff on this," "12 riffs," "riffed from @maya."
- **Favorite**, never "bookmark."
- **Applause** has no public count. The riff count is the only public number, and it's hidden at zero.
- **Moderation and placeholder copy stays vague**: "Original not available," never "removed for violating rules."

When you're unsure whether a feature belongs, ask the guiding question in spec §22.

## License

[MIT](LICENSE)
