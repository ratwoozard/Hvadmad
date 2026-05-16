# Implementation Plan: UI Polish & Animationer

**Branch**: `002-ui-polish-animations` | **Date**: 2026-05-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-ui-polish-animations/spec.md`

## Summary

Hæv perceived kvalitet af HvadMad ved at (1) tilføje et legende, taktilt SVG-cursor-spor på forsiden, (2) standardisere mikro-interaktioner og side-overgange på tværs af hele flowet med Framer Motion, og (3) integrere et diskret WeGoDigital.dk-branding-link i en delt footer. Polishen må ikke ændre eksisterende MVP-funktionalitet, må ikke introducere "AI-genereret" æstetik, og skal respektere `prefers-reduced-motion` samt mobile performance-budget.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)

**Primary Dependencies**:
- Next.js 14+ (App Router) — allerede installeret
- React 18+ — allerede installeret
- Tailwind CSS 3.x — allerede installeret (custom tokens i `tailwind.config.ts`)
- Framer Motion 11.x — allerede installeret (anvendes i denne feature for første gang)
- Ingen nye runtime-afhængigheder for cursor-effekten (rent React + SVG + native DOM API'er)

**Storage**: N/A — denne feature persisterer ingen data.

**Testing**:
- Vitest for komponent-logik (reducer-funktioner, `prefers-reduced-motion`-detection)
- Playwright for E2E (cursor-effekt rendering, hover/focus-states, footer-link på tværs af sider)
- Manual visuel QA på mindst 3 skærmstørrelser (320px, 375px, 414px) + desktop

**Target Platform**: Web (mobile-first), deployed on Vercel. Browser-support: seneste 2 versioner af Chrome, Safari, Firefox, Edge.

**Project Type**: Web application (fullstack Next.js) — fortsætter struktur fra `001-hvadmad-mvp`.

**Performance Goals**:
- Cursor-effekt holder ≥45 FPS på iPhone 11-klasse hardware
- Side-overgange afsluttes inden for 400 ms
- Lighthouse Performance ≥90 (mobile) på forsiden efter cursor-effekten er tilføjet
- Initial bundle på forsiden vokser maks 50 KB gzipped pga. cursor-komponent

**Constraints**:
- Ingen "AI-look" (ingen gradient-glows, neon, shimmering tekst, partikel-orbs)
- Cursor-effekten må aldrig blokere klik, touch eller scroll på underliggende elementer
- Alle dekorative animationer SKAL respektere `prefers-reduced-motion: reduce`
- Polish må ikke ændre eksisterende funktionel adfærd fra `001-hvadmad-mvp`
- Touch-targets ≥44px (konstitution: Mobile-First)

**Scale/Scope**: Påvirker ca. 6 hovedsider (forside, opret, join, lobby, afstemning, resultat) og alle delte UI-primitiver i `src/components/ui/`. Ingen nye ruter, ingen nye databasetabeller.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princip | Status | Noter |
|---------|--------|-------|
| I. MVP-First | ✅ PASS | Polish supporterer kerneflowet (opret→join→stem→resultat) ved at hæve oplevelsen — ændrer ikke scope. Spec'en flagger eksplicit (FR-016) at MVP-adfærd ikke ændres. |
| II. Mobile-First | ✅ PASS | Spec kræver touch-support for cursor-effekt (FR-002), 44px touch-target for footer-link (FR-013), og mobile FPS-budget (SC-003). |
| III. No-Login-First | ✅ PASS | Ingen login-relateret ændring. |
| IV. Privacy-Light | ✅ PASS | Ingen ny datainnsamling. Footer-link åbner i ny fane uden tracking-params. |
| V. Realtime Clarity | ✅ PASS | Realtime-liste-animationer (FR-008) forbedrer klarhed — gør tilstandsovergange mere synlige, ikke mindre. |
| VI. Decision Quality | ✅ PASS | Count-up på matchprocent (FR-010) og sekventiel afsløring af top-3 styrker brugerens forståelse af resultatet. |
| VII. Strong Dislikes Matter | ✅ PASS | Ingen ændring af algoritme. Stemme-bekræftelses-animation (FR-009) gør "Nej" lige så tydeligt som "Ja". |
| VIII. Danish-First UX | ✅ PASS | Ingen nye tekster nødvendige; eksisterende dansk copy bevares. |
| IX. Spec-Before-Code | ✅ PASS | Spec → plan → tasks workflow følges. |

**Resultat**: Alle gates består uden undtagelser. Ingen poster i Complexity Tracking-tabellen.

## Project Structure

### Documentation (this feature)

```text
specs/002-ui-polish-animations/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (N/A — ingen nye entiteter)
├── quickstart.md        # Phase 1 output (manuel + automatiseret QA-guide)
├── contracts/
│   └── components.md    # UI-komponent-kontrakter (props, ARIA, motion-tokens)
├── checklists/
│   └── requirements.md  # Specification quality checklist
└── tasks.md             # Phase 2 output (genereres af /speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx                       # Tilføj Footer-komponent + motion-config-provider
│   ├── page.tsx                         # Wrap hero med CursorFollower
│   ├── opret/page.tsx                   # Adoptér PolishedButton/Input
│   ├── join/[kode]/page.tsx             # Adoptér PolishedButton/Input
│   ├── solo/page.tsx                    # Adoptér polish-primitiver
│   └── rum/[kode]/
│       ├── lobby.tsx                    # AnimatePresence for deltagerliste
│       ├── stemme.tsx                   # Vote-card swipe-animation
│       └── resultat.tsx                 # Count-up + staggered reveal
├── components/
│   ├── ui/
│   │   ├── Footer.tsx                   # NY — WeGoDigital.dk-link
│   │   ├── MotionConfig.tsx             # NY — Framer Motion provider med reduced-motion
│   │   ├── PageTransition.tsx           # NY — fade/slide wrapper til app/template.tsx
│   │   ├── Button.tsx                   # NY — afløser .btn-primary/secondary CSS-klasser
│   │   ├── Input.tsx                    # NY — afløser .input-field CSS-klasse
│   │   ├── Card.tsx                     # NY — afløser .card CSS-klasse
│   │   ├── FocusRing.tsx                # NY — delt fokus-ring util
│   │   ├── ConnectionLost.tsx           # EKSISTERER — let polish, ingen breaking change
│   │   └── effects/
│   │       ├── CursorFollower.tsx       # NY — SVG-cursor-effekt (forside)
│   │       ├── follower-engine.ts       # NY — testbar drift/cleanup-logik
│   │       └── follower.types.ts        # NY — interne typer (Position, Point)
│   ├── voting/
│   │   ├── VoteCard.tsx                 # NY/refactor — swipe-bekræftelses-animation
│   │   └── VoteProgress.tsx             # NY — animeret progress-indikator
│   ├── results/
│   │   ├── MatchScoreCounter.tsx        # NY — count-up komponent
│   │   ├── ResultRow.tsx                # NY — staggered reveal
│   │   └── RandomWheel.tsx              # NY — spin-animation
│   └── room/                            # EKSISTERER — bevares
├── hooks/
│   ├── useReducedMotion.ts              # NY — wrapper omkring Framer Motion's hook
│   └── usePointerTrail.ts               # NY — abstraktion over mouse/touch event-binding
├── lib/
│   └── motion/
│       ├── tokens.ts                    # NY — delte easing/duration-konstanter
│       └── variants.ts                  # NY — genbrugelige Framer Motion variants
└── styles/
    └── (globals.css — udvides, ikke flyttes)

tests/
├── unit/
│   ├── follower-engine.test.ts          # NY — drift, cleanup, point-trimming
│   └── useReducedMotion.test.ts         # NY — matchMedia mock
└── e2e/
    ├── cursor-follower.spec.ts          # NY — mousemove → SVG path renderes
    ├── footer-link.spec.ts              # NY — link findes på alle sider, åbner ny fane
    ├── reduced-motion.spec.ts           # NY — emuler prefers-reduced-motion, verificér deaktivering
    └── keyboard-navigation.spec.ts      # NY — hele flowet med tastatur
```

**Structure Decision**: Behold den eksisterende Next.js-app-struktur fra `001-hvadmad-mvp`. Polish-laget tilføjes som:
1. **Nye delte primitiver** i `src/components/ui/` (Button, Input, Card, Footer, PageTransition).
2. **Isoleret effekt-modul** i `src/components/ui/effects/` for cursor-follower (separation gør testning + tree-shaking nemmere).
3. **Motion-tokens** i `src/lib/motion/` så timings/easing er ét sted (DRY).
4. **Hooks** i `src/hooks/` for genbrugelig pointer-/reduced-motion-logik.

CSS-klasserne `.btn-primary`, `.btn-secondary`, `.input-field`, `.card` i `globals.css` migreres gradvist til React-komponenter — den eksisterende `globals.css` beholdes som fallback i overgangen så MVP-sider ikke knækker.

## Architecture Decisions

### 1. Framer Motion som primær animations-runtime

**Decision**: Brug Framer Motion 11 (allerede installeret) til alle komponent-niveau animationer (knapper, kort, page transitions, list animations, count-up).

**Rationale**:
- Indbygget `useReducedMotion`-hook løser tilgængelighedskravet (FR-005).
- `AnimatePresence` håndterer enter/exit-animationer for lister (FR-008) uden manuel state-tracking.
- Layout-animations gør realtime-list-updates "gratis".
- Bundle-størrelse acceptabel (~30 KB gzipped) og tree-shakeable.

**Alternative rejected**:
- Ren CSS + Tailwind animations — virker til simple cases, men kan ikke håndtere exit-animationer eller orkestrerede sekvenser.
- GSAP — kraftigt, men ekstra licens-kompleksitet og større bundle for hvad vi har brug for.
- Auto-animate — for begrænset til vote-card swipes og count-up.

### 2. Custom SVG-cursor-follower (ingen Framer Motion)

**Decision**: Implementér cursor-effekten som en selvstændig React-komponent der direkte manipulerer SVG via `requestAnimationFrame` — uden Framer Motion.

**Rationale**:
- Effekten kører ved 60 FPS med potentielt hundredevis af SVG-noder; Framer Motion's reconciler ville være en flaskehals.
- Brugerens medfølgende `SVGFollower`-komponent har allerede en velfungerende drift/cleanup-algoritme; vi refaktorerer den (ikke kopierer den 1:1) til at: bruge HvadMad-brandfarver, lytte til `prefers-reduced-motion`, og rydde DOM op aggressivt.
- Logik adskilles i `follower-engine.ts` (ren TS, testbar) fra `CursorFollower.tsx` (React-binding).

**Alternative rejected**:
- Canvas-baseret partikelsystem — ville opfylde performance-kravet bedre, men SVG passer bedre med brandets "tegnede" æstetik og er nemmere at gøre tilgængelig (vi kan markere container som `aria-hidden`).
- WebGL/Three.js — gigantisk overkill, falder ind under "AI-look" som spec'en eksplicit forbyder.

### 3. Page transitions via `app/template.tsx`

**Decision**: Brug Next.js App Router's `template.tsx` (re-mounts ved navigation) wrappet i en `PageTransition` Motion-komponent.

**Rationale**:
- Templates re-mounter ved hver navigation (i modsætning til `layout.tsx`), hvilket er præcist hvad Framer Motion's enter-animationer kræver.
- Centraliseret — ingen behov for at wrappe hver page individuelt.
- Respekterer `prefers-reduced-motion` automatisk gennem `MotionConfig`-providerens `reducedMotion="user"`-prop.

**Alternative rejected**:
- View Transitions API — fed teknologi, men dårlig Safari-support pr. 2026 og ingen reduced-motion-integration ud af boksen.
- Per-page wrapper — for meget boilerplate, øger risiko for inkonsistens.

### 4. Polish-primitiver som React-komponenter (ikke kun Tailwind-klasser)

**Decision**: Erstat `.btn-primary`, `.btn-secondary`, `.input-field`, `.card` CSS-klasser med React-komponenter (`<Button>`, `<Input>`, `<Card>`).

**Rationale**:
- Centraliserer alle states (hover/focus/active/disabled) ét sted (FR-006, SC-001).
- Tillader at indlejre Framer Motion `whileTap`/`whileHover` uden at gentage props.
- Garanterer konsistent ARIA-handling (focus-ring, disabled-state, loading-state).
- TypeScript fanger forkert brug ved compile-time.

**Alternative rejected**:
- Behold CSS-klasser og tilføj `data-state`-attributter — virker, men giver intet TypeScript-værn og ingen central kontrol over motion.
- Headless UI / Radix — for stort dependency-fodaftryk for vores enkle behov.

### 5. Footer som del af root layout

**Decision**: Tilføj `<Footer />` i `src/app/layout.tsx` så den vises på *alle* sider automatisk.

**Rationale**:
- Opfylder FR-012 (link på hver side) uden manuel placering.
- WeGoDigital.dk-link skal være persistent branding, ikke en per-page-beslutning.
- Sticky bunden via CSS Grid på `<body>` så footeren altid sidder nede, selv på korte sider.

**Alternative rejected**:
- Per-page footer — risiko for at glemme det på en side; bryder DRY.
- Floating badge — risiko for at blokere indhold på små skærme; vil føles påtrængende.

### 6. Reduced-motion som første-klasses borger

**Decision**: Wrap hele app-træet i `<MotionConfig reducedMotion="user">` så Framer Motion automatisk respekterer brugerens systempræference. Cursor-follower lytter eksplicit til vores egen `useReducedMotion`-hook og rendres ikke ved `reduce`.

**Rationale**:
- Tilgængelighed er ikke en eftertanke; spec'en (FR-005, SC-005) gør det til et hårdt krav.
- Framer Motion's `"user"`-mode degraderer animationer korrekt uden manuel kode pr. komponent.
- Centraliseret kontrol — én flag at vippe i tests.

**Alternative rejected**:
- Per-komponent `useReducedMotion`-tjek — mere kode, højere fejlrisiko.
- Helt droppe animationer for alle — kunne være en idé, men spec'en ønsker effekten for det generelle publikum.

## Complexity Tracking

> Tom — alle constitution gates består uden undtagelser.

Ingen begrundelse nødvendig.

## Deployment Strategy

1. **Platform**: Vercel (uændret fra MVP)
2. **Feature flag**: Cursor-effekten gates bag en env-variabel `NEXT_PUBLIC_ENABLE_CURSOR_EFFECT` (default: `true`) så vi nemt kan slå den fra hvis en produktionsbug opstår.
3. **Rollout**: Polish kan merges når MVP-kerneflowet er funktionelt — de to features deler ingen kode i `lib/match/` eller `lib/supabase/`, så merge-konflikter er minimale.
4. **Monitoring**: Vercel Analytics (allerede aktiv) overvåger Web Vitals; vi sætter en Lighthouse CI-budget-fil for at fange regression i Performance-score.
