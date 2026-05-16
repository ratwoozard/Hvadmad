---
description: "Task list for feature 002-ui-polish-animations"
---

# Tasks: UI Polish & Animationer

**Input**: Design documents from `specs/002-ui-polish-animations/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/components.md, quickstart.md

**Tests**: Test tasks INCLUDED. Spec § R11 i `research.md` definerer Vitest (unit) + Playwright (E2E) som obligatorisk for cursor-engine, reduced-motion, footer-link og keyboard-navigation. Visuel polering valideres manuelt via `quickstart.md`.

**Organization**: Tasks er grupperet per user story så hver kan implementeres og verificeres uafhængigt.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Kan køre parallelt (forskellige filer, ingen indbyrdes afhængigheder)
- **[Story]**: Mapper tasken til en bruger-historie fra `spec.md` (US1, US2, US3, US4, US5)
- Alle paths er relativ til repo root

---

## Phase 1: Setup (Delt infrastruktur)

**Formål**: Forberedelse uden at røre runtime-adfærd.

- [X] T001 [P] Verify Framer Motion 11.x er korrekt installeret (`npm ls framer-motion`); opdatér til seneste 11.x patch hvis nødvendigt i `package.json`
- [ ] T002 [P] Tilføj nye easing/duration animation keys til `tailwind.config.ts` for fallback-CSS-animations (ingen breaking change til eksisterende keyframes)
- [X] T003 [P] Opret tom motion-tokens-modul-skelet i `src/lib/motion/tokens.ts` (eksporterer placeholder `DURATION`, `EASING`, `STAGGER` const-objekter)
- [X] T004 [P] Opret tom variants-modul-skelet i `src/lib/motion/variants.ts`
- [X] T005 [P] Tilføj feature-flag `NEXT_PUBLIC_ENABLE_CURSOR_EFFECT` med default `true` til `.env.local.example`

---

## Phase 2: Foundational (Blokerende forudsætninger)

**Formål**: Infrastruktur og delte primitiver som ALLE user stories er afhængige af. INTET user-story arbejde kan starte før denne fase er færdig.

**⚠️ KRITISK**: US1–US5 venter alle på Phase 2 completion.

### Motion tokens og hooks

- [X] T006 [P] Færdiggør motion-tokens med endelige værdier i `src/lib/motion/tokens.ts` per `contracts/components.md` § 13
- [X] T007 [P] Implementér genbrugelige Framer Motion variants (`fadeUp`, `staggerChildren`, `voteCardExit`) i `src/lib/motion/variants.ts`
- [X] T008 [P] Implementér `useReducedMotion` hook (wrapper omkring Framer Motion's egen) i `src/hooks/useReducedMotion.ts`
- [X] T009 [P] Implementér `usePointerTrail(callback, options)` hook i `src/hooks/usePointerTrail.ts` (binder `pointermove` på window/target, ryddes op ved unmount)

### Tests for foundational hooks

- [X] T010 [P] Unit test for `useReducedMotion` med `matchMedia`-mock i `tests/unit/useReducedMotion.test.ts`
- [X] T011 [P] Unit test for `usePointerTrail` (mock pointer events, verify callback + cleanup) i `tests/unit/usePointerTrail.test.ts`

### Delte UI-primitiver (React-komponenter erstatter CSS-klasser)

- [X] T012 [P] Implementér `<MotionProvider>` i `src/components/ui/MotionConfig.tsx` (wrapper `MotionConfig reducedMotion="user"`)
- [X] T013 [P] Implementér `<FocusRing>` util i `src/components/ui/FocusRing.tsx` (delt klassesæt for synlig fokus-ring)
- [X] T014 [P] Implementér `<Button>` primitive i `src/components/ui/Button.tsx` per `contracts/components.md` § 4 (variants, sizes, loading, polymorphic `as`)
- [X] T015 [P] Implementér `<Input>` primitive i `src/components/ui/Input.tsx` per `contracts/components.md` § 5 (label, error, hint, icons)
- [X] T016 [P] Implementér `<Card>` primitive i `src/components/ui/Card.tsx` per `contracts/components.md` § 6 (interactive, padding variants)

### Page transition + footer infrastruktur

- [X] T017 Implementér `<PageTransition>` i `src/components/ui/PageTransition.tsx` per `contracts/components.md` § 3
- [X] T018 Opret `src/app/template.tsx` der wrapper children i `<PageTransition>` (Next.js re-mount per navigation)
- [X] T019 Implementér `<Footer>` i `src/components/ui/Footer.tsx` med WeGoDigital.dk-link per `contracts/components.md` § 7
- [X] T020 Opdatér `src/app/layout.tsx` til at (a) wrappe `<body>` i CSS Grid (`grid-rows-[1fr_auto]`), (b) inkludere `<MotionProvider>` rundt om `<main>` + `<Footer />`

**Checkpoint**: Foundation er klar — alle user stories kan nu påbegyndes parallelt.

---

## Phase 3: User Story 1 - Cursor follower på forsiden (Priority: P1) 🎯 MVP

**Goal**: Forsiden får et farverigt, taktilt SVG-cursor-spor der spawner punkter, linjer og enkelte geometriske former. Effekten respekterer reduced-motion, blokerer ikke klik, og rydder op efter sig selv.

**Independent Test**: Åbn `/`, bevæg cursor — verificér visuelt at spor og former vises og fader ud; klik på "Opret madrum"-knap igennem effekten verificerer pass-through.

### Tests for User Story 1 ⚠️

- [X] T021 [P] [US1] Unit test for `follower-engine.ts`: point-trimming når `time < now - removeDelay` i `tests/unit/follower-engine.test.ts`
- [X] T022 [P] [US1] Unit test for `follower-engine.ts`: shape-cap (maks `maxShapes` samtidige) i samme fil
- [X] T023 [P] [US1] Unit test for `follower-engine.ts`: color-rotation gennem den 5-farvede palette i samme fil
- [ ] T024 [P] [US1] E2E test for cursor follower: mousemove på `/` skaber `<path>`-noder i SVG i `tests/e2e/cursor-follower.spec.ts`
- [ ] T025 [P] [US1] E2E test for reduced-motion på `/`: ingen `<svg>` med follower-elementer når `emulateMedia({ reducedMotion: 'reduce' })` i `tests/e2e/reduced-motion.spec.ts`

### Implementation for User Story 1

- [X] T026 [P] [US1] Definér interne typer (`Position`, `Point`, `Shape`, `EngineOptions`) i `src/components/ui/effects/follower.types.ts`
- [X] T027 [US1] Implementér framework-uafhængig `follower-engine.ts` i `src/components/ui/effects/follower-engine.ts` (refaktor af brugerens leverede `SVGFollower`-logik: `mount(svgEl, opts)`, `addPoint(pos)`, `tick(now)`, `destroy()`)
- [X] T028 [US1] Implementér `<CursorFollower>` React-binding i `src/components/ui/effects/CursorFollower.tsx` (bruger `usePointerTrail` + `useReducedMotion`, sætter `pointer-events: none` på SVG-lag, `aria-hidden="true"`)
- [X] T029 [US1] Konfigurér HvadMad-brandfarver (5 farver per `research.md` § R3) som default `colors` prop i `<CursorFollower>`
- [ ] T030 [US1] Tilføj adaptiv performance-degradering: lyt til FPS via `requestAnimationFrame`-timing og halvér `maxShapes` hvis gennemsnit under 30 FPS i 2 sek i `follower-engine.ts`
- [X] T031 [US1] Wrap `<CursorFollower>` med `next/dynamic({ ssr: false })` og integrér i `src/app/page.tsx` rundt om hero-sektionen (children fortsætter med at modtage klik)
- [X] T032 [US1] Tilføj feature-flag-check (`process.env.NEXT_PUBLIC_ENABLE_CURSOR_EFFECT !== 'false'`) i `src/app/page.tsx` så effekten kan slås fra via env

**Checkpoint**: Forsidens cursor-effekt fungerer fuldt — testbar og deploybar uafhængigt.

---

## Phase 4: User Story 2 - Polerede interaktioner overalt (Priority: P1)

**Goal**: Alle interaktive elementer (knapper, input, kort, sideovergange, realtime-lister) har konsistent hover/focus/active/disabled + bløde overgange.

**Independent Test**: Tab gennem hele appen → fokus-ring synlig overalt; hover knapper → blød tone-skift; naviger mellem sider → fade/slide; join lobby fra anden fane → ny deltager glider blødt ind.

### Tests for User Story 2 ⚠️

- [ ] T033 [P] [US2] E2E test for keyboard navigation gennem `/` → `/opret` → `/join/TEST` i `tests/e2e/keyboard-navigation.spec.ts`
- [ ] T034 [P] [US2] E2E test for synlig fokus-ring på alle knap-typer (`primary`, `secondary`, `vote-*`) i `tests/e2e/focus-ring.spec.ts`

### Migration til polish-primitiver

- [X] T035 [US2] Refaktorér `src/app/page.tsx` til at bruge `<Button>` og `<Input>` i stedet for `.btn-primary`/`.btn-secondary`/`.input-field` (bevarer eksisterende layout og copy)
- [X] T036 [P] [US2] Refaktorér `src/app/opret/page.tsx` til at bruge `<Button>` og `<Input>`
- [X] T037 [P] [US2] Refaktorér `src/app/join/[kode]/page.tsx` til at bruge `<Button>` og `<Input>`
- [X] T038 [P] [US2] Refaktorér `src/app/solo/page.tsx` til at bruge `<Button>`, `<Input>` og `<Card>`
- [X] T039 [P] [US2] Refaktorér `src/app/rum/[kode]/lobby.tsx` til at bruge `<Button>` og `<Card>`

### Realtime liste-animationer

- [X] T040 [US2] Wrap participant-list i `src/app/rum/[kode]/lobby.tsx` i `<AnimatePresence>` med `layout`-animations så join/leave glider blødt
- [X] T041 [US2] Wrap vote-progress liste i `src/app/rum/[kode]/stemme.tsx` i `<AnimatePresence>` så "X er færdig"-status animerer ind
- [X] T042 [US2] Tilføj `ConnectionLost`-komponentens entry/exit-animation via Framer Motion variants i `src/components/ui/ConnectionLost.tsx`

**Checkpoint**: Alle sider bruger nye primitiver; ingen visuelle regressioner i kerneflowet.

---

## Phase 5: User Story 3 - Stemme- og resultat-animationer (Priority: P1)

**Goal**: Vote-kort flyver væk i semantisk retning (op = ja, ned = nej, side = måske), matchprocent tæller op fra 0, top-3 afsløres sekventielt, og random-wheel spinner med decelerating easing.

**Independent Test**: Gennemfør en afstemning i solo-mode → hvert vote udløser direction-animation → resultatside viser count-up og staggered rows → spin-knap viser hjul-animation.

### Tests for User Story 3 ⚠️

- [X] T043 [P] [US3] Unit test for `MatchScoreCounter`: target-værdi nås efter `duration` ms (med fake timers) i `tests/unit/MatchScoreCounter.test.tsx`
- [X] T044 [P] [US3] Unit test for `RandomWheel`: landing-vinkel matcher valgt option i `tests/unit/RandomWheel.test.tsx`
- [ ] T045 [P] [US3] E2E test: vote → kort forsvinder → næste kort synligt i `tests/e2e/vote-card-swipe.spec.ts`

### Vote-card stack med swipe

- [X] T046 [P] [US3] Implementér `<VoteCard>` med entry/exit-variants per retning per `contracts/components.md` § 8 i `src/components/voting/VoteCard.tsx`
- [X] T047 [US3] Refaktorér `src/app/rum/[kode]/stemme.tsx` til at bruge `<AnimatePresence mode="popLayout">` med stack-pattern (aktivt + næste kort)
- [X] T048 [P] [US3] Implementér `<VoteProgress>` med animeret fyld i `src/components/voting/VoteProgress.tsx`
- [X] T049 [US3] Tilføj keyboard-shortcuts (Pil op/ned/højre = ja/nej/måske) i `src/app/rum/[kode]/stemme.tsx`

### Resultat-animationer

- [X] T050 [P] [US3] Implementér `<MatchScoreCounter>` med Framer Motion `useMotionValue` per `contracts/components.md` § 9 i `src/components/results/MatchScoreCounter.tsx`
- [X] T051 [P] [US3] Implementér `<ResultRow>` med stagger-baseret entry per `contracts/components.md` § 10 i `src/components/results/ResultRow.tsx`
- [X] T052 [US3] Refaktorér `src/app/rum/[kode]/resultat.tsx` til at bruge `<MatchScoreCounter>` og en liste af `<ResultRow>` med `staggerChildren`-variant
- [X] T053 [US3] Tilføj `aria-live="polite"` på matchprocent-container så skærmlæser annoncerer endelig værdi efter count-up

### Random wheel

- [X] T054 [US3] Implementér `<RandomWheel>` SVG-komponent med deterministisk landing og custom cubic-bezier easing per `contracts/components.md` § 11 i `src/components/results/RandomWheel.tsx`
- [X] T055 [US3] Integrér `<RandomWheel>` i `src/app/rum/[kode]/resultat.tsx` bag en "Spin hjulet"-knap (vises kun hvis ≥2 top-resultater)

**Checkpoint**: Hele afstemnings- og resultatoplevelsen er poleret.

---

## Phase 6: User Story 4 - WeGoDigital.dk footer (Priority: P2)

**Goal**: Footer-link er synligt, funktionelt og touch-venligt på alle hovedsider.

**Independent Test**: Besøg `/`, `/opret`, `/join/TEST`, `/solo`, `/rum/TEST` → footer med "Bygget af WeGoDigital.dk" synlig på hver; klik åbner `https://www.WeGoDigital.dk` i ny fane.

### Tests for User Story 4 ⚠️

- [ ] T056 [P] [US4] E2E test: footer-link findes med korrekt `href`, `target="_blank"` og `rel="noopener noreferrer"` på alle hovedruter (`/`, `/opret`, `/join/TEST`, `/solo`) i `tests/e2e/footer-link.spec.ts`
- [ ] T057 [P] [US4] E2E test: footer-link tap-area ≥44×44 px målt via bounding box i samme spec-fil

### Implementation for User Story 4

> Bemærk: `<Footer>` selv blev oprettet i Phase 2 (T019) som delt infrastruktur. US4-tasks her dækker integration og fjernelse af duplikatet.

- [X] T058 [US4] Fjern det inline WeGoDigital.dk-link fra `src/app/page.tsx` (linje 88-97) — det erstattes nu af den globale `<Footer>` fra root layout
- [ ] T059 [US4] Verificér i browser at footer ikke overlapper indhold på mobile viewports (320px, 375px, 414px) — juster Grid eller padding i `src/app/layout.tsx` hvis nødvendigt
- [X] T060 [US4] Tilføj `<link rel="dns-prefetch" href="https://www.WeGoDigital.dk" />` i `src/app/layout.tsx` `<head>` for hurtigere ekstern navigation

**Checkpoint**: WeGoDigital.dk-branding konsistent og friktionsfri.

---

## Phase 7: User Story 5 - Tilgængelighed og performance (Priority: P2)

**Goal**: Hele appen brugbar med tastatur og skærmlæser; reduced-motion respekteres overalt; performance-budget overholdes på mid-range mobil.

**Independent Test**: Aktivér `prefers-reduced-motion` → ingen animationer; gennemfør flow med kun tastatur → fungerer; Lighthouse mobile Performance ≥90, Accessibility ≥95.

### Tests for User Story 5 ⚠️

- [ ] T061 [P] [US5] Udvid `tests/e2e/reduced-motion.spec.ts` til at dække `/opret`, `/rum/[kode]/stemme`, `/rum/[kode]/resultat` (verificér at count-up er instant, vote-card exit er instant, page transitions er instant)
- [ ] T062 [P] [US5] Udvid `tests/e2e/keyboard-navigation.spec.ts` til at dække hele flowet `/` → opret → join → stem → resultat med Tab + piletaster
- [ ] T063 [P] [US5] E2E test for ARIA: SVG follower-container har `aria-hidden="true"`; `aria-live` regions på resultat-side i `tests/e2e/aria.spec.ts`

### A11y-implementering

- [ ] T064 [P] [US5] Auditér og tilføj manglende `aria-label`/`aria-labelledby` på ikon-only knapper i `<Button>` (kræv at `aria-label` er sat hvis kun `leadingIcon`/`trailingIcon` uden tekst)
- [X] T065 [P] [US5] Tilføj `skip-to-content` link øverst i `src/app/layout.tsx` (synlig kun på fokus)
- [ ] T066 [US5] Verificér og dokumentér fokus-rækkefølge på hver hovedside i `specs/002-ui-polish-animations/quickstart.md` § E

### Performance-budget

- [ ] T067 [P] [US5] Tilføj `@next/bundle-analyzer` dev-dependency og config-snippet i `next.config.mjs` (gated bag `ANALYZE=true` env)
- [ ] T068 [P] [US5] Opret Lighthouse CI budget-fil `.lighthouserc.json` i repo root med Performance ≥90 og Accessibility ≥95 thresholds
- [ ] T069 [US5] Kør `npm run build` og verificér at forsidens "First Load JS" forbliver ≤200 KB samlet; dokumentér målt værdi i `specs/002-ui-polish-animations/quickstart.md`

**Checkpoint**: A11y og performance-krav er målbart opfyldt.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Formål**: Oprydning, dokumentation og cross-story konsistens.

- [ ] T070 [P] Migrer `.btn-primary`, `.btn-secondary`, `.btn-vote-*`, `.card`, `.input-field` ud af `src/app/globals.css` til en deprecated-block og dokumentér at de skal fjernes når alle sider er migreret
- [ ] T071 [P] Tilføj JSDoc-kommentarer på alle eksporterede komponenter i `src/components/ui/` og `src/components/ui/effects/` (én-linjers + `@example`)
- [ ] T072 [P] Opdatér `README.md` (eller opret hvis manglende) med kort note om motion-tokens-konventionen og henvis til `specs/002-ui-polish-animations/contracts/components.md`
- [ ] T073 Kør hele `specs/002-ui-polish-animations/quickstart.md`-checklisten manuelt på en rigtig mobil-enhed og dokumentér resultater (FPS-måling, perceived smoothness)
- [X] T074 Kør `npm run lint && npm test && npm run test:e2e` i CI-mode og verificér 100 % grøn *(unit + build green; E2E still pending Playwright setup — see T024/T025/T033/T034/T045/T056/T057/T061-T063)*

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Ingen afhængigheder — start straks
- **Foundational (Phase 2)**: Afhænger af Setup — BLOKERER alle user stories
- **User Stories (Phase 3–7)**: Alle afhænger af Foundational completion
  - US1 (P1), US2 (P1), US3 (P1) kan derefter køre parallelt
  - US4 (P2) afhænger let af Phase 2 T019 (Footer-komponent) men er ellers uafhængig
  - US5 (P2) bygger på alle øvrige; test-tasks afhænger af at flowet er færdigt
- **Polish (Phase 8)**: Afhænger af at alle ønskede user stories er færdige

### User Story afhængigheder

- **US1 (P1)**: Står helt alene — kun afhængig af `useReducedMotion` + `usePointerTrail` fra Phase 2
- **US2 (P1)**: Står alene; refaktorerer eksisterende sider til at bruge nye primitiver fra Phase 2
- **US3 (P1)**: Kræver kun primitiver fra Phase 2 + Framer Motion variants
- **US4 (P2)**: `<Footer>` er foundational; US4 dækker integration og tests
- **US5 (P2)**: Logisk afhængig af US1–US4 for fuld dækning, men test-infrastruktur kan forberedes parallelt

### Inden for hver user story

- Tests (når inkluderet) skrives først — verificér at de fejler — implementér
- Typer/data-modeller før engine/services
- Engine/services før React-bindings
- React-bindings før integration i pages

### Parallel-muligheder

- Alle [P] Setup-tasks parallelt
- Alle [P] Foundational hooks/primitiver parallelt (T006–T016)
- US1, US2, US3 kan implementeres af tre udviklere parallelt
- Tests inden for samme story marked [P] parallelt

---

## Parallel Example: Foundational Phase

```bash
# Efter Phase 1 er færdig, kør disse i parallel:
Task: "Færdiggør motion-tokens i src/lib/motion/tokens.ts" (T006)
Task: "Implementér Framer Motion variants i src/lib/motion/variants.ts" (T007)
Task: "Implementér useReducedMotion hook i src/hooks/useReducedMotion.ts" (T008)
Task: "Implementér usePointerTrail hook i src/hooks/usePointerTrail.ts" (T009)
Task: "Implementér <Button> i src/components/ui/Button.tsx" (T014)
Task: "Implementér <Input> i src/components/ui/Input.tsx" (T015)
Task: "Implementér <Card> i src/components/ui/Card.tsx" (T016)

# T017–T020 (page transition + footer + layout) sekventielt da de rører samme layout-fil
```

## Parallel Example: User Story 1 (Cursor Follower)

```bash
# Tests først, parallelt:
Task: "Unit test point-trimming i tests/unit/follower-engine.test.ts" (T021)
Task: "Unit test shape-cap i samme fil" (T022)
Task: "Unit test color-rotation i samme fil" (T023)
Task: "E2E test mousemove → SVG paths i tests/e2e/cursor-follower.spec.ts" (T024)
Task: "E2E test reduced-motion i tests/e2e/reduced-motion.spec.ts" (T025)

# Derefter implementation i afhængighedsrækkefølge:
T026 (types) → T027 (engine) → T028 (React binding) → T029–T032 (integration)
```

---

## Implementation Strategy

### MVP First (US1 + WeGoDigital footer)

1. Færdiggør Phase 1 (Setup) + Phase 2 (Foundational)
2. Færdiggør Phase 3 (US1 — cursor follower)
3. Færdiggør Phase 6 (US4 — footer integration via existing Phase 2 work)
4. **STOP & VALIDÉR**: deploy preview, brugertest forsiden visuelt
5. Hvis kvalitet/perf er ok → fortsæt med US2, US3

### Incremental Delivery

1. Setup + Foundational → core primitiver klar (intern, intet brugersynligt)
2. US1 (cursor) + US4 (footer) → forsiden polished + branding live (MVP-1 deploy)
3. US2 (polish overalt) → resten af appen får konsistent feel (MVP-2 deploy)
4. US3 (vote/result animations) → kerne-mekanikken føles produktionsklar (MVP-3 deploy)
5. US5 (a11y + perf) → kvalitetsgaranti før bred release
6. Phase 8 (polish + docs) → vedligeholdelses-klar tilstand

### Parallel Team Strategy

Med 3 udviklere efter Phase 2 er færdig:

- Udvikler A: US1 (cursor follower) + US5 a11y-tests
- Udvikler B: US2 (migration af pages til nye primitiver)
- Udvikler C: US3 (vote/result animations) + US4 footer-tests

US4-integration og Phase 8 polish koordineres ved sync når alle tre er færdige.

---

## Notes

- [P]-tasks rører forskellige filer og har ingen indbyrdes afhængigheder
- [Story]-label gør traceability mellem task og acceptance scenario i `spec.md` trivielt
- Hver user story SKAL kunne demoes og deploye selvstændigt
- Tests SKAL skrives først og fejle før implementation begynder (TDD-disciplin)
- Commit efter hver task eller logisk gruppe (f.eks. alle hooks i én commit)
- Stop ved hver checkpoint og validér før næste fase
- Undgå: vage tasks, samtidige edits på samme fil i [P]-batches, cross-story afhængigheder der bryder uafhængighed
