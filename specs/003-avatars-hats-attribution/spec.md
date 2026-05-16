# Feature Specification: Avatars, Hatte & Per-Deltager Resultatvisning

**Feature Branch**: `003-avatars-hats-attribution`

**Created**: 2026-05-16

**Status**: Draft

**Input**: Tilføj avatar-valg når deltagere indtaster navn, lad dem vælge flere hatte (stacking-accessories) til avataren, og vis i resultaterne hvem der stemte hvad på hver madmulighed.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Vælg avatar og hatte ved onboarding (Priority: P1)

En person åbner et HvadMad-rum (enten ved at oprette eller joine). Efter at have indtastet et nickname præsenteres de for en sjov, visuel skærm hvor de vælger én base-avatar fra et galleri og kan stable op til 3 hatte/accessories ovenpå (f.eks. kokkehue + briller + butterfly). Forhåndsvisningen opdateres live mens de eksperimenterer. Når de er tilfredse, trykker de "Klar" og lander i lobbyen med deres samlede look.

**Why this priority**: Avatar-valget er kernen i hele identitets-oplevelsen. Uden det fungerer hverken lobby-visningen eller resultat-attribution. Det skal være muligt fra dag ét — ellers kan brugeren ikke "være sig selv" i rummet.

**Independent Test**: Kan testes ved at indtaste et nickname, vælge en avatar + 2 hatte, trykke "Klar", og verificere at lobby-skærmen viser den valgte kombination ved siden af nicknamet.

**Acceptance Scenarios**:

1. **Given** en bruger har indtastet et gyldigt nickname, **When** de trykker "Næste" / "Vælg avatar", **Then** vises en avatar-vælger med mindst 12 base-avatars præsenteret i et scrollbart galleri.
2. **Given** avatar-vælgeren er åben, **When** brugeren trykker på en avatar, **Then** markeres den som valgt og live-forhåndsvisningen øverst opdateres med det samme.
3. **Given** en avatar er valgt, **When** brugeren åbner hatte-fanen, **Then** vises mindst 15 hatte-/accessory-muligheder grupperet efter type (hovedbeklædning, briller, halsudstyr, etc.).
4. **Given** brugeren har valgt 0 hatte, **When** de tilføjer en hat, **Then** stables den på avataren i live-forhåndsvisningen, og tælleren viser "1/3 hatte valgt".
5. **Given** brugeren har valgt 3 hatte, **When** de forsøger at tilføje en fjerde, **Then** vises en venlig besked ("Du kan stable op til 3 hatte — fjern én for at vælge en ny") og den fjerde tilføjes ikke.
6. **Given** brugeren har valgt en hat, **When** de trykker på samme hat igen, **Then** fjernes den fra avataren.
7. **Given** brugeren trykker "Klar" uden at have valgt nogen avatar, **When** de fortsætter, **Then** tildeles automatisk en tilfældig default-avatar uden hatte og de lander i lobbyen.

---

### User Story 2 - Genkend andre deltagere via avatar i lobby & afstemning (Priority: P1)

I lobbyen ser alle deltagere hinandens avatars med stablede hatte ved siden af deres nicknames. Når afstemningen starter, vises samme avatar i progress-listen ("Christian 🧑‍🍳🎩 har stemt ✓"). Avatars renderes konsistent i samme stil overalt så folk kan genkende hinanden på tværs af skærme.

**Why this priority**: Visuel genkendelse gør oplevelsen social og legende — det er forskellen mellem en kold liste af nicknames og en gruppe-fest. Uden konsistent avatar-visning i alle skærme mister feature'en sin værdi.

**Independent Test**: Kan testes ved at joine et rum fra to browsere med forskellige avatar/hat-valg og verificere at begge avatars vises korrekt og identisk i både lobby og voting-progress på begge skærme inden for 2 sekunder.

**Acceptance Scenarios**:

1. **Given** flere deltagere er joinet, **When** brugeren ser lobbyen, **Then** vises hver deltagers avatar (base + stablede hatte) ved siden af deres nickname.
2. **Given** en ny deltager joiner med valgt avatar, **When** de lander i lobbyen, **Then** dukker deres avatar op for alle andre deltagere inden for 2 sekunder.
3. **Given** afstemning er i gang, **When** en deltager har afgivet alle sine stemmer, **Then** opdateres voting-progress-listen og viser deltagerens avatar + nickname med en "færdig ✓"-indikator.
4. **Given** en deltager er markeret som inaktiv eller frakoblet, **When** de andre ser lobby/voting-listen, **Then** vises avataren i en dæmpet/grå-tone for at signalere status.
5. **Given** to deltagere har samme nickname, **When** de andre ser dem i lobbyen, **Then** hjælper de forskellige avatars og hatte med at skelne dem visuelt.

---

### User Story 3 - Se hvem der stemte hvad i resultaterne (Priority: P1)

Når alle har stemt, ser deltagerne resultatsiden. For hver madmulighed (især top 3-5) vises ikke kun matchprocenten, men også en visuel opdeling: avatars af de deltagere der stemte Ja, Måske og Nej. Brugerne kan se "Ah, Christian sagde nej til pizza, og Sofia + Mads sagde ja". Det gør resultatet til et samtaleemne og et beslutningsværktøj — ikke kun en algoritme-udregning.

**Why this priority**: Dette er hele pointen med feature-anmodningen. Uden vote-attribution er hatte og avatars bare pynt. Med attribution bliver resultatsiden et socialt redskab der inviterer til diskussion: "Hvorfor sagde du nej til burger?"

**Independent Test**: Kan testes ved at gennemføre en afstemning med 3+ deltagere der har forskellige avatars og verificere at resultatsiden for hver madmulighed viser de korrekte avatars under Ja/Måske/Nej-kategorierne.

**Acceptance Scenarios**:

1. **Given** alle deltagere har stemt, **When** resultatsiden vises, **Then** ser hver bruger top 3-5 madmuligheder med matchprocent OG en attribution-sektion med avatars grupperet under Ja, Måske, Nej.
2. **Given** et top-resultat vises, **When** brugeren ser attribution, **Then** kan hver avatar identificeres ved hover/tap (viser nickname i tooltip eller under avataren).
3. **Given** en mulighed har 5 ja-stemmer og 2 nej-stemmer, **When** attribution renderes, **Then** vises 5 avatars under "Ja" og 2 avatars under "Nej" — hver med korrekt hatte-konfiguration.
4. **Given** en deltager ser sig selv i attribution, **When** deres egen avatar vises under deres stemme-valg, **Then** markeres avataren med en subtil "dig"-indikator (f.eks. en lille ring eller "(dig)"-label).
5. **Given** resultatsiden vises på mobil med begrænset plads, **When** flere end 6 avatars skal vises i en attribution-gruppe, **Then** vises de første 5 avatars + en "+N flere"-indikator der kan tappes for at se alle.
6. **Given** en madmulighed ikke fik nogen stemmer i en bestemt kategori (f.eks. 0 nej-stemmer), **When** attribution renderes, **Then** vises kategorien som tom med en venlig tekst ("Ingen sagde nej 🎉").

---

### User Story 4 - Skift avatar/hatte fra lobbyen (Priority: P2)

Mens deltagerne venter i lobbyen før afstemningen starter, kan de fortryde deres avatar- eller hattevalg ved at trykke på deres egen avatar i deltagerlisten. Det åbner samme picker igen, og ændringer reflekteres realtime hos alle andre.

**Why this priority**: Polish-feature. Folk ombestemmer sig. Men det er ikke kritisk — de kan altid joine igen med nyt nickname hvis det er nødvendigt.

**Independent Test**: Kan testes ved at åbne lobby fra to browsere, ændre avatar i den ene, og verificere at den anden ser ændringen inden for 2 sekunder.

**Acceptance Scenarios**:

1. **Given** en deltager er i lobbyen og afstemning ikke er startet, **When** de trykker på deres egen avatar, **Then** åbnes avatar/hat-pickeren med deres nuværende valg forvalgt.
2. **Given** en deltager ændrer avatar/hatte, **When** de trykker "Gem", **Then** opdateres deres avatar realtime hos alle andre deltagere inden for 2 sekunder.
3. **Given** afstemning er startet, **When** en deltager forsøger at ændre avatar, **Then** er funktionen utilgængelig (knappen disabled eller skjult).

---

### User Story 5 - Tilgængelighed og default-håndtering (Priority: P2)

Skærmlæser-brugere og folk der bare vil videre hurtigt, oplever ingen friktion: avatar-vælgeren kan navigeres med tastatur, hver avatar/hat har beskrivende alt-tekst ("Pizza-avatar med kokkehue og solbriller"), og det er trivielt at springe over og bare bruge en default.

**Why this priority**: Tilgængelighed er konstitutionel — men implementeres samtidig med picker-byggeriet uden ekstra runde.

**Independent Test**: Kan testes ved at navigere hele picker-flowet udelukkende med tastatur og verificere at hver avatar/hat har korrekt alt-tekst i et accessibility-værktøj.

**Acceptance Scenarios**:

1. **Given** en bruger bruger kun tastatur, **When** de Tabber gennem avatar-pickeren, **Then** er fokus-rækkefølge logisk (alle avatars → alle hatte → "Klar"-knap) og fokus-ring altid synlig.
2. **Given** en skærmlæser-bruger åbner avatar-pickeren, **When** de fokuserer en avatar, **Then** annonceres f.eks. "Pizza-avatar, valg 3 af 12".
3. **Given** en bruger trykker "Klar" uden valg, **When** de fortsætter, **Then** tildeles en tilfældig default-avatar uden hatte og de lander i lobbyen uden fejlmeddelelser.
4. **Given** en bruger har `prefers-reduced-motion: reduce` aktiveret, **When** de bruger pickeren, **Then** undertrykkes alle avatar-/hat-overgangsanimationer, men selve valget fungerer uændret.

---

### Edge Cases

- Hvad sker der hvis to deltagere vælger nøjagtigt samme avatar+hatte-kombination? → Tilladt; nickname fungerer som primær identifikator, og join-orden eller en subtil farve-ring kan disambiguere visuelt hvis nødvendigt.
- Hvad sker der hvis en deltager joiner med en avatar, men avatar-asset ikke kan loades (netværksfejl)? → Vis en neutral silhuet-placeholder med nicknamet — funktionen må ikke blokere voting.
- Hvad sker der hvis hat-kataloget udvides senere og en gammel deltager bruger en hat der ikke længere findes? → Ikke relevant i MVP da sessions er ephemeral (max 24 timers levetid).
- Hvad sker der hvis en deltager forlader rummet midt i afstemningen — vises deres avatar stadig i resultaterne for de mulighederne de nåede at stemme på? → Ja, deres afgivne stemmer attributeres til deres avatar uanset om de er online ved resultatvisning.
- Hvad sker der med 20 deltagere × 3 hatte = 60+ illustrationer på samme skærm i resultatvisning? → Brug 32px-størrelse i attribution-grupper, lazy-render hvis nødvendigt, og "+N flere"-stack ved >5 avatars per gruppe.
- Hvad sker der hvis en hat dækker en anden hat visuelt (f.eks. to hovedbeklædninger)? → Hver hat har et eksplicit slot/lag (hoved, øjne, hals, etc.), og to hatte i samme slot er gensidigt ekskluderende.

## Requirements *(mandatory)*

### Functional Requirements

#### Avatar-valg (onboarding)

- **FR-001**: System MUST præsentere en avatar-vælger umiddelbart efter nickname-feltet i både opret-rum- og join-rum-flows.
- **FR-002**: System MUST tilbyde mindst 12 base-avatars i et kurateret katalog med konsistent visuel stil (mad-/dyre-/karakter-tema).
- **FR-003**: System MUST tilbyde mindst 15 hatte/accessories grupperet efter slot (hovedbeklædning, øjne/briller, hals, ansigt, etc.).
- **FR-004**: System MUST tillade brugeren at vælge nøjagtigt én base-avatar.
- **FR-005**: System MUST tillade brugeren at stable op til 3 hatte samtidigt på den valgte avatar.
- **FR-006**: System MUST forhindre at to hatte i samme slot vælges samtidigt (slot-konflikter er gensidigt ekskluderende).
- **FR-007**: System MUST vise en live-forhåndsvisning af avatar + valgte hatte mens brugeren eksperimenterer.
- **FR-008**: System MUST tildele en tilfældig default-avatar uden hatte hvis brugeren springer over og fortsætter uden valg.

#### Visning på tværs af skærme

- **FR-009**: System MUST rendere hver deltagers avatar + hatte konsistent på alle skærme (lobby, voting-progress, resultat, attribution-grupper).
- **FR-010**: System MUST vise avatar i mindst tre størrelser: 32px (kompakte lister/attribution-grupper), 64px (lobby-kort, voting-progress) og 96px (picker-forhåndsvisning).
- **FR-011**: System MUST vise hver deltagers nickname sammen med avataren i alle visnings-kontekster.
- **FR-012**: System MUST visuelt markere inaktive/frakoblede deltagere ved at dæmpe deres avatar (f.eks. gråtone eller reduceret opacity).

#### Per-deltager resultat-attribution

- **FR-013**: System MUST vise på resultatsiden, for hver madmulighed der præsenteres (mindst top 5), hvilke deltagere der stemte Ja, Måske og Nej — repræsenteret ved deres avatar + nickname.
- **FR-014**: System MUST gruppere attribution-avatars under tre tydelige kategorier (Ja, Måske, Nej) for hver vist madmulighed.
- **FR-015**: System MUST vise et "+N flere"-element når mere end 5 avatars skal vises i samme attribution-gruppe på samme skærm.
- **FR-016**: System MUST markere brugerens egen avatar med en visuel "(dig)"-indikator i attribution-grupper så de let kan finde sig selv.
- **FR-017**: System MUST vise en venlig placeholder-tekst ("Ingen sagde nej 🎉") når en attribution-kategori er tom for en given madmulighed.

#### Lobby-redigering

- **FR-018**: System MUST tillade en deltager at åbne avatar-/hat-pickeren igen fra lobbyen ved at trykke på deres egen avatar — så længe afstemningen ikke er startet.
- **FR-019**: System MUST synkronisere avatar-/hat-ændringer realtime til alle andre deltagere inden for 2 sekunder.
- **FR-020**: System MUST disable / skjule avatar-redigering så snart afstemningen er startet.

#### Tilgængelighed & sprog

- **FR-021**: System MUST levere beskrivende dansk alt-tekst til hver avatar og hat (f.eks. "Pizza-avatar med kokkehue").
- **FR-022**: System MUST kunne navigeres fuldt ud med tastatur (Tab, Pile, Enter, Mellemrum).
- **FR-023**: System MUST respektere `prefers-reduced-motion` og undertrykke avatar-/hat-overgangsanimationer for brugere med præferencen aktiveret.
- **FR-024**: System MUST holde al UI-tekst i avatar-/hat-flowet på dansk.

#### Datalivscyklus

- **FR-025**: System MUST persistere avatar- og hatte-valg som del af deltagerens session-state og forhindre tab ved kortvarig genforbindelse inden for 5 minutter.
- **FR-026**: System MUST ikke gemme avatar-/hatte-valg ud over rummets levetid (slettes sammen med rum-data ved auto-cleanup efter 24 timers inaktivitet).
- **FR-027**: System MUST ikke kræve login eller persistent identitet for avatar-valg — feature'en respekterer "No-Login-First" og "Privacy-Light"-principperne.

### Key Entities

- **Avatar**: En kurateret visuel base-karakter som en deltager kan vælge under onboarding. Har et unikt id, et menneskeligt navn (f.eks. "Pizza", "Ræv", "Robot"), en illustration, og en alt-tekst på dansk. Hver deltager vælger nøjagtigt én.
- **Hat (Accessory)**: Et stable-bart visuelt element som dekorerer en avatar. Har et unikt id, et navn (f.eks. "Kokkehue", "Solbriller"), en illustration, et slot (hoved, øjne, hals, ansigt, …) der definerer lag og forhindrer konflikter, og en alt-tekst på dansk. En deltager kan vælge 0-3 stk., én pr. slot.
- **AvatarConfiguration**: Den samlede visuelle profil for en deltager i et givet rum — kombinationen af præcis én Avatar og 0-3 Hats. Knyttet til Participant. Eksisterer kun for rummets levetid.
- **Participant** (udvidet eksisterende entitet): Får nu en AvatarConfiguration knyttet til sig udover nickname og session-id.
- **VoteAttribution** (afledt visnings-entitet for resultatsiden): Per madmulighed en grupperet liste af alle deltageres stemmer, hvor hver stemme er repræsenteret af deltagerens AvatarConfiguration + nickname + valg (Ja/Måske/Nej). Beregnes klient-side fra eksisterende Vote- og Participant-data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En deltager kan vælge avatar og op til 3 hatte og fortsætte til lobbyen inden for 15 sekunder fra at have indtastet nickname.
- **SC-002**: Avatars renderes konsistent på alle skærme (lobby, voting, resultat, attribution) — 100% pixel-konsistens for samme deltager på tværs af skærme i samme session.
- **SC-003**: Resultatsiden med per-deltager attribution loader og vises inden for 2 sekunder efter sidste stemme — samme tidskrav som eksisterende resultat-visning (SC-004 i hovedspec).
- **SC-004**: Mindst 70% af deltagere vælger aktivt en avatar (ikke default) — målt over første måneds brug.
- **SC-005**: Mindst 40% af deltagere tilføjer mindst én hat til deres avatar — målt over første måneds brug.
- **SC-006**: Hat-stacking renderes uden visuel overlap, slot-konflikter eller misalignment på skærme fra 320px bredde.
- **SC-007**: 90% af deltagere kan i en post-session-test identificere mindst 3 andre deltagere udelukkende via deres avatar (ikke nickname) — målt via brugertest med grupper på 5+ personer.
- **SC-008**: Avatar-vælgeren scorer mindst WCAG 2.1 AA på en automatisk tilgængeligheds-revision.
- **SC-009**: Tilføjelsen af attribution på resultatsiden øger gennemsnitlig tid brugt på resultatsiden med mindst 30% sammenlignet med baseline — som indikator for at gruppen rent faktisk diskuterer resultatet.
- **SC-010**: Per-deltager attribution kan vises korrekt for et fuldt rum (20 deltagere) på top 5 madmuligheder uden scroll-lag eller frame drops på en typisk 4-årig Android-mobil.

## Assumptions

- "Flere hatte" tolkes som muligheden for at stable op til 3 hatte/accessories samtidigt på samme avatar (stable-baseret customization, ikke single-select). Hvis brugeren mener "vælg én ud af mange", justeres FR-005 til max 1 stack.
- Avatars og hatte leveres fra et kurateret visuelt asset-bibliotek (ingen brugergenereret eller AI-genereret indhold i MVP) — passer ind i konstitutionel "MVP-First" og "Privacy-Light".
- Initial katalog dimensioneres til mindst 12 avatars × 15 hatte = nok variation til at en gruppe på 20 deltagere kan have synligt distinkte kombinationer.
- Vote attribution er altid synlig for alle deltagere på resultatsiden — der introduceres ikke en "anonym mode" toggle i denne iteration. Hvis privatlivs-bekymringer opstår, kan det tilføjes som senere feature.
- Avatar-systemet bygger ovenpå eksisterende lobby-, voting- og resultat-komponenter med små layout-tilpasninger — ingen større arkitektur-refaktor påkrævet.
- Visuel stil for avatars og hatte matcher HvadMads eksisterende brand (legende, mad-tema, ikke "AI-generated look") — koordineres med 002-features (UI Polish & Animationer).
- Eksisterende mekanik for at vise "hvem har stemt" (uden hvad) under selve afstemningen forbliver uændret — attribution af *hvad* sker først på resultatsiden.
- Reconnection-vinduet på 5 minutter (fra hovedspec FR-015) gælder også avatar-konfigurationen — den bevares ved kortvarigt tab.
