# Data Model: UI Polish & Animationer

**Feature**: `002-ui-polish-animations`

**Date**: 2026-05-16

## Status

**Ingen nye persistente entiteter.** Denne feature er ren præsentation/UX-polering og introducerer ingen databasetabeller, kolonner eller migrations.

Eksisterende entiteter fra `001-hvadmad-mvp` (`Room`, `Participant`, `FoodOption`, `Vote`, `Result`) anvendes uændret.

## In-Memory / Klient-side modeller

For dokumentations skyld dokumenteres de in-memory strukturer som polish-laget introducerer. Disse persisteres aldrig — de eksisterer kun i komponent-state og DOM.

### 1. `FollowerPoint`

Repræsenterer ét punkt i cursor-effektens spor.

| Felt | Type | Beskrivelse |
|------|------|-------------|
| `position` | `{ x: number, y: number }` | Skærmkoordinater relativ til SVG-container |
| `time` | `number` | `Date.now()` ved oprettelse — bruges til alderstrimming |
| `drift` | `{ x: number, y: number }` | Tilfældig drift-vektor (gør sporet organisk) |
| `age` | `number` | Inkrementeret hver frame; bruges til at skalere drift |
| `direction` | `{ x: number, y: number }` | Bevægelsesvektor fra forrige punkt (× 0.25 dæmpning) |

**Lifecycle**: Punkter oprettes ved `pointermove`-event. Trimmes når `time < now - removeDelay` (default 400 ms). Maks ~30 punkter per Follower-instans.

### 2. `FollowerShape`

Et tilfældigt geometrisk element (cirkel/firkant/trekant) der fader ud.

| Felt | Type | Beskrivelse |
|------|------|-------------|
| `kind` | `"circle" \| "square" \| "triangle"` | Form-type (tilfældigt valgt med 10 % chance per nyt punkt) |
| `size` | `number` | Størrelse beregnet fra `direction`-vektorens magnitude |
| `origin` | `{ x: number, y: number }` | Start-position |
| `target` | `{ x: number, y: number }` | End-position (origin + drift × random factor) |
| `rotation` | `number` | Tilfældig endelig rotation (0–360°) |
| `color` | `string` | Hex-farve fra brand-paletten |

**Lifecycle**: Oprettes som SVG-element direkte i DOM. Animeres via CSS `transition` over 500 ms til target med `scale(0)`. Fjernes fra DOM efter animation via `setTimeout(cleanup, 500)`.

### 3. `MotionPreferences`

Klient-side cache af brugerens systempræferencer.

| Felt | Type | Beskrivelse |
|------|------|-------------|
| `reducedMotion` | `boolean` | `true` hvis `prefers-reduced-motion: reduce` er aktiv |
| `coarsePointer` | `boolean` | `true` hvis primary input er touch (`(pointer: coarse)`) |

**Lifecycle**: Opdateres via `matchMedia`-event-listeners. Lever i React Context via `MotionConfig`-providerens internals.

## State Transitions

### Cursor Follower-engine state-diagram

```text
┌────────────┐  prefers-reduced-motion=reduce   ┌──────────┐
│  inactive  │ ──────────────────────────────► │ disabled │
└─────┬──────┘                                  └──────────┘
      │ mount(svgEl)
      ▼
┌────────────┐
│   armed    │ ◄──────── pointerleave (no points for 2s)
└─────┬──────┘
      │ pointermove → addPoint()
      ▼
┌────────────┐
│  tracking  │ ─── tick() ──► trim old points + render paths
└────────────┘
      │ unmount()
      ▼
   destroyed
```

### Page Transition state (per route)

```text
enter:    opacity 0, y: 8 → opacity 1, y: 0  (220 ms, easeOut)
exit:     opacity 1 → opacity 0              (160 ms, easeIn)
reduced:  opacity 1 (instant)
```

### Vote Card state (per option)

```text
idle:      x: 0, y: 0, rotate: 0, opacity: 1
voting:    (user interaction — buttons active)
ja:        y: -120%, rotate: -8°, opacity: 0   (300 ms)
nej:       y: +120%, rotate: +8°, opacity: 0   (300 ms)
måske:     x: +110%, rotate: +12°, opacity: 0  (300 ms)
reduced:   opacity: 0 (instant)
```

## Validation Rules

Da der ikke er persistent data, er valideringsreglerne UI-orienterede:

- **FollowerPoint.position**: `0 ≤ x ≤ container.width` og `0 ≤ y ≤ container.height`. Punkter udenfor container droppes.
- **FollowerShape lifecycle**: Maks 20 samtidige shapes per Follower-instans (capped).
- **MotionPreferences.reducedMotion**: Read-only — kommer fra OS via `matchMedia`.

## Relationer

Ingen relationer til persistent data. `MotionPreferences` er en singleton (én per app-instans) via React Context.

## Migrations

**Ingen.** Denne feature kræver hverken Supabase-migrations eller schema-ændringer.
