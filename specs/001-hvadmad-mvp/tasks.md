# Tasks: HvadMad MVP

**Input**: Design documents from `specs/001-hvadmad-mvp/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/realtime-channels.md, quickstart.md

**Tests**: Unit tests for match algorithm included (critical logic). E2E tests included for verification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Project Initialization)

**Purpose**: Initialize Next.js project with all dependencies and configuration

- [ ] T001 Initialize Next.js project with TypeScript and App Router in project root
- [ ] T002 [P] Install dependencies: @supabase/supabase-js, @supabase/ssr, framer-motion
- [ ] T003 [P] Configure Tailwind CSS with custom design tokens (colors, spacing, touch targets) in tailwind.config.ts
- [ ] T004 [P] Configure ESLint and Prettier with project rules in .eslintrc.json and .prettierrc
- [ ] T005 [P] Create environment variable schema and .env.local.example with Supabase URL and anon key
- [ ] T006 [P] Configure Vitest for unit testing in vitest.config.ts
- [ ] T007 [P] Configure Playwright for E2E testing in playwright.config.ts
- [ ] T008 Create root layout with Danish metadata, viewport config, and font setup in src/app/layout.tsx
- [ ] T009 [P] Create TypeScript type definitions in src/types/room.ts, src/types/voting.ts, src/types/food.ts

---

## Phase 2: Foundational (Database & Supabase Setup)

**Purpose**: Database schema, Supabase client, and core infrastructure that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T010 Initialize Supabase project with `npx supabase init`
- [ ] T011 Create rooms table migration in supabase/migrations/001_create_rooms.sql per data-model.md
- [ ] T012 [P] Create participants table migration in supabase/migrations/002_create_participants.sql
- [ ] T013 [P] Create food_options table migration in supabase/migrations/003_create_food_options.sql
- [ ] T014 [P] Create room_food_options linking table migration in supabase/migrations/004_create_room_food_options.sql
- [ ] T015 [P] Create votes table migration in supabase/migrations/005_create_votes.sql
- [ ] T016 Create RLS policies for all tables in supabase/migrations/006_create_rls_policies.sql per data-model.md
- [ ] T017 Create room cleanup cron function in supabase/migrations/007_create_cleanup.sql (pg_cron, 24h expiry)
- [ ] T018 Create seed data with food options (50-100 per category) in supabase/seed.sql
- [ ] T019 Create Supabase client singleton in src/lib/supabase/client.ts
- [ ] T020 [P] Create Supabase realtime subscription helpers in src/lib/supabase/realtime.ts per contracts/realtime-channels.md
- [ ] T021 [P] Create database query functions (CRUD for rooms, participants, votes) in src/lib/supabase/queries.ts
- [ ] T022 [P] Create room code generation utility in src/lib/room/codes.ts (5-char alphanumeric, collision-safe)
- [ ] T023 [P] Create session ID utility in src/lib/session.ts (UUID v4, sessionStorage)

**Checkpoint**: Database running, Supabase client connected, all tables and RLS in place

---

## Phase 3: User Story 1 — Opret rum og del med gruppe (Priority: P1) 🎯 MVP

**Goal**: A user can create a food voting room and share the code/link

**Independent Test**: Create a room, verify code and shareable link are generated and displayed

### Implementation for User Story 1

- [ ] T024 [US1] Create landing page with "Opret madrum" button in src/app/page.tsx
- [ ] T025 [US1] Create room creation page with nickname input and category selection in src/app/opret/page.tsx
- [ ] T026 [US1] Implement createRoom server action/function in src/lib/room/create.ts (insert room + host participant)
- [ ] T027 [US1] Create lobby page layout with room code display, copy-to-clipboard, and share link in src/app/rum/[kode]/page.tsx
- [ ] T028 [US1] Create shareable link component with copy button and visual feedback in src/components/room/ShareLink.tsx
- [ ] T029 [US1] Create room code display component (large, readable font) in src/components/room/RoomCode.tsx
- [ ] T030 [US1] Implement category selection UI (5 categories with icons) in src/components/room/CategorySelect.tsx

**Checkpoint**: User can create a room, see the code, and copy the link

---

## Phase 4: User Story 2 — Join rum som deltager (Priority: P1) 🎯 MVP

**Goal**: A participant can join an existing room via code or link

**Independent Test**: Use a room code/link to join and appear in lobby

### Implementation for User Story 2

- [ ] T031 [US2] Create join page with room code input field in src/app/page.tsx (add "Join rum" section)
- [ ] T032 [US2] Create join-with-code page (nickname input, room validation) in src/app/join/[kode]/page.tsx
- [ ] T033 [US2] Implement joinRoom function in src/lib/room/join.ts (validate room exists, is in lobby state, not full)
- [ ] T034 [US2] Implement room validation (check code exists, room not expired, not in voting) in src/lib/room/validate.ts
- [ ] T035 [US2] Create nickname input component with validation (2-20 chars) in src/components/room/NicknameInput.tsx
- [ ] T036 [US2] Create error states for invalid/expired room codes in src/components/room/JoinError.tsx
- [ ] T037 [US2] Add redirect from join page to lobby after successful join

**Checkpoint**: Participant can join via code or link and lands in lobby

---

## Phase 5: User Story 3 — Afstemning på madvalg (Priority: P1) 🎯 MVP

**Goal**: All participants vote Ja/Måske/Nej on food options presented one at a time

**Independent Test**: Simulate 2+ participants voting on a fixed set and verify all votes are recorded

### Unit Tests for Match Algorithm

- [ ] T038 [P] [US3] Create match algorithm unit tests in tests/unit/algorithm.test.ts (scoring, elimination, edge cases)
- [ ] T039 [P] [US3] Create explanation generation unit tests in tests/unit/explanation.test.ts

### Implementation for User Story 3

- [ ] T040 [US3] Create voting page/component showing one food option at a time in src/app/rum/[kode]/stemme.tsx
- [ ] T041 [US3] Create vote button component (Ja/Måske/Nej) with animations in src/components/voting/VoteButtons.tsx
- [ ] T042 [US3] Create food option card component (name, emoji, description) in src/components/voting/FoodCard.tsx
- [ ] T043 [US3] Create voting progress indicator (X of Y voted) in src/components/voting/Progress.tsx
- [ ] T044 [US3] Implement useVoting hook (track current option, submit vote, advance) in src/hooks/useVoting.ts
- [ ] T045 [US3] Implement vote submission function in src/lib/supabase/queries.ts (insert vote, mark progress)
- [ ] T046 [US3] Implement food option selection for room (random subset from category) in src/lib/food/selection.ts
- [ ] T047 [US3] Create "Start afstemning" button for host in lobby in src/components/room/StartVoting.tsx
- [ ] T048 [US3] Implement room state transition lobby→voting in src/lib/room/state.ts
- [ ] T049 [US3] Broadcast room_status_change event when voting starts per contracts/realtime-channels.md

**Checkpoint**: All participants can vote on food options, votes are stored in database

---

## Phase 6: User Story 4 — Se gruppens resultat (Priority: P1) 🎯 MVP

**Goal**: After all votes, display ranked results with match percentages and explanations

**Independent Test**: Load a set of votes and verify correct ranking, percentages, and explanation text

### Implementation for User Story 4

- [ ] T050 [US4] Implement match calculation algorithm in src/lib/match/algorithm.ts (sum scores, rank, apply elimination rule)
- [ ] T051 [US4] Implement score-to-percentage normalization in src/lib/match/scoring.ts
- [ ] T052 [US4] Implement human-readable explanation generator in src/lib/match/explanation.ts (Danish templates)
- [ ] T053 [US4] Create results page component in src/app/rum/[kode]/resultat.tsx
- [ ] T054 [US4] Create result card component (rank, name, percentage, explanation) in src/components/results/ResultCard.tsx
- [ ] T055 [US4] Create "no matches" empty state in src/components/results/NoMatches.tsx
- [ ] T056 [US4] Create random wheel component for choosing among top matches in src/components/results/RandomWheel.tsx
- [ ] T057 [US4] Implement result calculation trigger (all voted OR host forces) in src/lib/room/state.ts
- [ ] T058 [US4] Implement room state transition voting→results with broadcast in src/lib/room/state.ts

**Checkpoint**: Results display with correct scores, percentages, and Danish explanations

---

## Phase 7: User Story 5 — Realtime lobby og status (Priority: P2)

**Goal**: Participants see each other in real-time; voting progress is visible to all

**Independent Test**: Open two browsers, verify join/leave/vote-progress updates appear within 2 seconds

### Implementation for User Story 5

- [ ] T059 [US5] Implement useRoom hook with Supabase Presence in src/hooks/useRoom.ts
- [ ] T060 [US5] Implement useParticipants hook (list, online status) in src/hooks/useParticipants.ts
- [ ] T061 [US5] Create participant list component for lobby in src/components/room/ParticipantList.tsx
- [ ] T062 [US5] Create participant avatar/badge component in src/components/room/ParticipantBadge.tsx
- [ ] T063 [US5] Implement useRealtime hook for channel management in src/hooks/useRealtime.ts
- [ ] T064 [US5] Create voting status indicator ("Christian er færdig ✓") in src/components/voting/StatusList.tsx
- [ ] T065 [US5] Broadcast vote_progress events when participant completes voting per contracts
- [ ] T066 [US5] Implement presence tracking (join/leave events) per contracts/realtime-channels.md

**Checkpoint**: All realtime features working — lobby shows participants, voting shows progress

---

## Phase 8: User Story 6 — Edge cases og fejlhåndtering (Priority: P2)

**Goal**: Graceful handling of disconnections, host leaving, room expiry, and stragglers

**Independent Test**: Simulate disconnection scenarios and verify correct messages/behavior

### Implementation for User Story 6

- [ ] T067 [US6] Implement reconnection logic (restore session within 5 min) in src/lib/room/reconnect.ts
- [ ] T068 [US6] Implement host transfer logic (2 min disconnect timeout) in src/lib/room/host-transfer.ts
- [ ] T069 [US6] Broadcast host_transfer event per contracts/realtime-channels.md
- [ ] T070 [US6] Create "room expired" page/component in src/components/room/RoomExpired.tsx
- [ ] T071 [US6] Create "connection lost" UI overlay in src/components/ui/ConnectionLost.tsx
- [ ] T072 [US6] Implement "proceed without stragglers" button for host in src/components/voting/ForceResults.tsx
- [ ] T073 [US6] Create participant inactive/disconnected visual state in src/components/room/ParticipantBadge.tsx
- [ ] T074 [US6] Implement participant removal by host in src/lib/room/kick.ts
- [ ] T075 [US6] Handle max participant limit (20) with friendly error in src/lib/room/join.ts

**Checkpoint**: All edge cases handled gracefully with clear Danish error messages

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Mobile UX polish, testing, deployment readiness

- [ ] T076 [P] Mobile layout verification and responsive fixes across all pages (320px, 375px, 414px)
- [ ] T077 [P] Add loading states (skeletons/spinners) for all async operations
- [ ] T078 [P] Add empty states for lobby (waiting for participants) and results (no matches)
- [ ] T079 [P] Add page transitions and micro-animations with Framer Motion
- [ ] T080 [P] Create favicon and Open Graph meta tags for link sharing previews
- [ ] T081 [P] Add touch target verification (minimum 44px on all interactive elements)
- [ ] T082 Create E2E test: full flow (create → join → vote → results) in tests/e2e/full-flow.spec.ts
- [ ] T083 [P] Create E2E test: room creation in tests/e2e/create-room.spec.ts
- [ ] T084 [P] Create E2E test: join flow in tests/e2e/join-room.spec.ts
- [ ] T085 Verify all Danish copy is natural and consistent across all components
- [ ] T086 Set up Vercel deployment with environment variables
- [ ] T087 Configure Supabase production project and run migrations
- [ ] T088 Final smoke test on production URL (full flow with 2 participants)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories 1-4 (Phase 3-6)**: All depend on Foundational phase completion
  - US1 and US2 can proceed in parallel
  - US3 depends on US1 + US2 (need rooms and participants)
  - US4 depends on US3 (need votes to calculate)
- **User Story 5 (Phase 7)**: Can start after Phase 2, enhances US1-4
- **User Story 6 (Phase 8)**: Can start after Phase 2, enhances US1-5
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (Create Room)**: After Foundational — no dependencies on other stories
- **US2 (Join Room)**: After Foundational — independent of US1 (rooms can exist separately)
- **US3 (Voting)**: After US1 + US2 (needs rooms with participants)
- **US4 (Results)**: After US3 (needs votes)
- **US5 (Realtime)**: After Foundational — can enhance US1-4 incrementally
- **US6 (Edge Cases)**: After Foundational — can enhance all stories incrementally

### Within Each User Story

- Models/database before services
- Services before UI components
- Core implementation before integration
- Broadcast/realtime events after core logic works

### Parallel Opportunities

- T002-T007: All setup tasks in parallel
- T011-T015: All migration files in parallel
- T019-T023: All utility modules in parallel
- T038-T039: Test files in parallel
- US1 and US2 can proceed simultaneously
- US5 and US6 can proceed simultaneously after US1-4

---

## Implementation Strategy

### MVP First (User Stories 1-4)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US1 (Create Room)
4. Complete Phase 4: US2 (Join Room)
5. Complete Phase 5: US3 (Voting)
6. Complete Phase 6: US4 (Results)
7. **STOP and VALIDATE**: Test full flow end-to-end
8. Deploy MVP

### Enhancement Layer (User Stories 5-6)

9. Complete Phase 7: US5 (Realtime polish)
10. Complete Phase 8: US6 (Edge case handling)
11. Complete Phase 9: Polish
12. Re-deploy with enhancements

### Estimated Scope

- **Phase 1-2**: ~1 day (project setup + database)
- **Phase 3-6**: ~3-4 days (core features)
- **Phase 7-8**: ~2 days (realtime + edge cases)
- **Phase 9**: ~1 day (polish + deploy)
- **Total MVP estimate**: ~7-8 days for solo developer

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Danish UI copy should be written naturally, not translated from English
- Match algorithm is the only logic requiring thorough unit testing
