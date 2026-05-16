# HvadMad

Realtime food-voting webapp — opret et madrum, del koden, lad gruppen stemme på madvalg, og se gruppens bedste matches med per-deltager attribution.

## Stack

- **Next.js 14** (App Router, RSC, TypeScript strict)
- **Tailwind CSS** med custom brand-tokens
- **Framer Motion 11** for animationer
- **Supabase** for database og realtime
- **Vitest** for unit-tests, **Playwright** for E2E

## Hurtig start

```bash
npm install
cp .env.local.example .env.local   # udfyld Supabase-credentials
npm run dev                        # http://localhost:3000
```

## Test

```bash
npm test                           # Vitest unit tests
npx playwright install              # éngangsinstallation af browser-binaries
npm run test:e2e                   # Playwright E2E (kører dev server automatisk)
ANALYZE=true npm run build         # next-bundle-analyzer rapport
```

## Spec-Kit workflow

Projektet følger spec-kit: hver feature har sin egen spec, plan, tasks. Se `specs/`:

- `001-hvadmad-mvp/` — kerneflowet (rum, voting, results)
- `002-ui-polish-animations/` — polish, animationer og delt footer
- `003-avatars-hats-attribution/` — avatar-system + vote attribution

Konstitution i `.specify/memory/constitution.md`. Workflow-skills i `.cursor/skills/speckit-*/`.

## Design system

- **Komponent-primitiver** (`src/components/ui/`): `<Button>`, `<Input>`, `<Card>`, `<Footer>`, `<PageTransition>`. Brug ALTID disse i stedet for at lave nye knapper/inputs fra bunden.
- **Motion-tokens** (`src/lib/motion/tokens.ts`): `DURATION`, `EASING`, `SPRING`, `STAGGER`, `WHEEL_COLORS`. Importér disse i stedet for inline magic-numbers.
- **Variants** (`src/lib/motion/variants.ts`): genbrugelige Framer Motion variants (`pageTransition`, `fadeUp`, `voteCardExit*`, `resultStagger`).
- **Reduced motion**: alle dekorative animationer respekterer `prefers-reduced-motion` via `<MotionProvider reducedMotion="user">` + custom `useReducedMotion()`-hook.
- **Avatar-system** (`src/components/avatar/`, `src/lib/avatars/`): emoji-baseret katalog (16 avatars + 16 hatte i 4 slots), slot-konflikt-resolution, vote attribution på resultat-side.

## Database migrations

Kører automatisk i Supabase. Senest tilføjet:
- `008_add_avatar.sql` — tilføjer `avatar_id` + `hat_ids` til `participants` (additive, backwards-compatible). Husk at køre: `npx supabase db reset` lokalt eller via Supabase dashboard SQL-editor.

## License

Privat.
