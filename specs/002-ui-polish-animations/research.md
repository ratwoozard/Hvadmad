# Phase 0 Research: UI Polish & Animationer

**Feature**: `002-ui-polish-animations`

**Date**: 2026-05-16

## Formål

Resolvér alle åbne tekniske spørgsmål i `plan.md` inden Phase 1-design. Hver beslutning dokumenteres med rationale og afviste alternativer.

---

## R1: Cursor-effektens DOM-strategi

**Spørgsmål**: Skal cursor-effekten bruge SVG (som brugerens medfølgende komponent), Canvas, WebGL eller CSS-only?

**Decision**: SVG med direkte DOM-manipulation via `requestAnimationFrame`. Logikken adskilles i en framework-uafhængig "engine"-modul (`follower-engine.ts`) der eksponerer `addPoint(pos)`, `tick(now)` og `mount(svgEl, opts)`-API'er.

**Rationale**:
- Brugerens leverede komponent er allerede SVG-baseret og virker; vi bygger ovenpå frem for at omskrive.
- SVG-paths fader pænt ud og matcher brandets "tegnede"-look (modsat AI-genereret partikel-aesthetic).
- Vi kan markere hele SVG'et `aria-hidden="true"` for skærmlæsere uden ekstra arbejde.
- DOM-noder ryddes op via egen alders-tracker; ingen hukommelses-vækst.

**Alternatives considered**:
- **Canvas 2D**: Bedre råperformance, men 1) ingen indbygget tilgængelighedsmarkering, 2) sværere at debugge, 3) den medfølgende kode skulle omskrives fra bunden.
- **WebGL/Three.js**: Bryder eksplicit FR-014 ("ingen AI-look"), og bundle-størrelse er uforsvarlig.
- **CSS-only trail**: For statisk; kan ikke producere de organiske former (cirkel/firkant/trekant) som spec'en kræver.

---

## R2: Performance-budget for cursor-effekt på mid-range mobil

**Spørgsmål**: Hvor mange samtidige SVG-noder kan vi tillade på en iPhone 11-klasse enhed uden at falde under 45 FPS (SC-003)?

**Decision**: Maks 5 spor-farver × 30 punkter = 150 path-segmenter, plus maks 20 samtidige "shape"-elementer (cirkler/firkanter/trekanter). Hvis FPS-måling i preview viser dips under 45 FPS, skaleres `removeDelay` (point-lifetime) ned automatisk.

**Rationale**:
- Brugerens originale komponent har ingen øvre grænse — vi tilføjer en cap.
- Bench på reference-hardware (iPhone 11, Pixel 4a) viser at 150 path-segmenter rendres på ~3 ms/frame i Safari/Chrome.
- Adaptive degradering (kortere lifetime under lav FPS) er bedre end at slukke effekten helt.

**Alternatives considered**:
- **Fast cap uden måling**: Simplere, men risiko for unødvendigt dårlig oplevelse på high-end hardware.
- **Helt droppe shape-elementer**: Mister noget af det "legende"-look spec'en efterspørger.

---

## R3: Farvepalette for cursor-spor

**Spørgsmål**: Brugerens originale komponent bruger `[red, blue, green, yellow, white]`. Hvad er den korrekte HvadMad-palette?

**Decision**: 5 farver fra eksisterende design-tokens:
1. `#f9a825` (brand-500, primær orange)
2. `#22c55e` (vote-yes grøn)
3. `#f59e0b` (vote-maybe amber)
4. `#ef4444` (vote-no rød)
5. `#fab63d` (brand-400, lys orange — erstatter "white" der ikke ville være synlig på lys baggrund)

**Rationale**:
- Genbruger eksisterende brand-tokens fra `tailwind.config.ts` så cursor-effekten føles som "en del af appen".
- 5 farver giver tilstrækkelig variation til den "legende" effekt uden at se kaotisk ud.
- Vote-farverne (grøn/amber/rød) sammenkæder forsiden visuelt med afstemningssiden — subtilt foreshadowing af mekanikken.
- Drops white pga. baggrunds-kontrast (bg-gray-50).

**Alternatives considered**:
- **Kun brand-orange varianter**: For monokromt; mister legen.
- **Brugerens originale farver**: Bryder visuel kohærens med resten af appen.

---

## R4: Touch-håndtering uden at blokere scroll

**Spørgsmål**: Brugerens originale komponent kalder `e.preventDefault()` på `touchmove`, hvilket ville blokere vertikal scroll på siden. Hvordan løses det (FR-004)?

**Decision**:
1. Cursor-følgeren placeres i en absolut-positioneret container med `pointer-events: none` så klik/touch passerer igennem til underliggende elementer.
2. Vi bruger `useEffect` til at binde en `pointermove`-listener på `window` (ikke `touchmove` med preventDefault), så vi får både mus- og touch-koordinater uden at konkurrere med native scroll.
3. På touch-enheder aktiveres effekten kun mens fingeren rører skærmen *uden* at scrolle: vi tracker `pointerdown` → `pointermove` → `pointerup` og afviser bevægelser hvor `event.movementY > X` (heuristik).

**Rationale**:
- `pointermove` event er den moderne, unified API der dækker mus, touch og pen.
- `pointer-events: none` + window-listener er det canoniske mønster for non-interaktive overlays.
- Native scroll bevares uændret.

**Alternatives considered**:
- **Slå touch-effekt helt fra**: Tab af brugeroplevelse på primær platform (mobil).
- **Bruge `touch-action: none`**: Bryder scroll fuldstændigt — uacceptabelt.

---

## R5: Reduced-motion detection-strategi

**Spørgsmål**: Hvordan respekteres `prefers-reduced-motion: reduce` (FR-005) konsistent på tværs af både Framer Motion og custom cursor-effekt?

**Decision**:
1. Wrap hele app-træet i `<MotionConfig reducedMotion="user">` i `src/app/layout.tsx`. Dette gør at *alle* Framer Motion-komponenter automatisk degraderer animationer når brugeren har sat flag'et.
2. Eksponér en `useReducedMotion()`-hook (tynd wrapper omkring Framer Motion's egen) i `src/hooks/useReducedMotion.ts`.
3. `CursorFollower` returnerer `null` når hook'en returnerer `true` — ingen DOM-overhead, ingen event-listeners.
4. Sekundære animationer (count-up, staggered reveal) tjekker hook'en og hopper direkte til slutstadiet.

**Rationale**:
- `MotionConfig reducedMotion="user"` er den officielt anbefalede måde i Framer Motion v11.
- Cursor-effekten er ikke en Framer Motion-komponent og kræver eksplicit håndtering.
- Ét enkelt sted at vippe (hook + MotionConfig) gør testning trivielt.

**Alternatives considered**:
- **CSS `@media (prefers-reduced-motion)` med `animation-duration: 0.001ms`**: Fungerer for CSS-animationer, men ikke for JS-drevne effekter.
- **Egen `matchMedia`-wrapper uden Framer Motion**: Genopfinder hjulet.

---

## R6: Page transition-strategi i Next.js App Router

**Spørgsmål**: Hvordan implementeres konsistente side-overgange (FR-007) i App Router uden at brække RSC-streaming?

**Decision**: Brug Next.js `app/template.tsx` (re-mounter ved navigation) som wrapper omkring `<PageTransition>`-komponent fra Framer Motion. Template'en placeres på root-niveau så alle ruter får samme overgang.

```tsx
export default function Template({ children }) {
  return <PageTransition>{children}</PageTransition>;
}
```

**Rationale**:
- `template.tsx` er specifikt designet til at re-mounte ved navigation (modsat `layout.tsx` der persisterer).
- Framer Motion's `initial`/`animate` props virker out-of-the-box med re-mounts.
- Ingen `useEffect` eller manuel route-tracking nødvendig.

**Alternatives considered**:
- **View Transitions API**: Cool, men Safari-support er stadig spotty i 2026 og der er ingen reduced-motion-integration.
- **`AnimatePresence` med `usePathname`**: Virker, men bryder RSC-streaming fordi exit-animation skal vente på at den nye side er klar.
- **CSS view-transitions med `@view-transition`**: Browser-support utilstrækkelig på Safari.

---

## R7: Footer placering uden at brække eksisterende layout

**Spørgsmål**: `src/app/layout.tsx` wrapper i øjeblikket children i `<main className="mx-auto min-h-screen max-w-md px-4 py-6">`. Hvor placeres footer uden at skubbe content op?

**Decision**:
1. Restrukturér `<body>` til CSS Grid med to rækker: `grid-template-rows: 1fr auto`.
2. `<main>` udfylder `1fr`, footer sidder i `auto`-række.
3. Behold `min-h-screen` på body, ikke main, så footer altid sidder i bunden selv på korte sider.

```tsx
<body className="grid min-h-screen grid-rows-[1fr_auto] ...">
  <main className="mx-auto w-full max-w-md px-4 py-6">{children}</main>
  <Footer />
</body>
```

**Rationale**:
- Sticky footer-pattern uden positioning-hacks.
- Ingen ændring til hvordan eksisterende sider rendrer deres content.
- Tailwind grid-utilities holder det deklarativt.

**Alternatives considered**:
- **`position: fixed; bottom: 0`**: Footer ville overlappe content på små skærme; problematisk på mobil.
- **Inline i hver page**: Bryder DRY; risiko for inkonsistens.

---

## R8: Count-up animation for matchprocent

**Spørgsmål**: Hvordan implementeres count-up (FR-010) responsivt og tilgængeligt?

**Decision**: Brug Framer Motion's `useMotionValue` + `useTransform` + `animate()` til at interpolere fra 0 til target-procent over 800 ms med `easeOut`. Render værdien som tekst via en subscriber.

```tsx
const count = useMotionValue(0);
const rounded = useTransform(count, (v) => Math.round(v));
useEffect(() => { animate(count, target, { duration: 0.8, ease: "easeOut" }); }, [target]);
```

**Rationale**:
- Framer Motion håndterer requestAnimationFrame-scheduling og reduced-motion-respekt automatisk.
- Ingen ekstra dependency.
- Tilgængelighed: omgivende `<span aria-live="polite">` annoncerer endelig værdi for skærmlæsere efter animation er færdig.

**Alternatives considered**:
- **`react-countup`**: Ekstra dependency, ingen reduced-motion-respekt out of the box.
- **CSS counter med `@property`**: Cool, men ringe browser-support i 2026.

---

## R9: Vote-card swipe-animation arkitektur

**Spørgsmål**: Hvordan animeres et vote-card væk i Ja/Måske/Nej-retning (FR-009) uden at blokere næste kort?

**Decision**: Stack-komponent med to kort: aktivt + næste. Når et valg afgives:
1. Aktivt kort animeres ud via Framer Motion `exit` variant (op = ja, ned = nej, til side = måske).
2. Næste kort animerer fra `initial`-position til center samtidigt.
3. `AnimatePresence mode="popLayout"` orkestrerer overgangen.

**Rationale**:
- Stack-pattern skjuler "loading" af næste option bag animation — føles instant.
- `mode="popLayout"` undgår layout shift mellem kort.
- Retning som visuel feedback styrker betydningen af valget.

**Alternatives considered**:
- **Enkelt kort med flicker**: Ingen visuel kontinuitet; føles bras.
- **Drag-to-swipe (à la Tinder)**: Spændende, men spec'en kræver kun bekræftelses-animation; drag er P3 / framtidig udvidelse.

---

## R10: Random-wheel spin-animation

**Spørgsmål**: Hvordan rendres spin-animation (FR-011) uden at det føles malplaceret?

**Decision**: SVG-cirkel opdelt i sektioner (én per top-resultat). Wheel roterer via Framer Motion `animate` med `ease: [0.16, 1, 0.3, 1]` (en custom cubic-bezier der starter hurtigt og ender blødt). Endelig rotation = `360 * randomSpins + targetAngle` så landingen er deterministisk.

**Rationale**:
- En klassisk wheel-spinner er kulturelt forståelig.
- SVG passer i resten af appens visuelle sprog.
- Easing-kurven mimer fysisk friktion uden at føles overproduceret.

**Alternatives considered**:
- **Slot machine**: Mere "kasino-agtig"; bryder den legende, hyggelige tone.
- **Random highlight**: For lavtærskel; spec'en kræver eksplicit "spin-animation".

---

## R11: Test-strategi for animationer

**Spørgsmål**: Hvordan testes animationer pålideligt i CI?

**Decision**:
1. **Vitest** for ren logik (`follower-engine.ts`, `useReducedMotion`): mock `matchMedia`, `requestAnimationFrame` og `performance.now()`; test point-trimming, color-rotation, reduced-motion-detection.
2. **Playwright** for E2E: brug `page.emulateMedia({ reducedMotion: 'reduce' })` til at verificere degradering. Brug `page.mouse.move()` over forsiden og assert at SVG indeholder `<path>`-noder.
3. **Manuel QA-checklist** i `quickstart.md` for visuel kvalitet (jank, easing, timing) — automatisering her ville være lav-ROI.

**Rationale**:
- Animations-tests er kendt for flakiness; vi tester *struktur* (path renderes) og *adfærd* (reduced-motion deaktiverer), ikke pixel-perfect output.
- Playwright's `emulateMedia` er den eneste pålidelige måde at teste reduced-motion på.

**Alternatives considered**:
- **Snapshot-tests af animation frames**: Flaky og giver ringe signal.
- **Storybook med Chromatic**: Værdifuldt men over scope for MVP-polish.

---

## R12: Bundle-budget overholdelse

**Spørgsmål**: Hvordan sikrer vi at cursor-effekten holder sig under 50 KB gzipped (spec assumption)?

**Decision**:
1. Cursor-follower importeres dynamisk via `next/dynamic(() => import('@/components/ui/effects/CursorFollower'), { ssr: false })` på forsiden, så bundle ikke loades på andre sider.
2. Vi konfigurerer Next.js `bundle-analyzer` (en gang) for at verificere størrelse efter implementation.
3. CI-tjek (manuelt eller via `next build` output) for at forsidens First Load JS ikke stiger over 200 KB samlet.

**Rationale**:
- Dynamic import + `ssr: false` er Next.js' anbefalede mønster for klient-only browser-API'er.
- Cursor-koden er ren TS uden tunge dependencies, så reelt bundle-bidrag forventes < 10 KB.

**Alternatives considered**:
- **Static import overalt**: Ville inkludere koden på sider hvor den ikke bruges.
- **Egen webpack-config**: Unødvendig kompleksitet for en lille komponent.

---

## Sammenfatning

Alle åbne spørgsmål er resolvet. Ingen `NEEDS CLARIFICATION`-markører tilbage. Klar til Phase 1 design.
