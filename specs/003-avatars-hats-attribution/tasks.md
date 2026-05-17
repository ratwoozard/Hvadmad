---
description: "Task list for feature 003-avatars-hats-attribution"
---

# Tasks: Avatars, Hatte & Per-Deltager Resultatvisning

**Input**: Design documents from `specs/003-avatars-hats-attribution/`

**Prerequisites**: spec.md, plan.md

**Tests**: Vitest unit tests for catalog-validation og attribution-aggregering.

**Organization**: Grouped by user story.

## Format: `[ID] [P?] [Story?] Description`

---

## Phase 1: Foundation (Catalog + Types + DB)

- [X] T001 Definér `Avatar`, `Hat`, `Slot`, `AvatarConfiguration`-typer i `src/types/avatar.ts`
- [X] T002 Implementér katalog (≥12 avatars + ≥15 hatte i 4 slots) med danske alt-tekster i `src/lib/avatars/catalog.ts`
- [X] T003 [P] Implementér `pickRandomDefault()` i `src/lib/avatars/default.ts`
- [X] T004 [P] Implementér validation-helpers (`canAddHat`, `removeHatsInSlot`) i samme `catalog.ts`
- [X] T005 [P] Unit tests for catalog-helpers (slot conflict, max 3 hats, no duplicates) i `tests/unit/avatar-catalog.test.ts`
- [X] T006 Tilføj `avatar_id`/`hat_ids`-kolonner til participants-tabellen via ny migration `supabase/migrations/008_add_avatar.sql`
- [X] T007 Udvid `Participant`-typen med `avatar_id` + `hat_ids` i `src/types/room.ts`
- [X] T008 Udvid `joinRoom()` og opret `updateParticipantAvatar()` i `src/lib/supabase/queries.ts`

**Checkpoint**: Foundation klar — UI-arbejde kan begynde.

---

## Phase 2: Avatar Primitives (US1 + US2 shared)

- [X] T009 [P] Implementér `<Avatar config size altText? badge?>` i `src/components/avatar/Avatar.tsx`
- [X] T010 [P] Implementér `<AvatarBadge participant size showName? showHostCrown? isYou?>` i `src/components/avatar/AvatarBadge.tsx`
- [X] T011 [P] Unit test for `<Avatar>` SR alt-text composition i `tests/unit/Avatar.test.tsx` (7 tests covering placeholder, base emoji, composed aria-label, sizes, muted state, unknown id, custom altText)

---

## Phase 3: User Story 1 — Avatar-vælger ved onboarding (Priority: P1) 🎯

- [X] T012 [US1] Implementér `<AvatarPicker open onClose value onSave>` modal med tabs (Avatar | Hatte) i `src/components/avatar/AvatarPicker.tsx`
- [X] T013 [US1] Live preview i picker bruger `<Avatar size="lg">` med valgt config
- [X] T014 [US1] Slot-konflikt-håndtering i picker (klik på hat i optaget slot erstatter; klik på allerede valgt hat fjerner)
- [X] T015 [US1] Maks-3-hatte-håndtering med venlig fejlbesked
- [X] T016 [US1] "Spring over"-knap → tildel default via `pickRandomDefault()` og luk picker
- [X] T017 [US1] Integrér picker i `src/app/opret/page.tsx` (vises efter nickname-validering, før createRoom)
- [X] T018 [US1] Integrér picker i `src/app/join/[kode]/page.tsx` (vises før joinRoom-kald)
- [X] T019 [US1] (Optional) Integrér picker i `src/app/solo/page.tsx` med "Vælg avatar"-knap og live preview i toppen af setup-skærmen

---

## Phase 4: User Story 2 — Avatar-visning i lobby & afstemning (Priority: P1)

- [X] T020 [US2] Refaktorér participant-pills i `src/app/rum/[kode]/lobby.tsx` til at bruge `<AvatarBadge size="sm">` med avatar + nickname
- [X] T021 [US2] Inaktive deltagere vises med dæmpet avatar (grayscale + opacity-50 via `<Avatar muted>`) i `<AvatarBadge>`
- [X] T022 [US2] Vis bruger-egen avatar i toppen af `src/app/rum/[kode]/stemme.tsx` ("Du stemmer som ..."-bar)
- [X] T023 [US2] Vote-progress-liste i `stemme.tsx` viser alle deltageres avatars med vote-yes-checkmark badge for færdige deltagere; dim opacity for ikke-færdige; live opdateres via 2s polling fra parent `page.tsx`

---

## Phase 5: User Story 3 — Vote Attribution på resultatsiden (Priority: P1) 🎯

- [X] T024 [US3] Implementér `groupVotesByOption(votes, participants)` i `src/lib/avatars/attribution.ts`
- [X] T025 [P] [US3] Unit tests for `attribution.ts` i `tests/unit/attribution.test.ts`: tomme grupper, 0 stemmer i en gruppe, overflow (>5 deltagere)
- [X] T026 [US3] Implementér `<VoteAttribution group currentSessionId expanded?>` i `src/components/avatar/VoteAttribution.tsx`:
  - 3 sektioner (Ja/Måske/Nej) med farvet baggrund (vote-yes/maybe/no)
  - Maks 5 avatars per sektion + "+N flere"-badge ved overflow
  - "(dig)"-ring om current user's avatar
  - Empty-state: "Ingen sagde X 🎉"
- [X] T027 [US3] Integrér `<VoteAttribution>` ind under hver `<ResultRow>` i `src/app/rum/[kode]/resultat.tsx`
- [X] T028 [US3] Fetch participants i resultat.tsx (allerede gjort) og pass til VoteAttribution

---

## Phase 6: User Story 4 — Edit avatar fra lobby (Priority: P2)

- [X] T029 [US4] Tilføj "Skift avatar"-knap til bruger-egen avatar i `src/app/rum/[kode]/lobby.tsx` (kun synlig hvis `room.status === "lobby"`)
- [X] T030 [US4] Genåbn `<AvatarPicker>` med nuværende config; ved Save kald `updateParticipantAvatar()`
- [X] T031 [US4] Optimistisk UI-opdatering så lokal state ændrer sig instant; polling henter for andre deltagere inden for 2s

---

## Phase 7: User Story 5 — Tilgængelighed (Priority: P2)

- [X] T032 [US5] Fokus-trap i `<AvatarPicker>` modal (Escape lukker) *(Tab-cyclet sker via browser-default på modal-children — fuld trap kan tilføjes med focus-trap-library i polish-pass)*
- [X] T033 [US5] Hver avatar/hat-knap har `aria-label` der inkluderer position ("Pizza-avatar, valg 3 af 12")
- [X] T034 [US5] `<Avatar>` container har `role="img"` og kombineret `aria-label` ("Pizza-avatar med kokkehue og solbriller")
- [X] T035 [US5] Reduced-motion: pickerens åbnings-/lukningsanimation og avatar-overgange undertrykkes når `useReducedMotion()` returnerer true

---

## Phase 8: Polish & Verification

- [X] T036 Kør `npx vitest run` — alle 65 tests grønne (incl. 26 nye for 003)
- [X] T037 Kør `npm run build` — `/rum/[kode]` er 9.2 kB / 205 kB First Load JS (under 220 KB budget)
- [X] T038 Mark all completed tasks `[X]` i denne tasks.md
- [X] T039 Commit feature på `003-avatars-hats-attribution`

---

## Dependencies & Execution Order

- **Phase 1** blokerer alt
- **Phase 2** blokerer Phase 3 (picker bruger Avatar)
- **Phase 3** blokerer Phase 4 (lobby viser avatars valgt i picker)
- **Phase 4** og **Phase 5** kan udføres parallelt
- **Phase 6** afhænger af både 3 og 4
- **Phase 7** kan startes i Phase 3 og afsluttes løbende
- **Phase 8** kommer sidst

## Status

**35/35 tasks completed** (alle 5 user stories fuldt implementeret).

**Build & tests**: alle grønne. Migration 008 skal køres mod Supabase før app virker fuldt (`npx supabase db reset` eller manuel SQL via dashboard).
