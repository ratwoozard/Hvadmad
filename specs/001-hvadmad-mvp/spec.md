# Feature Specification: HvadMad – Gruppemadvalg via Afstemning

**Feature Branch**: `001-hvadmad-mvp`

**Created**: 2026-05-16

**Status**: Draft

**Input**: HvadMad er en webapp til par, familier, vennegrupper og mindre teams, der ikke kan beslutte sig for, hvad de skal spise. Én person opretter et rum, andre joiner med kode eller link, og alle stemmer individuelt på madvalg. Appen viser til sidst gruppens bedste matches.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Opret rum og del med gruppe (Priority: P1)

En bruger vil beslutte hvad gruppen skal spise. De åbner HvadMad, opretter et nyt madrum med et par tryk, og får en rumkode samt et delbart link. De sender linket til gruppens chat.

**Why this priority**: Uden rum-oprettelse og deling eksisterer produktet ikke. Dette er den absolutte forudsætning for alt andet.

**Independent Test**: Kan testes ved at oprette et rum og verificere at kode og link genereres og er tilgængelige til deling.

**Acceptance Scenarios**:

1. **Given** en bruger er på forsiden, **When** de trykker "Opret madrum", **Then** oprettes et rum med en unik 4-6 tegns kode og et delbart link.
2. **Given** et rum er oprettet, **When** brugeren ser rumkoden, **Then** kan de kopiere koden og linket med ét tryk.
3. **Given** et rum er oprettet, **When** brugeren er på lobby-skærmen, **Then** vises de som vært med deres valgte nickname.

---

### User Story 2 - Join rum som deltager (Priority: P1)

En person modtager et link eller en kode i en gruppechat. De åbner linket (eller indtaster koden manuelt), vælger et nickname, og lander i rummets lobby hvor de kan se andre deltagere.

**Why this priority**: Uden join-flow kan ingen deltage — dette er lige så kritisk som rum-oprettelse.

**Independent Test**: Kan testes ved at bruge en rumkode/link og verificere at man joiner rummet med et nickname.

**Acceptance Scenarios**:

1. **Given** et aktivt rum eksisterer, **When** en person åbner det delte link, **Then** ser de en simpel "Vælg nickname"-skærm.
2. **Given** en person har valgt nickname, **When** de trykker "Join", **Then** lander de i lobbyen og ser andre deltagere i realtid.
3. **Given** en person indtaster en ugyldig rumkode, **When** de forsøger at joine, **Then** ser de en venlig fejlbesked: "Rummet findes ikke. Tjek koden og prøv igen."
4. **Given** rummet allerede er i gang med afstemning, **When** en ny deltager forsøger at joine, **Then** får de besked om at afstemningen er i gang og de ikke kan deltage.

---

### User Story 3 - Afstemning på madvalg (Priority: P1)

Værten starter afstemningen fra lobbyen. Alle deltagere ser de samme madvalg/kategorier og stemmer Ja / Måske / Nej på hver mulighed. Stemmeprocessen føles hurtig og sjov — som at swipe i Tinder.

**Why this priority**: Afstemning er kernemekanikken. Uden dette er produktet bare en chatgruppe.

**Independent Test**: Kan testes ved at simulere 2+ deltagere der stemmer på et fast sæt muligheder og verificere at stemmer registreres korrekt.

**Acceptance Scenarios**:

1. **Given** alle deltagere er i lobbyen, **When** værten trykker "Start afstemning", **Then** ser alle deltagere den første madmulighed med Ja/Måske/Nej-knapper.
2. **Given** en deltager ser en madmulighed, **When** de vælger Ja, Måske eller Nej, **Then** registreres stemmen og næste mulighed vises.
3. **Given** en deltager er midt i afstemningen, **When** de ser fremdriftsindikatoren, **Then** kan de se hvor mange muligheder de har stemt på ud af totalen.
4. **Given** værten er i lobbyen, **When** de vælger afstemningstype (hjemmelavet, take-away, restaurant, køkkentype, hurtig aftensmad), **Then** præsenteres relevante madvalg for den type.

---

### User Story 4 - Se gruppens resultat (Priority: P1)

Når alle har stemt, beregner systemet et fælles resultat. Alle deltagere ser en resultatside med top 3-5 matches, matchprocent og en kort forklaring af hvorfor hvert valg matchede gruppen.

**Why this priority**: Resultatet er hele pointen — uden det har afstemningen ingen værdi.

**Independent Test**: Kan testes ved at indlæse et sæt stemmer og verificere at matchalgoritmen returnerer korrekt rangerede resultater med forklaringer.

**Acceptance Scenarios**:

1. **Given** alle deltagere har afgivet stemmer, **When** systemet beregner resultater, **Then** vises top 3-5 forslag rangeret efter matchscore.
2. **Given** resultatsiden vises, **When** en bruger ser et forslag, **Then** inkluderer det en matchprocent og en menneskelig forklaring (f.eks. "4 ud af 5 sagde ja, ingen sagde nej").
3. **Given** en person stemte tydeligt nej til en ret, **When** resultatet beregnes, **Then** er den ret effektivt elimineret fra top-resultaterne.
4. **Given** resultatsiden vises, **When** gruppen vil vælge mellem topmatches, **Then** kan de enten vælge direkte eller spinne et tilfældigt hjul blandt topresultaterne.

---

### User Story 5 - Realtime lobby og status (Priority: P2)

Deltagere i lobbyen kan se hvem der er tilsluttet i realtid. Under afstemningen kan alle se hvem der har stemt (uden at se hvad de stemte). Værten kan se hvornår alle er klar.

**Why this priority**: Realtime-feedback gør oplevelsen social og levende, men produktet fungerer teknisk uden det (polling kunne bruges som fallback).

**Independent Test**: Kan testes ved at joine et rum fra to browsere og verificere at tilstandsopdateringer synkroniseres inden for 2 sekunder.

**Acceptance Scenarios**:

1. **Given** en deltager joiner rummet, **When** de lander i lobbyen, **Then** ser alle andre deltagere dem dukke op inden for 2 sekunder.
2. **Given** afstemning er i gang, **When** en deltager afslutter sin stemmeafgivelse, **Then** opdateres status for alle ("Christian er færdig ✓").
3. **Given** en deltager forlader rummet (lukker browseren), **When** 30 sekunder er gået, **Then** markeres de som inaktive i lobbyen.

---

### User Story 6 - Håndtering af edge cases og fejl (Priority: P2)

Systemet håndterer gracefully at deltagere forlader, at browsere mister forbindelse, at rum udløber, og at værten forsvinder.

**Why this priority**: Uden fejlhåndtering crasher oplevelsen ved den mindste uregelmæssighed.

**Independent Test**: Kan testes ved at simulere afbrydelser og verificere at systemet kommunikerer tydelige beskeder.

**Acceptance Scenarios**:

1. **Given** en deltager mister forbindelsen under afstemning, **When** de vender tilbage inden 5 minutter, **Then** kan de genoptage hvor de slap.
2. **Given** værten forlader rummet, **When** 2 minutter er gået, **Then** overdrages værtsrollen til den næstældste deltager med besked til alle.
3. **Given** et rum har været inaktivt i 24 timer, **When** nogen forsøger at tilgå det, **Then** får de besked om at rummet er udløbet.
4. **Given** en deltager ikke stemmer inden for rimelig tid, **When** alle andre er færdige, **Then** kan værten vælge at beregne resultater uden den langsomme deltager.

---

### Edge Cases

- Hvad sker der hvis kun 1 person er i rummet og starter afstemning? → Tilladt, men resultatet er trivielt (dine egne svar).
- Hvad sker der hvis alle stemmer nej til alt? → Vis besked: "Ingen matches fundet – prøv en bredere kategori eller tilføj flere muligheder."
- Hvad sker der hvis der er nøjagtigt lige scores? → Vis alle ties med samme procent; randomiser rækkefølgen.
- Hvad sker der med 20+ deltagere? → MVP begrænser til maks 20 deltagere per rum.
- Hvad sker der hvis link deles offentligt? → Rummet er åbent for alle med koden; ingen auth-beskyttelse i MVP. Værten kan manuelt fjerne deltagere.

## Clarifications

### Session 2026-05-16

- Q: Kan resultater deles udenfor appen? → A: Nej, ikke aktivt i MVP. Brugere kan tage screenshot. Ingen dedikeret dele-funktion.
- Q: Hvor kommer madmulighederne fra? → A: Kurateret statisk database med ca. 50-100 muligheder per kategori. Ingen bruger-genererede muligheder i MVP.
- Q: Hvad definerer "inaktivitet" for rum-udløb? → A: Ingen aktiv WebSocket-forbindelse fra nogen deltager i 24 timer.
- Q: Kan en deltager ændre sin stemme efter afgivelse? → A: Nej, stemmer er endelige i MVP. Undgår kompleksitet i realtime-synkronisering.
- Q: Hvad sker der hvis alle muligheder scorer negativt? → A: Vis besked "Ingen gode matches – prøv en anden kategori" og tilbyd at starte en ny runde.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a user to create a food voting room with one tap from the landing page.
- **FR-002**: System MUST generate a unique room code (5 alphanumeric characters, uppercase + digits excluding ambiguous characters 0/O/1/I/L, case-insensitive input) and a shareable URL for each room.
- **FR-003**: System MUST allow participants to join a room using either room code or direct link.
- **FR-004**: System MUST require only a nickname (2-20 characters) to participate — no login, email, or account.
- **FR-005**: System MUST support a lobby view showing all connected participants in real time.
- **FR-006**: System MUST allow the host to select a voting category (hjemmelavet, take-away, restaurant, køkkentype, hurtig aftensmad).
- **FR-007**: System MUST present the same set of food options to all participants for voting.
- **FR-008**: System MUST support three vote types per option: Ja (+2 points), Måske (+1 point), Nej (-3 points).
- **FR-009**: System MUST calculate group match scores by summing all participants' votes per option.
- **FR-010**: System MUST apply heavy negative weighting to "Nej" votes so a single strong dislike effectively eliminates an option.
- **FR-011**: System MUST display top 3-5 results with match percentage and human-readable explanation.
- **FR-012**: System MUST show real-time voting progress (who has voted, who is still voting).
- **FR-013**: System MUST allow the host to trigger result calculation when all participants have voted or when the host chooses to proceed without stragglers.
- **FR-014**: System MUST provide a "random wheel" option for choosing among top matches.
- **FR-015**: System MUST handle participant disconnection gracefully with reconnection support within 5 minutes.
- **FR-016**: System MUST automatically expire rooms after 24 hours of inactivity.
- **FR-017**: System MUST limit rooms to maximum 20 participants.
- **FR-018**: System MUST display all UI text in Danish.
- **FR-019**: System MUST transfer host role if the original host disconnects for more than 2 minutes.
- **FR-020**: System MUST prevent new participants from joining after voting has started.
- **FR-021**: System MUST allow duplicate nicknames within a room, distinguishing participants internally by session ID. Display disambiguation is optional (e.g., join order number).

### Key Entities

- **Room**: Repræsenterer en mad-afstemningssession. Har en unik kode, et delbart link, en status (lobby/voting/results), en kategoritype, en vært, og en udløbstid. Indeholder deltagere og madmuligheder.
- **Participant**: En person i et rum. Identificeret ved nickname og en session-ID. Kan have rollen vært eller deltager. Har en forbindelsesstatus (aktiv/inaktiv/afbrudt).
- **FoodOption**: Et madvalg som deltagerne stemmer på. Tilhører en kategori. Har et navn og eventuelt en kort beskrivelse.
- **Vote**: En deltagers stemme på én madmulighed. Kan være Ja (+2), Måske (+1) eller Nej (-3). Tilhører en deltager og en madmulighed.
- **Result**: Det beregnede grupperesultat efter afstemning. Indeholder rangerede madmuligheder med score, matchprocent og forklaringstekst.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En bruger kan oprette et rum og dele koden/linket inden for 10 sekunder fra landing page.
- **SC-002**: En deltager kan joine et rum med nickname inden for 10 sekunder fra de modtager linket.
- **SC-003**: Afstemning på 10-15 madmuligheder kan gennemføres af en deltager inden for 60 sekunder.
- **SC-004**: Resultater beregnes og vises inden for 2 sekunder efter den sidste stemme.
- **SC-005**: Realtime-opdateringer (join, leave, vote progress) vises for alle deltagere inden for 2 sekunder.
- **SC-006**: 90% af brugere forstår matchforklaringen uden yderligere hjælp.
- **SC-007**: Ingen mad med et "Nej" fra mere end halvdelen af gruppen vises i top 3 resultater.
- **SC-008**: Systemet understøtter mindst 100 samtidige rum med 5 deltagere hver uden degradering.
- **SC-009**: Mobile-first layout fungerer uden horisontalt scroll på skærme fra 320px bredde.
- **SC-010**: Hele flowet (opret → join → stem → resultat) kan gennemføres uden at forlade browseren eller logge ind.

## Assumptions

- Brugere har stabil internetforbindelse (WiFi eller 4G) under hele sessionen.
- Brugere er i samme kontekst (f.eks. sidder sammen eller er i en gruppechat) og kan dele rumkode/link udenfor appen.
- Maddatabasen for MVP er kurateret og statisk (ikke bruger-genereret) — ca. 50-100 muligheder per kategori.
- Danske brugere er primær målgruppe; ingen internationalisering i MVP.
- Browsere har JavaScript aktiveret og understøtter WebSocket eller tilsvarende realtime-protokol.
- En deltager svarer ærligt — systemet forsøger ikke at detektere strategisk stemmeafgivelse.
- Rum-sessions data behøver ikke persisteres efter rummet er lukket eller udløbet.
