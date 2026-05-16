# Quickstart: HvadMad MVP

**Branch**: `001-hvadmad-mvp` | **Date**: 2026-05-16

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm or pnpm
- Supabase CLI (`npx supabase`) or a Supabase cloud project
- Git

## Setup Steps

### 1. Clone and Install

```bash
git clone <repo-url>
cd Hvadmad
npm install
```

### 2. Supabase Setup

**Option A: Local development (recommended)**

```bash
npx supabase init
npx supabase start
```

This starts a local Supabase instance with PostgreSQL, Realtime, and all required services.

**Option B: Cloud project**

1. Create a new project at [supabase.com](https://supabase.com)
2. Note the project URL and anon key

### 3. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321  # or your cloud URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Migrations

```bash
npx supabase db push       # Cloud
# or
npx supabase db reset      # Local (applies all migrations + seed)
```

### 5. Seed Food Data

```bash
npx supabase db seed       # Populates food_options table
```

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Verification

### Manual Test Flow

1. Open browser at localhost:3000
2. Click "Opret madrum"
3. Enter nickname, select category
4. Copy the room code
5. Open a second browser tab/incognito window
6. Navigate to localhost:3000, click "Join rum"
7. Enter room code and nickname
8. In first tab (host): click "Start afstemning"
9. In both tabs: vote Ja/Måske/Nej on each option
10. Verify results appear with match percentages

### Automated Tests

```bash
npm run test              # Unit tests (Vitest)
npm run test:e2e          # E2E tests (Playwright)
npm run test:algorithm    # Match algorithm specifically
```

## Project Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run lint` | Lint with ESLint |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:seed` | Seed food options data |
| `npm run db:reset` | Reset and reseed local DB |

## Deployment

```bash
# Vercel (recommended)
npx vercel

# Or connect GitHub repo to Vercel dashboard for auto-deploy
```

Ensure Supabase environment variables are set in Vercel project settings.
