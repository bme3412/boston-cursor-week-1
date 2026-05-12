# Shipyard

Peer discovery PM tool for the Cursor Boston Cohort 1. Browse what everyone's building, see who's shipping, and prep for Friday voting calls.

## What it does

- **Cohort feed** at `/` — searchable grid of every member, sorted by who shipped most recently. Members who shipped this week get a green border.
- **Profile pages** at `/[handle]` — GitHub data (avatar, bio, repos, followers) merged with project info, shipping log, and weekly updates. Humanized GitHub activity with icons.
- **Weekly views** at `/week/1` through `/week/6` — full curriculum for all 6 weeks (PM Build, Comms, Vibe Marketing, Ludwitt, Startup, OSS PR). Submissions with Loom/deploy links.
- **Self-registration** at `/join` — fill out a form, instantly appear on the feed. No PRs, no manual steps.
- **Weekly submissions** via `POST /api/submit` — members record what they shipped each week.

## Stack

- Next.js 15 (App Router, TypeScript, `src/` directory)
- Tailwind CSS + shadcn/ui
- Sora font
- Vercel Blob for persistence (falls back to local JSON)
- GitHub API for profile data (no token required, token optional for higher rate limits)
- Zod for runtime validation
- pnpm

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Without a `BLOB_READ_WRITE_TOKEN`, the app reads from the local `src/data/cohort.json` file. The `/api/join` and `/api/submit` endpoints require the token to persist data.

## Deploy to Vercel

1. Push to GitHub
2. Import the repo on [vercel.com/new](https://vercel.com/new)
3. Add a Blob Store: project dashboard → Storage → Create → Blob
4. Deploy. The `BLOB_READ_WRITE_TOKEN` env var is set automatically.

Optional: set `GITHUB_TOKEN` for higher GitHub API rate limits (unauthenticated: 60 req/hr, authenticated: 5,000 req/hr).

## API

### `POST /api/join`

Register a new cohort member.

```json
{
  "handle": "your-github-username",
  "projectName": "My Project",
  "projectDescription": "One-line description",
  "projectUrl": "https://my-app.vercel.app",
  "repoUrl": "https://github.com/you/repo",
  "tags": ["devtools", "ai"]
}
```

### `POST /api/submit`

Submit a weekly update for an existing member.

```json
{
  "handle": "your-github-username",
  "week": 1,
  "shipped": "Built the cohort feed, profile pages, and weekly views.",
  "loomUrl": "https://www.loom.com/share/...",
  "deployUrl": "https://my-app.vercel.app"
}
```

## Project structure

```
src/
  app/
    page.tsx                 # Cohort feed
    [handle]/page.tsx        # Profile page
    week/[n]/page.tsx        # Weekly view
    join/page.tsx            # Registration form
    api/join/route.ts        # Join API
    api/submit/route.ts      # Submit API
  components/                # UI components
  data/
    cohort.json              # Seed data (fallback when no Blob)
    weeks.ts                 # 6-week curriculum
  lib/
    data.ts                  # Data access (Blob + fallback)
    github.ts                # GitHub API fetcher
    types.ts                 # Zod schemas
    events.ts                # GitHub event humanizer
    week.ts                  # Week utilities
```
