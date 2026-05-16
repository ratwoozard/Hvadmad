<!-- Sync Impact Report
  Version change: 0.0.0 → 1.0.0
  Modified principles: N/A (initial constitution)
  Added sections: Core Principles (9), MVP Constraints, Development Workflow, Governance
  Removed sections: None
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ (compatible, no changes needed)
    - .specify/templates/spec-template.md ✅ (compatible, no changes needed)
    - .specify/templates/tasks-template.md ✅ (compatible, no changes needed)
  Follow-up TODOs: None
-->

# HvadMad Constitution

## Core Principles

### I. MVP-First

Byg kun det, der validerer kerneflowet. Enhver feature SKAL kunne retfærdiggøres som nødvendig for at bevise produktets kernehypotese: at grupper hurtigt kan nå enighed om mad via afstemning. Hvis en feature ikke direkte understøtter "opret rum → join → stem → se resultat", hører den ikke til i MVP.

### II. Mobile-First

Alle flows SKAL designes til mobil som primær platform. Desktop er en bonus, ikke et mål. Touch-targets SKAL være mindst 44px. Ingen hover-only interaktioner. Layout SKAL fungere på skærme fra 320px bredde. Performance-budgettet er max 3 sekunder til First Contentful Paint på 4G.

### III. No-Login-First

Ingen brugerlogin i MVP. Deltagelse SKAL kun kræve et nickname og en rumkode eller et link. Session-baseret identitet er tilstrækkeligt. Ingen email, ingen password, ingen OAuth. Friktionen fra oprettelse til deltagelse SKAL være under 10 sekunder.

### IV. Privacy-Light

Gem mindst muligt persondata. Ingen personlige oplysninger ud over et selv-valgt nickname. Rumdata SKAL være ephemeral og automatisk opryddes. Ingen cookies til tracking. Ingen analytics der kræver samtykke-banner i MVP. GDPR-compliance via data-minimering.

### V. Realtime Clarity

Deltagerstatus og rumtilstand SKAL altid være tydelig for alle deltagere. Brugeren SKAL kunne se: hvem der er i rummet, hvem der har stemt, og hvornår alle er klar. Realtime-opdateringer SKAL ske uden at brugeren skal refreshe. Tilstandsovergange SKAL være visuelt tydelige.

### VI. Decision Quality

Resultatet SKAL forklare hvorfor et match vandt. Bare en rangliste er ikke nok — brugerne SKAL forstå logikken. Matchforklaringen SKAL være menneskelig og forståelig, ikke teknisk. Resultatet SKAL præsenteres så gruppen føler sig hørt, ikke overruled.

### VII. Strong Dislikes Matter

Et tydeligt nej SKAL vægte tungt i matchalgoritmen. Ingen deltager SKAL presses til at acceptere mad, de tydeligt har sagt nej til. En enkelt persons stærke modstand mod en ret SKAL effektivt eliminere den fra topresultaterne. Scoring: Nej = -3 eller -4, Ja = +2, Måske = +1.

### VIII. Danish-First UX

Produkt, tekster og flows SKAL være på dansk. UI-copy SKAL være naturligt og uformelt dansk — ikke oversættersk eller stift. Tekniske fejlbeskeder SKAL også give mening på dansk. Internationalisering er et non-goal i MVP, men kodebase SKAL bruge engelske variabelnavne.

### IX. Spec-Before-Code

Ingen implementation før spec, plan og tasks er konsistente og godkendte. Alle spec-kit dokumenter SKAL gennemgås med `/speckit-analyze` før kodning begynder. Ændringer til krav SKAL reflekteres i plan og tasks inden implementation fortsætter.

## MVP Constraints

- Teknisk stack: Next.js App Router, TypeScript, Tailwind CSS, Supabase Realtime
- Deployment: Vercel
- Ingen tung auth-infrastruktur
- Ingen betaling eller premium-features
- Ingen restaurantintegration eller opskriftsgenerator
- Ingen native app
- Ingen permanent historik medmindre triviel at implementere
- Data er session-baseret og ephemeral
- Maks 20 deltagere per rum i MVP
- Rum udløber efter 24 timer inaktivitet

## Development Workflow

- Spec-kit workflow SKAL følges: constitution → specify → clarify → plan → tasks → implement
- Alle PRs SKAL referere til den relevante task-ID
- Komponentbaseret frontend med tydelig separation: room state, voting logic, result calculation
- Matchalgoritmen SKAL testes isoleret med unit tests
- Realtime-logik SKAL testes med mock-subscriptions
- Mobile layout SKAL verificeres på mindst 3 skærmstørrelser (320px, 375px, 414px)

## Governance

Denne constitution er det styrende dokument for HvadMad-projektet. Alle design- og implementeringsbeslutninger SKAL overholde principperne heri. Ændringer til constitutionen kræver:

1. Dokumenteret begrundelse for ændringen
2. Opdatering af versionsnummer efter semantic versioning
3. Konsistenstjek mod spec, plan og tasks via `/speckit-analyze`
4. Opdatering af `LAST_AMENDED_DATE`

Ved konflikter mellem principper gælder denne prioritet:
1. Strong Dislikes Matter (brugerens autonomi)
2. MVP-First (scope control)
3. Privacy-Light (dataminimering)
4. Remaining principper i nævnt rækkefølge

**Version**: 1.0.0 | **Ratified**: 2026-05-16 | **Last Amended**: 2026-05-16
