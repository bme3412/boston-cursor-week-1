# Shipyard

Peer discovery PM tool for Cursor Boston Cohort 1. 100 builders, 6 weeks, shipping from Boston.

Browse what everyone's building, submit weekly updates with Loom videos, vote for the best builds on Friday.

## Features

- **Cohort feed** (`/`) — searchable grid of every member, sorted by who shipped most recently. Green border = shipped this week.
- **Profile pages** (`/[handle]`) — GitHub data merged with project info, shipping log with embedded Loom videos, stats row, humanized GitHub activity.
- **Weekly views** (`/week/1` – `/week/6`) — full 6-week curriculum with submissions, Loom embeds, deploy links, voting, and leaderboard.
- **Self-registration** (`/join`) — fill out a form with a PIN, instantly appear on the feed.
- **Weekly submissions** (`/submit`) — sign in once, then submit what you shipped, Loom URL, and deploy URL.
- **Voting** — one vote per member per week. Sign in, click "Vote" on any submission. Leaderboard updates live.
- **PIN security** — salted SHA-256 hashed PINs. No one can impersonate you or submit on your behalf.
- **Loom embeds** — Loom share URLs auto-embed as 16:9 video players on profiles and weekly views.
- **Identity persistence** — sign in with handle + PIN once, stored in localStorage. Voting and submissions are single-click after that.

## 6-Week Curriculum

| Week | Theme | Format |
|------|-------|--------|
| 1 | Project Management Build | Vote to win |
| 2 | Communications Build | Vote to win |
| 3 | Vibe Marketing Build | Vote to win |
| 4 | Ludwitt Education Tool | Merge to ship |
| 5 | Your Own Startup | Show & tell |
| 6 | Open-Source PR | Demo day |

## Stack

- Next.js 15 (App Router, TypeScript, `src/` directory)
- Tailwind CSS + shadcn/ui
- Sora + JetBrains Mono fonts
- Vercel Blob for persistence (falls back to local JSON in dev)
- Vercel Analytics
- GitHub API for profile data
- Zod for runtime validation
- pnpm

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Without `BLOB_READ_WRITE_TOKEN`, the app reads from the local `src/data/cohort.json` file. Write endpoints (`/api/join`, `/api/submit`, `/api/vote`) require the token.

## Deploy to Vercel

1. Push to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add a Blob Store: project dashboard → Storage → Create → Blob
4. Deploy — `BLOB_READ_WRITE_TOKEN` is set automatically

Optional: set `GITHUB_TOKEN` for higher GitHub API rate limits (60/hr unauthenticated → 5,000/hr authenticated).

## API

### `POST /api/join` — Register

```json
{
  "handle": "your-github-username",
  "projectName": "My Project",
  "projectDescription": "One-line description",
  "projectUrl": "https://my-app.vercel.app",
  "repoUrl": "https://github.com/you/repo",
  "tags": ["devtools", "ai"],
  "pin": "your-secret-pin"
}
```

### `POST /api/submit` — Weekly update

```json
{
  "handle": "your-github-username",
  "pin": "your-secret-pin",
  "week": 1,
  "shipped": "Built the cohort feed and profile pages.",
  "loomUrl": "https://www.loom.com/share/abc123",
  "deployUrl": "https://my-app.vercel.app"
}
```

### `POST /api/vote` — Cast a vote

```json
{
  "voter": "your-github-username",
  "pin": "your-secret-pin",
  "week": 1,
  "candidate": "other-members-handle"
}
```

One vote per member per week. You can change your vote. Can't vote for yourself.

## Project structure

```
src/
  app/
    page.tsx                 # Cohort feed
    [handle]/page.tsx        # Profile page
    week/[n]/page.tsx        # Weekly view + voting
    join/page.tsx             # Registration form
    submit/page.tsx          # Weekly update form
    api/
      join/route.ts          # Registration endpoint
      submit/route.ts        # Submission endpoint
      vote/route.ts          # Voting endpoint
  components/
    identity-context.tsx     # Client-side identity (handle + PIN)
    identity-bar.tsx         # Sign-in bar
    vote-button.tsx          # One-click voting
    submit-form.tsx          # Weekly update form
    join-form.tsx            # Registration form
    member-card.tsx          # Feed card
    member-grid.tsx          # Searchable grid
    loom-embed.tsx           # Loom video embed
    nav-header.tsx           # Navigation
    footer.tsx               # Footer
  data/
    cohort.json              # Seed data (Blob fallback)
    weeks.ts                 # 6-week curriculum
  lib/
    data.ts                  # Data access (Blob + fallback)
    github.ts                # GitHub API fetcher
    types.ts                 # Zod schemas
    events.ts                # GitHub event humanizer
    pin.ts                   # PIN hashing + verification
    week.ts                  # Week utilities
```
