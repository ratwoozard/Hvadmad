# Implementation Plan: HvadMad MVP

**Branch**: `001-hvadmad-mvp` | **Date**: 2026-05-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-hvadmad-mvp/spec.md`

## Summary

HvadMad er en realtime food-voting webapp hvor grupper opretter rum, joiner via kode/link, stemmer på madvalg, og ser matchede resultater. Teknisk tilgang: Next.js App Router med Supabase Realtime for session-baserede rum uden authentication.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)

**Primary Dependencies**: Next.js 14+ (App Router), React 18+, Tailwind CSS 3.x, Supabase JS Client v2, Framer Motion (animations)

**Storage**: Supabase PostgreSQL for rum-state og stemmer. Ephemeral data — auto-cleanup via database functions/cron.

**Testing**: Vitest (unit tests for match algorithm), Playwright (E2E for critical flows)

**Target Platform**: Web (mobile-first responsive), deployed on Vercel

**Project Type**: Web application (fullstack Next.js)

**Performance Goals**: First Contentful Paint < 3s on 4G, realtime updates < 2s latency, result calculation < 500ms

**Constraints**: No auth infrastructure, Danish-only UI, max 20 participants per room, session-based identity (no persistent user data)

**Scale/Scope**: 100 concurrent rooms with 5 participants each in MVP

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. MVP-First | ✅ PASS | Only core flow implemented: create → join → vote → results |
| II. Mobile-First | ✅ PASS | Tailwind mobile-first breakpoints, touch targets ≥44px |
| III. No-Login-First | ✅ PASS | Session-based identity via Supabase anonymous sessions, nickname only |
| IV. Privacy-Light | ✅ PASS | No PII collected, ephemeral room data, auto-expire 24h |
| V. Realtime Clarity | ✅ PASS | Supabase Realtime subscriptions for lobby + voting status |
| VI. Decision Quality | ✅ PASS | Result includes score + explanation text |
| VII. Strong Dislikes | ✅ PASS | Nej = -3, eliminates options from top when >50% reject |
| VIII. Danish-First UX | ✅ PASS | All UI copy in Danish, code in English |
| IX. Spec-Before-Code | ✅ PASS | Full spec → clarify → plan → tasks before implementation |

## Project Structure

### Documentation (this feature)

```text
specs/001-hvadmad-mvp/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── contracts/           # Phase 1 output (realtime channel contracts)
├── checklists/          # Quality checklists
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx                 # Root layout (Danish metadata, fonts)
│   ├── page.tsx                   # Landing page (create/join room)
│   ├── opret/
│   │   └── page.tsx               # Create room flow
│   ├── rum/[kode]/
│   │   ├── page.tsx               # Room router (lobby/voting/results)
│   │   ├── lobby.tsx              # Lobby component
│   │   ├── stemme.tsx             # Voting UI component
│   │   └── resultat.tsx           # Results component
│   └── join/[kode]/
│       └── page.tsx               # Join room with nickname
├── components/
│   ├── ui/                        # Reusable UI primitives
│   ├── room/                      # Room-specific components
│   ├── voting/                    # Voting flow components
│   └── results/                   # Result display components
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Supabase client setup
│   │   ├── realtime.ts            # Realtime subscription helpers
│   │   └── queries.ts             # Database query functions
│   ├── match/
│   │   ├── algorithm.ts           # Match calculation engine
│   │   ├── scoring.ts             # Score normalization
│   │   └── explanation.ts         # Human-readable explanations
│   ├── room/
│   │   ├── state.ts               # Room state machine
│   │   ├── codes.ts               # Room code generation
│   │   └── lifecycle.ts           # Room lifecycle management
│   └── food/
│       ├── categories.ts          # Food categories and options
│       └── data.ts                # Static food database
├── hooks/
│   ├── useRoom.ts                 # Room state hook
│   ├── useVoting.ts               # Voting flow hook
│   ├── useRealtime.ts             # Realtime subscription hook
│   └── useParticipants.ts         # Participant list hook
└── types/
    ├── room.ts                    # Room types
    ├── voting.ts                  # Voting types
    └── food.ts                    # Food option types

supabase/
├── migrations/
│   ├── 001_create_rooms.sql       # Rooms table
│   ├── 002_create_participants.sql # Participants table
│   ├── 003_create_food_options.sql # Food options table
│   ├── 004_create_votes.sql       # Votes table
│   └── 005_create_cleanup.sql     # Auto-cleanup function
└── seed.sql                       # Initial food options data

tests/
├── unit/
│   ├── algorithm.test.ts          # Match algorithm tests
│   ├── scoring.test.ts            # Score normalization tests
│   └── explanation.test.ts        # Explanation generation tests
└── e2e/
    ├── create-room.spec.ts        # Room creation E2E
    ├── join-room.spec.ts          # Join flow E2E
    └── full-flow.spec.ts          # Complete voting flow E2E
```

**Structure Decision**: Single Next.js fullstack application. Supabase handles backend (database + realtime). No separate backend service needed for MVP.

## Architecture Decisions

### 1. Supabase Realtime for Room State

**Decision**: Use Supabase Realtime Presence + Broadcast for all realtime features.

**Rationale**: Eliminates need for custom WebSocket server. Presence tracks who's online, Broadcast handles voting state updates. Built-in reconnection handling.

**Alternative rejected**: Custom Socket.IO server — adds deployment complexity, separate hosting, more code to maintain.

### 2. Session-Based Identity via Browser Storage

**Decision**: Generate a unique session ID (UUID) stored in sessionStorage. Combined with user-chosen nickname for identification.

**Rationale**: No auth infrastructure needed. Session dies with browser tab (privacy-light). Reconnection within same tab preserves identity.

**Alternative rejected**: Supabase Anonymous Auth — adds unnecessary complexity and creates persistent user records.

### 3. Room State Machine

**Decision**: Room has explicit states: `lobby` → `voting` → `calculating` → `results`. Transitions are enforced server-side via Supabase RLS/functions.

**Rationale**: Clear state prevents race conditions (e.g., voting before all joined, results before all voted).

### 4. Static Food Database

**Decision**: Curated food options stored in Supabase, seeded during deployment. ~50-100 options per category.

**Rationale**: MVP-first. No user-generated content complexity. Consistent experience for all users. Easy to expand later.

### 5. Match Algorithm (Client-Side Calculation)

**Decision**: Calculate results client-side after fetching all votes. No server-side computation needed.

**Rationale**: With max 20 participants × ~15 options = 300 votes max, calculation is trivial (<1ms). Avoids need for Supabase Edge Functions.

**Scoring formula**:
- Ja = +2 points
- Måske = +1 point
- Nej = -3 points
- Match percentage = (actual_score / max_possible_score) × 100
- Elimination rule: If >50% of participants voted Nej, option is excluded from top results

### 6. Danish Copy Strategy

**Decision**: All UI strings hardcoded in Danish in components. No i18n library.

**Rationale**: MVP-first. Only one language needed. Adding i18n later is a well-documented migration path.

## Complexity Tracking

No constitution violations to justify. All principles pass without exceptions.

## Deployment Strategy

1. **Platform**: Vercel (automatic from GitHub push)
2. **Database**: Supabase hosted PostgreSQL (free tier sufficient for MVP)
3. **Environment**: Single environment (production) with Supabase project
4. **Domain**: Custom domain TBD (Vercel provides immediate .vercel.app URL)
5. **Monitoring**: Vercel Analytics (free tier) for basic usage metrics
