# Implementation Plan: Avatars, Hatte & Per-Deltager Resultatvisning

**Branch**: `003-avatars-hats-attribution` | **Date**: 2026-05-16 | **Spec**: [spec.md](./spec.md)

## Summary

Tilføj et legende avatar-system (12+ base-avatars + 16 stackbare hatte i 4 slots) der vises konsistent på tværs af lobby, afstemning og resultatside. På resultatsiden tilføjes **vote attribution** — for hver top-madmulighed vises hvilke deltagere stemte Ja/Måske/Nej via deres avatar. Avatarsystemet bygger på emoji-baserede assets (ingen ekstern asset-pipeline, zero bundle-impact) layered i en lille SVG-container med ARIA-tilgængelighed og reduced-motion-respekt.

## Technical Context

**Language/Version**: TypeScript 5.x (strict)

**Primary Dependencies**: Next.js 14+, React 18+, Tailwind 3, Framer Motion 11, Supabase (alle allerede installeret). Ingen nye dependencies.

**Storage**: Udvider `participants`-tabellen i Supabase med to nullable kolonner: `avatar_id text` og `hat_ids text[]`. Ny migration `008_add_avatar.sql`. Avatar- og hat-katalog er klient-side static data (ingen tabeller).

**Testing**: Vitest unit tests for avatar-catalog (slot-konflikt-detektion, max-hats validering), AvatarConfiguration-serialization, og VoteAttribution-aggregering.

**Target Platform**: Web mobile-first.

**Project Type**: Next.js fullstack web app (uændret fra MVP).

**Performance Goals**:
- Picker viser fuld katalog (12 avatars + 16 hatte) uden scroll-lag på 4-årig Android (SC-010)
- Attribution-sektion på resultat: 20 deltagere × 5 muligheder = 100 avatar-renders uden frame drops
- Avatar-asset payload: 0 KB (emoji-baseret — ingen billeder, ingen SVG-fil)

**Constraints**:
- Ingen ekstra bundle-byrde over 10 KB gzipped for hele avatar-systemet
- Konsistent visuel rendering på tværs af iOS/Android/desktop (emojis varierer per platform, men det er accepteret pris for zero-asset MVP)
- Skal respektere alle 9 konstitutionelle principper
- Slot-baseret stacking forhindrer visuel overlap

**Scale/Scope**: 5 user stories, ~27 functional requirements, påvirker 6 sider + 3 nye komponenter.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princip | Status | Noter |
|---------|--------|-------|
| I. MVP-First | ✅ PASS | Avatars + attribution er eksplicit ønsket; bygger på eksisterende kerneflow uden at ændre det. Kurateret katalog (ingen user-generated) holder scope. |
| II. Mobile-First | ✅ PASS | Picker designet til 320px bredde; tre avatar-størrelser (32/64/96 px); touch-targets ≥44px. |
| III. No-Login-First | ✅ PASS | Avatar-valg sker som del af eksisterende session-flow; ingen login tilføjes. |
| IV. Privacy-Light | ✅ PASS | Avatar-valg er anonymt visuelt indhold, ingen PII. Slettes med rummet efter 24t. |
| V. Realtime Clarity | ✅ PASS | Avatar-ændringer i lobby broadcastes realtime (FR-019). |
| VI. Decision Quality | ✅ PASS | Vote attribution forbedrer beslutningskvalitet ved at gøre individuelle stemmer synlige — gruppen kan diskutere. |
| VII. Strong Dislikes Matter | ✅ PASS | Attribution gør "Nej"-stemmer mere synlige uden at ændre algoritmen. |
| VIII. Danish-First UX | ✅ PASS | Alle alt-tekster og labels på dansk (FR-021, FR-024). |
| IX. Spec-Before-Code | ✅ PASS | Spec → plan → tasks → implementation. |

**Resultat**: Alle gates består. Ingen complexity-tracking nødvendig.

## Architecture Decisions

### 1. Emoji-baseret avatar/hat-katalog (i stedet for SVG-assets)

**Decision**: Avatars og hatte er repræsenteret af unicode-emojis (`🍕`, `🎩`, etc.) renderet i en størrelses-konfigurerbar `<Avatar>`-komponent.

**Rationale**:
- Zero asset-pipeline: ingen SVG-filer at designe/optimere/hoste.
- Følger eksisterende brand (appen bruger allerede emojis overalt).
- 100 % konsistens med systemets emoji-tema; nye hatte tilføjes ved at appende en linje i `catalog.ts`.
- Bundle-impact = 0 KB (emojis er en del af system-font).

**Alternative rejected**:
- **Custom SVG-illustrationer**: ville være visuelt smukkere men kræver designer, asset-optimization, fallback-håndtering. Out of scope for MVP.
- **Lottie/JSON-animationer**: overkill, øger bundle, kompliceret stacking.

**Trade-off accepteret**: Emojis ser lidt forskellige ud på iOS vs Android vs Windows. Det matcher hvordan resten af appen allerede ser ud, så det er konsistent indenfor user's mental model.

### 2. Slot-baseret hat-stacking via absolutte koordinater

**Decision**: Hver hat tilhører ét af 4 slots (`head`, `eyes`, `mouth`, `neck`) med en fast pixel-offset relativt til avatar-centret. To hatte i samme slot er gensidigt ekskluderende (vælg ny → erstat gammel).

**Rationale**:
- Forhindrer visuel overlap deterministisk (FR-006).
- Simpel mental-model for brugeren (ét slot per ansigtsdel).
- Render-logikken er trivielt at teste.

**Alternative rejected**:
- **Tilladt frit stacking uden slots**: ville kræve z-index-magi og kunne give visuel kaos.

### 3. Avatar-konfiguration som JSON i én DB-kolonne

**Decision**: Tilføj `avatar_id text` + `hat_ids text[]` til `participants`-tabellen.

**Rationale**:
- Minimal DB-overflade (ingen ny tabel, ingen joins).
- `text[]` er native Postgres → trivial at læse/skrive via Supabase JS.
- Sammen med deltageren slettes data automatisk når rummet udløber (FR-026).

**Alternative rejected**:
- **JSONB-kolonne**: overkill for 2 felter.
- **Separat `avatar_configurations`-tabel**: introducerer joins uden klar fordel.

### 4. VoteAttribution beregnes klient-side

**Decision**: På resultatsiden fetches alle votes + participants (allerede dataloadet i `resultat.tsx`), og attribution-grupper bygges i React via en `groupVotesByOption(votes, participants)`-funktion.

**Rationale**:
- Konsistent med eksisterende klient-side match-algoritme (`plan.md` 001 § "Match Algorithm").
- 20 deltagere × 15 muligheder × 1 vote = 300 records — trivielt at gruppere i memory.
- Ingen ekstra Supabase-query nødvendig.

### 5. Avatar-picker som modal med 2 tabs (Avatars + Hatte)

**Decision**: `<AvatarPicker>` er en fokus-trap modal med to faner: "Avatar" (grid af 12+ base-options) og "Hatte" (grid grupperet per slot). Live preview ovenfor.

**Rationale**:
- Standard UI-mønster brugere kender (tabs i en config-modal).
- Live preview giver øjeblikkelig feedback (FR-007).
- Modal-pattern letter at man kan reopen den fra lobbyen (FR-018) uden at ændre flow.

**Alternative rejected**:
- **Full-screen wizard med Next/Previous**: mere friktion, sværere at undo.
- **Inline expandable section**: tager for meget plads på små skærme.

### 6. Avatar-ændringer i lobby via Supabase update + realtime broadcast

**Decision**: Når deltageren gemmer en ny avatar i lobbyen, kalder vi `updateParticipantAvatar(id, config)` mod Supabase. Eksisterende polling (2s) plukker det op for andre deltagere.

**Rationale**:
- Genbruger eksisterende polling-infrastruktur (MVP'en bruger polling, ikke push).
- 2 sekunders latency er inden for FR-019 budgettet.

**Alternative rejected**:
- **Egen broadcast-channel for avatar-changes**: unødvendig kompleksitet givet at participant-state allerede polles.

## Project Structure

### Documentation (this feature)

```text
specs/003-avatars-hats-attribution/
├── spec.md              # Feature specification
├── plan.md              # This file (combines plan + research + data-model + contracts)
├── checklists/          # Quality checklists (auto-created)
└── tasks.md             # Phase 2 output
```

> Vi konsoliderer research, data-model og contracts i denne plan.md fordi feature'en er fokuseret nok til at hele tekniske billede fylder mindre end 002's separate dokumenter.

### Source Code (changes)

```text
src/
├── lib/avatars/
│   ├── catalog.ts                    # NY — 15 avatars + 16 hats (4 slots)
│   ├── default.ts                    # NY — pickRandomDefault()
│   └── attribution.ts                # NY — groupVotesByOption(votes, participants)
├── types/
│   ├── avatar.ts                     # NY — Avatar, Hat, Slot, AvatarConfiguration
│   └── room.ts                       # EDIT — add avatar_id + hat_ids to Participant
├── components/avatar/
│   ├── Avatar.tsx                    # NY — visual layer renderer (3 sizes)
│   ├── AvatarPicker.tsx              # NY — modal with avatar + hat tabs
│   ├── AvatarBadge.tsx               # NY — avatar + nickname compact display
│   └── VoteAttribution.tsx           # NY — Ja/Måske/Nej groups for results
├── lib/supabase/
│   └── queries.ts                    # EDIT — joinRoom accepts avatar config;
│                                     #        new updateParticipantAvatar()
├── app/
│   ├── opret/page.tsx                # EDIT — show <AvatarPicker> after nickname
│   ├── join/[kode]/page.tsx          # EDIT — show <AvatarPicker> after nickname
│   ├── solo/page.tsx                 # OPTIONAL — solo can skip avatars
│   └── rum/[kode]/
│       ├── lobby.tsx                 # EDIT — show <AvatarBadge> for each
│       │                             #        participant; "Skift avatar" button
│       ├── stemme.tsx                # EDIT (light) — show user's own avatar in header
│       └── resultat.tsx              # EDIT — add <VoteAttribution> per result row

supabase/migrations/
└── 008_add_avatar.sql                # NY — alter participants, add avatar columns

tests/unit/
├── avatar-catalog.test.ts            # NY — slot conflict detection, max-hats validation
├── attribution.test.ts               # NY — groupVotesByOption with various scenarios
└── default.test.ts                   # NY — pickRandomDefault returns valid avatar
```

## Data Model

### Avatar (klient-side static)

```ts
interface Avatar {
  id: string;          // stable kebab-case identifier
  name: string;        // "Pizza", "Ræv"
  emoji: string;       // "🍕"
  altText: string;     // "Pizza-avatar"
}
```

### Hat (klient-side static)

```ts
type Slot = "head" | "eyes" | "mouth" | "neck";

interface Hat {
  id: string;
  name: string;
  emoji: string;
  slot: Slot;
  altText: string;
}
```

### AvatarConfiguration (per-participant, serialized in DB)

```ts
interface AvatarConfiguration {
  avatar_id: string | null;
  hat_ids: string[];   // length ≤ 3, no two with same slot
}
```

Validation rules:
- `hat_ids.length ≤ 3`
- No two ids in `hat_ids` may map to hats with the same `slot`
- `avatar_id` either present in catalog OR `null` (→ fallback to random default at render time)

### Database Migration

```sql
-- 008_add_avatar.sql
alter table participants add column avatar_id text;
alter table participants add column hat_ids text[] not null default '{}';
```

No backfill needed — existing participants will simply have `null`/`{}` and get default rendering.

### Participant (extended)

```ts
interface Participant {
  // ... existing fields
  avatar_id: string | null;
  hat_ids: string[];
}
```

## Component Contracts (abbreviated)

### `<Avatar config size altText? badge?>`
- `size`: `"sm" (32px) | "md" (64px) | "lg" (96px)`
- `badge`: optional ReactNode rendered as a tiny overlay (used for "(dig)"-indikator and inactive grayscale)
- ARIA: container has `role="img"` and computed `aria-label` combining avatar + hat alt-texts in Danish
- Reduced motion: no enter/exit animations

### `<AvatarPicker open onClose value onSave>`
- Modal with focus trap, escape-to-close, two tabs
- Live preview at top (uses `<Avatar size="lg">`)
- Cancel discards changes; Save invokes `onSave(config)`
- Validates slot conflicts before allowing add

### `<AvatarBadge participant size showName? showStatus?>`
- Compact `<Avatar>` + nickname (+ optional status dot, host crown, "(dig)"-indikator)

### `<VoteAttribution result participants currentSessionId>`
- For one MatchResult: renders three groups (Ja/Måske/Nej) with up to 5 avatars each + "+N flere" overflow + empty-state message

## Implementation Strategy

### Phase 1 — Foundation (catalog + types + DB)
Sequential: catalog → types → migration → queries

### Phase 2 — Avatar primitives (Avatar + Badge components + tests)
Parallelizable.

### Phase 3 — Picker (modal + integration into opret/join)
Sequential: picker → opret → join

### Phase 4 — Display in lobby/stemme (US2)
Sequential: lobby → stemme

### Phase 5 — Vote attribution on results (US3) 🎯 The big payoff
Sequential: attribution lib → component → integrate into resultat

### Phase 6 — Edit from lobby (US4)
Single change to lobby + queries.

### Phase 7 — Polish & verification
Lint, test, build, mark tasks done, commit.

## Complexity Tracking

Tom — alle constitution gates består.

## Deployment Strategy

- Migration 008 kører som del af normal Supabase deploy (manuelt eller via CLI).
- Hvis brugere er midt i en session ved migration, vil eksisterende `participants` blot have `avatar_id = null` og default-rendering tager over — ingen breaking change.
- Ingen feature flag nødvendig; avatar er additive uden at fjerne eksisterende UI.
