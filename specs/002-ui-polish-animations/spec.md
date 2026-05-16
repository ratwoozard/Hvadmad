# Feature Specification: UI Polish & Animationer

**Feature Branch**: `002-ui-polish-animations`

**Created**: 2026-05-16

**Status**: Draft

**Input**: Udvid de nuværende funktioners animationer (ikke "AI-look"), polér alle elementer, tilføj WeGoDigital.dk-branding-link og placér en interaktiv SVG-cursor-effekt på forsiden.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Levende, legende forside med cursor-effekt (Priority: P1)

En førstegangsbesøgende lander på HvadMad.dk. Allerede inden de klikker på noget, mærker de at appen er sjov og levende: musen efterlader et farverigt, organisk spor af linjer og små geometriske former (cirkler, firkanter, trekanter) der drifter væk og fader ud. På touch-enheder genereres samme effekt af fingerens bevægelse. Effekten føles legende — ikke teknisk, ikke AI-genereret.

**Why this priority**: Forsiden er det første indtryk og afgør om brugeren overhovedet trykker "Opret madrum". En unik, taktil oplevelse differentierer HvadMad fra generiske afstemnings-apps og forstærker brandets "social og sjov"-positionering.

**Independent Test**: Kan testes ved at åbne forsiden på desktop og mobil, bevæge cursor/finger rundt og verificere at et farverigt spor og tilfældige former animeres og forsvinder igen uden at blokere klik på knapperne nedenunder.

**Acceptance Scenarios**:

1. **Given** en bruger åbner forsiden på desktop, **When** de bevæger musen henover hero-området, **Then** efterlader cursoren et synligt spor af farvede streger og enkelte former der fader ud inden for ca. 0.5 sekund.
2. **Given** en bruger åbner forsiden på mobil, **When** de stryger fingeren henover hero-området, **Then** vises samme effekt uden at forstyrre scroll i resten af siden.
3. **Given** cursor-effekten er aktiv, **When** brugeren klikker på "Opret madrum" eller "Join et rum", **Then** registreres klikket normalt og brugeren navigerer videre uden forsinkelse.
4. **Given** en bruger har aktiveret "Reduceret bevægelse" i sit OS, **When** de besøger forsiden, **Then** vises cursor-effekten enten ikke eller i en kraftigt dæmpet version (kun statisk hover-indikator).
5. **Given** effekten kører i længere tid, **When** brugeren bliver på siden i 2+ minutter, **Then** stiger hverken hukommelse eller CPU-forbrug mærkbart (SVG-elementer ryddes løbende op).

---

### User Story 2 - Poleret, konsistent interaktionsfeedback overalt (Priority: P1)

En deltager bevæger sig gennem hele flowet (opret → join → lobby → afstemning → resultat). Hver eneste interaktiv komponent — knapper, input-felter, kort, swipes, modaler — reagerer med tydelig, blød feedback: hover-states, fokus-ringe, press-states, transitions ved tilstandsskift. Intet "hopper" eller blinker hårdt; alt føles afstemt og roligt.

**Why this priority**: Polish er forskellen mellem en app der føles "bygget i en weekend" og en der føles produktionsklar. Det hæver opfattet kvalitet uden at ændre funktionalitet.

**Independent Test**: Kan testes ved at gennemføre hele flowet manuelt og verificere at hver klikbar/touchbar komponent har defineret hover-, focus-, active- og disabled-state, samt at sideovergange og tilstandsskift har konsistente fade-/slide-animationer.

**Acceptance Scenarios**:

1. **Given** en bruger holder musen over en knap, **When** hover indtræder, **Then** ændrer knappen blødt baggrund/skygge inden for 150–200 ms.
2. **Given** en bruger taber fokus eller bruger Tab-tasten, **When** et element får fokus, **Then** vises en synlig, ikke-aggressiv fokus-ring der opfylder WCAG-kontrastkrav.
3. **Given** en bruger trykker på en knap (touch eller mus), **When** trykket sker, **Then** giver knappen et kort visuelt "press"-feedback (scale 0.95 eller lignende) under 100 ms.
4. **Given** brugeren navigerer mellem sider i samme flow (f.eks. lobby → afstemning), **When** overgangen sker, **Then** anvendes en konsistent fade/slide i stedet for et hårdt skift.
5. **Given** en liste opdateres realtime (deltager joiner lobby), **When** et nyt element tilføjes, **Then** glider det blødt ind frem for at "poppe" ind brat.

---

### User Story 3 - Polerede stemme-interaktioner og resultatfremvisning (Priority: P1)

Under afstemningen swiper/klikker brugeren igennem madvalg. Hvert kort har en blød indtrædelse, og Ja/Måske/Nej-valget bekræftes med en kort, klar animation (f.eks. kortet flyver væk i den valgte retning) før næste kort glider ind. På resultatsiden tæller matchprocenten op fra 0, og top-3-listen afslører sig én række ad gangen.

**Why this priority**: Afstemningen og resultatet er kerneoplevelsen. Mikroanimationer her gør forskellen mellem "okay" og "vil-vise-det-til-vennerne".

**Independent Test**: Kan testes ved at simulere en afstemning og verificere at hvert vote udløser en bekræftelses-animation, samt at resultatsiden afslører elementer sekventielt.

**Acceptance Scenarios**:

1. **Given** afstemningen er startet, **When** et nyt madkort vises, **Then** glider det ind nedefra eller fra siden inden for 250 ms.
2. **Given** en deltager vælger Ja, Måske eller Nej, **When** valget registreres, **Then** animerer kortet væk i en retning der semantisk matcher valget (op = ja, ned = nej, side = måske) inden næste kort vises.
3. **Given** alle har stemt og resultatsiden indlæses, **When** siden vises, **Then** tæller matchprocenten for top-1 op fra 0 % til sin endelige værdi over ca. 800 ms.
4. **Given** resultatsiden er synlig, **When** brugeren ser top-3-listen, **Then** afsløres række 1, 2 og 3 med 150 ms forskydning hver.
5. **Given** "spin random wheel" anvendes, **When** brugeren trigger spinnet, **Then** vises en spin-animation der lander på et tilfældigt topvalg i stedet for blot at vise resultatet instantly.

---

### User Story 4 - Synligt WeGoDigital.dk-branding i footer (Priority: P2)

Hver side i appen viser i bunden et diskret "Bygget af WeGoDigital.dk"-link der åbner i ny fane. Linket er synligt nok til at give credit/marketing-værdi, men ikke så fremtrædende at det stjæler fokus fra appens kerneflow.

**Why this priority**: Branding er værdifuldt for ejeren, men må ikke kompromittere brugeroplevelsen — derfor P2 (efter kerneoplevelsen).

**Independent Test**: Kan testes ved at besøge hver hovedside og verificere at footer-linket er til stede, peger på `https://www.WeGoDigital.dk`, åbner i ny fane med `rel="noopener noreferrer"`, og har korrekt hover-state.

**Acceptance Scenarios**:

1. **Given** en bruger er på en hvilken som helst side (forside, opret, join, lobby, afstemning, resultat), **When** de scroller til bunden, **Then** ser de et lille "Bygget af WeGoDigital.dk"-link.
2. **Given** brugeren klikker på WeGoDigital.dk-linket, **When** klikket sker, **Then** åbnes `https://www.WeGoDigital.dk` i en ny fane og den oprindelige HvadMad-session bevares.
3. **Given** brugeren holder musen over linket, **When** hover indtræder, **Then** ændrer linket farve blødt for at signalere klikbarhed.
4. **Given** linket vises på mobil, **When** brugeren ser footeren, **Then** har linket touch-target på minimum 44×44 px.

---

### User Story 5 - Tilgængelig og performant polish (Priority: P2)

Alle nye animationer respekterer `prefers-reduced-motion` og degraderer pænt på langsomme enheder. Brugere med skærmlæser eller tastaturnavigation oplever ingen forringelse — animationer er rent dekorative og blokerer aldrig indhold.

**Why this priority**: Tilgængelighed er ikke valgfrit, men kan implementeres samtidig med polish-arbejdet uden ekstra runde.

**Independent Test**: Kan testes ved at aktivere "Reduceret bevægelse" i OS samt navigere hele flowet udelukkende med tastatur og skærmlæser.

**Acceptance Scenarios**:

1. **Given** brugeren har `prefers-reduced-motion: reduce` aktiveret, **When** de besøger en hvilken som helst side, **Then** erstattes alle dekorative animationer (cursor-spor, kort-flyvninger, count-up) med øjeblikkelige tilstandsskift.
2. **Given** en bruger navigerer kun med tastatur, **When** de Tabber gennem siden, **Then** er fokus-rækkefølge logisk og fokus-ring altid synlig.
3. **Given** en bruger bruger skærmlæser, **When** en animation finder sted, **Then** ignoreres animationen af skærmlæseren (aria-hidden eller tilsvarende) og ingen vigtigt indhold er kun tilgængeligt via animationen.
4. **Given** appen kører på en low-end-mobil (svarende til 4-årig Android), **When** brugeren gennemfører hele flowet, **Then** holder framerate på ≥30 FPS under animationer og ingen scroll-jank.

---

### Edge Cases

- Hvad sker der hvis cursor-effekten kører på en meget langsom enhed? → SVG-elementer ryddes op tidligere, og antallet af samtidige spor-farver reduceres automatisk.
- Hvad sker der hvis WeGoDigital.dk er nede? → Linket åbner stadig i ny fane; det er brugerens browser der viser eventuel fejl.
- Hvad sker der ved sideovergange mens en animation kører? → Animationer på den forrige side stoppes/ryddes ryddes pænt op for at undgå memory leaks.
- Hvad sker der hvis browseren ikke understøtter SVG-animationer (meget gamle browsere)? → Forsiden vises uden cursor-effekt; alle knapper og flow virker uændret.
- Hvad sker der hvis brugeren har slået JavaScript fra? → Cursor-effekten vises ikke (kræver JS); statiske elementer og links virker via SSR.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Forsiden MUST vise en interaktiv cursor-effekt der efterlader et farvet SVG-spor og enkelte tilfældige geometriske former (cirkel, firkant, trekant) når brugeren bevæger mus eller finger i hero-området.
- **FR-002**: Cursor-effekten MUST fungere på både mus (mousemove) og touch (touchmove) inputs.
- **FR-003**: Cursor-effekten MUST rydde gamle SVG-elementer op løbende, så hukommelses- og DOM-forbrug forbliver stabilt ved langvarig brug (mindst 10 minutters kontinuerlig brug uden vækst).
- **FR-004**: Cursor-effekten MUST IKKE blokere klik, touch eller scroll på underliggende interaktive elementer.
- **FR-005**: Appen MUST respektere `prefers-reduced-motion: reduce` og deaktivere eller kraftigt dæmpe alle dekorative animationer (inkl. cursor-effekt) når flag'et er sat.
- **FR-006**: Alle interaktive elementer (knapper, links, input, kort) MUST have synlige hover-, focus-, active- og disabled-states med konsistent timing (150–250 ms transitions).
- **FR-007**: Alle sideovergange inden for samme flow MUST anvende en konsistent fade- eller slide-animation i stedet for hårde skift.
- **FR-008**: Realtime-listeopdateringer (deltagere i lobby, stemme-status) MUST animere ind/ud blødt i stedet for at poppe.
- **FR-009**: Stemmevalg (Ja/Måske/Nej) MUST udløse en kort bekræftelses-animation på kortet før næste kort vises.
- **FR-010**: Resultatsiden MUST animere matchprocenten med en count-up fra 0 til endelig værdi og afsløre top-resultater sekventielt.
- **FR-011**: "Random wheel"-funktionen MUST vise en spin-animation før det endelige valg afsløres.
- **FR-012**: Hver side i appen MUST indeholde en footer med et link til `https://www.WeGoDigital.dk` der åbner i ny fane med `target="_blank"` og `rel="noopener noreferrer"`.
- **FR-013**: WeGoDigital.dk-linket MUST være visuelt diskret men opfylde mindst 44×44 px touch-target og have synlig hover/focus-state.
- **FR-014**: Animationer MUST IKKE introducere "AI-genereret"-æstetik (ingen pulserende gradient-glows, neon-skær, shimmering tekst, partikel-orbs eller andre clichéer fra generative AI-interfaces). Den visuelle tone skal forblive legende, taktil og menneskelig.
- **FR-015**: Animationer MUST IKKE forsinke kritiske brugerhandlinger; al UI-respons skal stadig opleves som øjeblikkelig (<100 ms perceived latency på klik/touch).
- **FR-016**: Polish-arbejdet MUST IKKE ændre eksisterende funktionel adfærd defineret i `001-hvadmad-mvp` (rumoprettelse, join, afstemning, resultat-algoritme) — kun den visuelle og animerede præsentation.

### Key Entities

*Denne feature er primært visuel/UX og indfører ingen nye datamodeller. Eksisterende entiteter (Room, Participant, FoodOption, Vote, Result) fra MVP-spec'en anvendes uændret.*

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100 % af interaktive komponenter (knapper, input, kort, links) har defineret hover-, focus-, active- og disabled-state.
- **SC-002**: Alle sideovergange inden for samme flow gennemføres med animation under 400 ms uden visuel "jump".
- **SC-003**: Cursor-effekten på forsiden bevarer ≥45 FPS på en mid-range mobil (svarende til iPhone 11 / Pixel 4a) under aktiv brug.
- **SC-004**: Efter 10 minutters kontinuerlig brug af forsiden er antallet af aktive SVG-elementer stabilt (vokser ikke monotont).
- **SC-005**: 100 % af dekorative animationer respekterer `prefers-reduced-motion` og slukker korrekt.
- **SC-006**: WeGoDigital.dk-linket er synligt og funktionelt på alle hovedsider (forside, opret, join, lobby, afstemning, resultat).
- **SC-007**: Lighthouse Accessibility-score for forsiden er ≥95 efter polish-arbejdet.
- **SC-008**: Lighthouse Performance-score for forsiden falder ikke under 90 (mobile) efter cursor-effekten er tilføjet.
- **SC-009**: Et brugertest-panel på 5 personer beskriver oplevelsen som "poleret", "legende" eller "sjov" — ingen beskriver den som "kunstig", "AI-agtig" eller "overdrevet".
- **SC-010**: Hele afstemnings-flowet kan gennemføres ene og alene med tastatur uden tab af funktionalitet.

## Assumptions

- Den eksisterende MVP-funktionalitet (`001-hvadmad-mvp`) er på plads eller under aktiv udvikling, og polish-laget bygges ovenpå uden at refaktorere kerneflowet.
- Framer Motion (allerede i `plan.md` for MVP) anvendes som primært animationsbibliotek for komponent-animationer; SVG-cursor-effekten implementeres rent med React + SVG (ingen GSAP-afhængighed).
- Det medfølgende `SVGFollower`-komponent fra brugerens input bruges som udgangspunkt for forsidens cursor-effekt; farvepalette tilpasses HvadMad-brandet (brand-farver + støttefarver) snarere end den originale [red, blue, green, yellow, white].
- WeGoDigital.dk-linket placeres i en delt `Footer`-komponent der inkluderes i root layout for at undgå duplikering.
- "Ikke AI-agtig" UI defineres som: ingen pulserende gradient-glows, ingen neon-skær, ingen shimmering tekst, ingen orb-/partikel-clichéer, ingen overdrevne blur-effekter. Tonen skal være legende og taktil — ikke "futuristisk".
- Mobile-first-princippet fra projektets konstitution overholdes: alle animationer testes først på mobil.
- Performance-budget: cursor-effekten må maks tilføje 50 KB gzipped til forsidens initial bundle.
- Polish-arbejdet skal kunne deployes uafhængigt af MVP-funktionalitet (feature flag eller branch-merge når kerneflow er stabilt).
