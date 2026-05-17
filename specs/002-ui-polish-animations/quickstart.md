# Quickstart: UI Polish & Animationer

**Feature**: `002-ui-polish-animations`

**Date**: 2026-05-16

## Formål

Trin-for-trin guide til at verificere at polish-featuren fungerer som specificeret. Anvendes både til lokal udvikling og som regression-checklist før deploy.

## Forudsætninger

- Node.js 20+ installeret
- Projektet klonet og dependencies installeret (`npm install`)
- `.env.local` konfigureret med Supabase-credentials (kun nødvendigt for fuld E2E-test; cursor-effekt og polish kan testes uden Supabase)
- Browser med DevTools åbnet (Chrome eller Firefox anbefales for `prefers-reduced-motion`-emulering)

## Lokal start

```powershell
npm run dev
# Åbn http://localhost:3000
```

---

## Verifikations-checklist

Følg afsnittene i rækkefølge — hvert afsnit dækker én user story fra spec'en.

### A. Cursor-effekt på forsiden (US1)

**Mål**: Bekræft at SVG-cursor-effekten kører, performer godt og opfører sig korrekt.

1. **Visual check (desktop)**
   - [ ] Åbn `http://localhost:3000` på desktop.
   - [ ] Bevæg musen henover hero-området.
   - [ ] Verificér: et farvet spor af linjer følger cursoren.
   - [ ] Verificér: enkelte cirkler, firkanter, trekanter spawner og fader ud.
   - [ ] Verificér: sporet forsvinder inden for ~0.5 sekund efter du stopper.

2. **Visual check (touch)**
   - [ ] Åbn samme URL på mobil eller via Chrome DevTools' device emulering.
   - [ ] Stryg fingeren henover hero-området.
   - [ ] Verificér: samme effekt som desktop, ingen scroll-blokering.

3. **Pass-through af klik**
   - [ ] Bevæg musen så et synligt spor er aktivt over "Opret madrum"-knappen.
   - [ ] Klik på knappen.
   - [ ] Verificér: navigation til `/opret` sker uden forsinkelse.

4. **Performance**
   - [ ] Åbn DevTools → Performance-fane.
   - [ ] Start optagelse, bevæg musen aggressivt i 10 sekunder, stop.
   - [ ] Verificér: gennemsnitlig FPS ≥45 (mid-range hardware) / ≥55 (high-end).
   - [ ] Verificér: ingen `Long task` >50 ms.

5. **Memory stability**
   - [ ] Åbn DevTools → Memory-fane → tag heap-snapshot 1.
   - [ ] Bevæg musen kontinuerligt i 5 minutter (eller brug en script-loop).
   - [ ] Tag heap-snapshot 2.
   - [ ] Verificér: detached SVG-nodes < 50 (ingen monoton vækst).

6. **Reduced motion**
   - [ ] DevTools → kommando-palet (Ctrl+Shift+P) → "Emulate CSS prefers-reduced-motion" → "reduce".
   - [ ] Genindlæs forsiden.
   - [ ] Verificér: ingen cursor-effekt; ingen SVG-elementer renderes.
   - [ ] Verificér: knapper og indhold fungerer normalt.

7. **Browser-fallback**
   - [ ] Slå JavaScript fra i browser-indstillinger.
   - [ ] Genindlæs.
   - [ ] Verificér: forsiden viser hero, knapper og footer korrekt (SSR-rendret); ingen cursor-effekt (forventet).

---

### B. Polerede interaktioner overalt (US2)

**Mål**: Bekræft at hver klikbar komponent har konsistent hover/focus/active/disabled-state.

1. **Knapper**
   - For hver knap i appen (`/`, `/opret`, `/join/[kode]`, `/solo`, `/rum/[kode]`):
     - [ ] Hover ændrer baggrund blødt over ~180 ms.
     - [ ] Tab-fokus viser synlig fokus-ring (brand-300, 2px offset).
     - [ ] Klik giver kort `scale(0.96)`-feedback.
     - [ ] Disabled-state: 50 % opacity, ingen hover-respons.

2. **Input-felter**
   - [ ] Hover på inputs: border ændrer farve over 150 ms.
   - [ ] Focus: border bliver brand-orange + ring vises.
   - [ ] Error-state: border bliver rød, fejlbesked vises under inputtet.

3. **Side-overgange**
   - [ ] Naviger fra `/` → `/opret`. Verificér: blød fade/slide (220 ms).
   - [ ] Tryk tilbage. Verificér: blød exit-animation (160 ms).
   - [ ] Gentag for `/` → `/join/TEST` og `/` → `/solo`.

4. **Realtime-liste-animationer**
   - [ ] Start lokal Supabase-stack: `npx supabase start`.
   - [ ] Åbn `/rum/[kode]/lobby` i to faner.
   - [ ] Join fra fane 2 med nyt nickname.
   - [ ] Verificér i fane 1: ny deltager glider blødt ind nedefra (ikke "popper").

---

### C. Stemme- og resultat-animationer (US3)

**Mål**: Bekræft vote-card swipes, count-up og staggered reveal.

1. **Vote-card swipe**
   - [ ] Start en afstemning lokalt (eller solo-mode på `/solo`).
   - [ ] Tryk "Ja" på et kort.
   - [ ] Verificér: kortet flyver opad og roterer let venstre.
   - [ ] Tryk "Nej" på næste kort.
   - [ ] Verificér: kortet flyver nedad og roterer let højre.
   - [ ] Tryk "Måske" på næste kort.
   - [ ] Verificér: kortet flyver til højre med større rotation.

2. **Count-up på matchprocent**
   - [ ] Gennemfør en afstemning til resultatsiden.
   - [ ] Verificér: top-1's procent tæller op fra 0 til endelig værdi over ~800 ms.
   - [ ] Verificér: tallet er afrundet til hele procent (ingen flickering decimaler).

3. **Staggered reveal**
   - [ ] På resultatsiden, observer top-3-listen.
   - [ ] Verificér: række 1 vises først, derefter række 2 (150 ms efter), derefter række 3.

4. **Random wheel**
   - [ ] Tryk "Spin hjulet" (eller tilsvarende knap).
   - [ ] Verificér: et hjul roterer over ~3 sekunder med decelerating easing.
   - [ ] Verificér: hjulet stopper på et af top-resultaterne.

---

### D. WeGoDigital.dk footer (US4)

**Mål**: Bekræft branding-link er til stede og funktionelt overalt.

1. **Tilstedeværelse**
   - [ ] For hver side (`/`, `/opret`, `/join/TEST`, `/solo`, `/rum/[kode]`):
     - [ ] Scroll til bunden.
     - [ ] Verificér: footer indeholder linket "Bygget af WeGoDigital.dk".

2. **Link-adfærd**
   - [ ] Klik på linket.
   - [ ] Verificér: åbner i ny fane.
   - [ ] Verificér: URL er præcis `https://www.WeGoDigital.dk` (case-sensitive).
   - [ ] Verificér i DevTools: anchor-tag har `target="_blank"` og `rel="noopener noreferrer"`.

3. **Touch target**
   - [ ] Inspicér linket på mobil-emulering.
   - [ ] Verificér: tappable area ≥44×44 px (kan måles i DevTools' computed-pane).

4. **Hover-state**
   - [ ] Hover med musen.
   - [ ] Verificér: farveskift fra `gray-400` → `gray-600` over 150 ms.

---

### E. Tilgængelighed og performance (US5)

**Mål**: Bekræft at appen er brugbar med tastatur, skærmlæser og lav-performance enheder.

1. **Tastaturnavigation**
   - [ ] Start på `/` og brug kun Tab/Shift+Tab.
   - [ ] Verificér: alle interaktive elementer kan nås.
   - [ ] Verificér: fokus-rækkefølge er logisk (top→bund, venstre→højre).
   - [ ] Verificér: fokus-ringen er altid synlig.
   - [ ] Gennemfør hele flowet (opret → join → stem → resultat) uden mus.

2. **Skærmlæser**
   - [ ] Aktivér NVDA (Windows) eller VoiceOver (Mac).
   - [ ] Naviger gennem forsiden.
   - [ ] Verificér: cursor-effektens SVG annonceres IKKE (er `aria-hidden`).
   - [ ] Verificér: alle knapper og links har meningsfulde labels på dansk.
   - [ ] På resultatsiden: verificér at den endelige matchprocent annonceres via `aria-live`.

3. **Reduced motion (alle sider)**
   - [ ] Aktivér `prefers-reduced-motion: reduce`.
   - [ ] Gennemfør hele flowet.
   - [ ] Verificér: ingen dekorative animationer kører.
   - [ ] Verificér: app er stadig fuldt funktionel.

4. **Lighthouse**
   - [ ] Kør Lighthouse på `/` i incognito + throttled mobile.
   - [ ] Verificér: Performance ≥90, Accessibility ≥95.

---

## Automatiserede tests

```powershell
# Unit tests (Vitest) — follower-engine, hooks
npm test

# E2E tests (Playwright) — cursor effekt, footer-link, reduced-motion
npm run test:e2e
```

**Forventet output**:
- Alle Vitest-tests består.
- Alle Playwright-tests består, inkl.:
  - `cursor-follower.spec.ts`: SVG indeholder `<path>`-elementer efter mousemove.
  - `footer-link.spec.ts`: link findes med korrekt `href` på alle hovedruter.
  - `reduced-motion.spec.ts`: SVG-elementer er fraværende når reduced-motion er emuleret.
  - `keyboard-navigation.spec.ts`: hele flowet gennemføres uden mus.

---

## Build-verifikation

```powershell
npm run build
```

**Forventet**:
- Build lykkes uden fejl eller warnings (udover ekstern dep deprecation noise).
- `next build` output viser at forsidens "First Load JS" ikke overstiger 200 KB.
- Ingen TypeScript-fejl.

---

## Deploy

Featuren er klar til preview-deploy når:

- [ ] Alle ovenstående checks består lokalt.
- [ ] CI er grøn (Vitest + Playwright + `npm run lint`).
- [ ] Lighthouse-budget overholdt på Vercel preview-URL.
- [ ] Manuel QA på en rigtig mobil-enhed bekræfter performance og touch-effekt.

---

## Fejlsøgning

| Symptom | Sandsynlig årsag | Fix |
|---------|------------------|-----|
| Cursor-effekt synes ikke | Tjek at `prefers-reduced-motion` ikke er aktiv i OS | Slå reduced-motion fra i Windows Indstillinger → Tilgængelighed → Visuelle effekter |
| Klik registreres ikke på forsidens knapper | `pointer-events` ikke sat på SVG-lag | Verificér `<svg style="pointer-events: none">` i DOM |
| FPS-drop under cursor-effekt | For mange samtidige SVG-nodes | Sænk `maxShapes` eller `removeDelay` i `CursorFollower`-props |
| Memory grows over time | Cleanup-loop fejler | Tjek at `useEffect`-cleanup faktisk fjerner alle SVG-noder ved unmount |
| Side-overgange "hopper" hårdt | `template.tsx` mangler eller `MotionProvider` ikke wrapper appen | Verificér struktur i `src/app/layout.tsx` og `src/app/template.tsx` |
| Footer overlapper indhold på korte sider | CSS Grid ikke korrekt sat | Verificér `grid-template-rows: 1fr auto` på `<body>` |
