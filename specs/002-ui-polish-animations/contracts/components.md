# Component Contracts: UI Polish & Animationer

**Feature**: `002-ui-polish-animations`

**Date**: 2026-05-16

## Formål

Definér det offentlige API for hver ny komponent. Disse kontrakter fungerer som "interface contracts" på UI-niveau — de specificerer hvad der må sendes ind, hvad der kommer ud, og hvilken ARIA/keyboard/motion-adfærd der garanteres.

Alle komponenter MUST eksportere TypeScript-typer der matcher disse signaturer. Tasks-fasen (`/speckit-tasks`) bryder dem ned til konkrete implementations-opgaver med tests pr. kontrakt.

---

## 1. `<CursorFollower>`

**Path**: `src/components/ui/effects/CursorFollower.tsx`

**Formål**: Render et farverigt SVG-spor der følger mus/finger inden for sin container.

### Props

```ts
interface CursorFollowerProps {
  /** Width of the SVG canvas. Defaults to container width via ResizeObserver. */
  width?: number;
  /** Height of the SVG canvas. Defaults to container height via ResizeObserver. */
  height?: number;
  /** Brand colors for trails. Default: HvadMad brand palette (5 colors). */
  colors?: readonly [string, string, string, string, string];
  /** Milliseconds before a point is trimmed from the trail. Default: 400. */
  removeDelay?: number;
  /** Maximum simultaneous shapes per follower. Default: 20. */
  maxShapes?: number;
  /** Optional className for the wrapping div. */
  className?: string;
  /** Children render *under* the SVG layer (SVG has pointer-events: none). */
  children?: React.ReactNode;
}
```

### Adfærdsgarantier

| Garanti | Beskrivelse |
|---------|-------------|
| **Pointer pass-through** | SVG-laget har `pointer-events: none`; alle klik/touch passerer til children. |
| **Reduced motion** | Hvis `prefers-reduced-motion: reduce`, returnerer komponenten kun `<div>{children}</div>` uden SVG/listeners. |
| **Memory stability** | SVG-noder >`removeDelay` ms gamle fjernes fra DOM hver frame. Cap på `maxShapes`. |
| **Cleanup on unmount** | Alle `requestAnimationFrame`-loops, event-listeners og DOM-noder ryddes op i `useEffect`-cleanup. |
| **ARIA** | `<svg>` har `aria-hidden="true"` og `role="presentation"`. |
| **SSR-safe** | Komponenten må kun renderes klient-side; eksporteres derfor primært via `next/dynamic({ ssr: false })`. |
| **Touch + mouse** | Bruger `pointermove` event (unified API). |

### Eksempel-brug

```tsx
<CursorFollower className="absolute inset-0">
  <Hero />
</CursorFollower>
```

---

## 2. `<MotionProvider>`

**Path**: `src/components/ui/MotionConfig.tsx` (eksporterer `MotionProvider`)

**Formål**: Wrap app-træet i Framer Motion's `MotionConfig` med `reducedMotion="user"`.

### Props

```ts
interface MotionProviderProps {
  children: React.ReactNode;
}
```

### Adfærdsgarantier

| Garanti | Beskrivelse |
|---------|-------------|
| **Automatic reduced-motion** | Alle child Framer Motion-komponenter degraderer automatisk når brugeren har sat OS-præference. |
| **No re-renders** | Provider re-rendrer ikke ved navigation. |

---

## 3. `<PageTransition>`

**Path**: `src/components/ui/PageTransition.tsx` (anvendt fra `src/app/template.tsx`)

**Formål**: Wrap hver side i en konsistent fade/slide-overgang.

### Props

```ts
interface PageTransitionProps {
  children: React.ReactNode;
}
```

### Adfærdsgarantier

| Garanti | Beskrivelse |
|---------|-------------|
| **Enter** | `opacity: 0 → 1`, `translateY: 8px → 0`, varighed 220 ms, easing `easeOut`. |
| **Exit** | `opacity: 1 → 0`, varighed 160 ms, easing `easeIn`. |
| **Reduced motion** | Hopper direkte til slutstadiet (intet visuelt forsinkelse). |
| **No layout shift** | Bevarer fast positionering under overgangen. |

---

## 4. `<Button>`

**Path**: `src/components/ui/Button.tsx`

**Formål**: Erstatte `.btn-primary` / `.btn-secondary` CSS-klasser med en stærkt typed, polished primitive.

### Props

```ts
interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  /** Visual variant. Default: "primary". */
  variant?: "primary" | "secondary" | "ghost" | "vote-yes" | "vote-maybe" | "vote-no";
  /** Render as a different element (e.g., Next.js Link). Polymorphic via `as`. */
  as?: "button" | "a";
  /** Size variant. Default: "md". */
  size?: "sm" | "md" | "lg";
  /** When true, button shows a loading spinner and is disabled. */
  loading?: boolean;
  /** Optional leading/trailing icon nodes. */
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  /** When true, button stretches to fill width. Default: false. */
  fullWidth?: boolean;
  /** Button type for `<button>`. Default: "button" (NOT "submit"). */
  type?: "button" | "submit" | "reset";
}
```

### Adfærdsgarantier

| State | Adfærd |
|-------|--------|
| `idle` | Base baggrund, ingen shadow-glow. |
| `hover` | Tone-skift over 180 ms, øget shadow. |
| `focus-visible` | Synlig fokus-ring (brand-300, 2px offset, 2px width). |
| `active` | `scale(0.96)`, 80 ms. |
| `disabled` | `opacity: 0.5`, `cursor: not-allowed`, ingen hover. |
| `loading` | Disabled + spinner; `aria-busy="true"`. |

| Garanti | Beskrivelse |
|---------|-------------|
| **Touch target** | Min 44×44 px (alle størrelser). |
| **Reduced motion** | Hover/active transitions hopper til slutstadie. |
| **Keyboard** | Aktiveres med Space og Enter (native button-adfærd). |

---

## 5. `<Input>`

**Path**: `src/components/ui/Input.tsx`

**Formål**: Erstatte `.input-field` CSS-klasse med polished primitive.

### Props

```ts
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label rendered above the input (visible) or as aria-label. */
  label?: string;
  /** Whether label should be visually hidden (still accessible). Default: false. */
  hideLabel?: boolean;
  /** Error message rendered below the input. Sets aria-invalid. */
  error?: string;
  /** Helper text rendered below when no error. */
  hint?: string;
  /** Leading icon inside the input. */
  leadingIcon?: React.ReactNode;
  /** Trailing element (icon or button) inside the input. */
  trailingElement?: React.ReactNode;
  /** When true, input is full-width. Default: true. */
  fullWidth?: boolean;
}
```

### Adfærdsgarantier

| State | Adfærd |
|-------|--------|
| `idle` | Border-color: gray-200. |
| `hover` | Border-color: gray-300, 150 ms. |
| `focus-visible` | Border-color: brand-500, ring brand-200/50%, 150 ms. |
| `error` | Border-color: red-500, ring red-200/50%. |
| `disabled` | `opacity: 0.6`, baggrund gray-50. |

| Garanti | Beskrivelse |
|---------|-------------|
| **Label association** | `<label htmlFor={id}>` eller `aria-label`. |
| **Error association** | `aria-describedby` peger på error-message-id. |
| **Touch target** | Min 44 px højde. |

---

## 6. `<Card>`

**Path**: `src/components/ui/Card.tsx`

**Formål**: Erstatte `.card` CSS-klasse.

### Props

```ts
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** When true, card lifts slightly on hover (use only on clickable cards). Default: false. */
  interactive?: boolean;
  /** Padding variant. Default: "md". */
  padding?: "none" | "sm" | "md" | "lg";
}
```

### Adfærdsgarantier

| Garanti | Beskrivelse |
|---------|-------------|
| **Interactive hover** | Når `interactive=true`: shadow vokser fra `sm` → `md` over 200 ms. |
| **Layout stability** | Hover ændrer ikke kort-størrelse (skygge sker via `box-shadow`, ikke `transform`). |

---

## 7. `<Footer>`

**Path**: `src/components/ui/Footer.tsx`

**Formål**: Vis WeGoDigital.dk-branding-link på alle sider.

### Props

Ingen — komponenten er statisk indhold.

### Markup-kontrakt

```tsx
<footer className="...">
  <a
    href="https://www.WeGoDigital.dk"
    target="_blank"
    rel="noopener noreferrer"
    className="..."
  >
    Bygget af WeGoDigital.dk
  </a>
</footer>
```

### Adfærdsgarantier

| Garanti | Beskrivelse |
|---------|-------------|
| **Touch target** | Link har min 44×44 px tap-area (via padding). |
| **Hover/focus** | Farveskift fra gray-400 → gray-600 over 150 ms. |
| **Security** | `rel="noopener noreferrer"` forhindrer tabnabbing. |
| **Position** | Altid i bunden af viewport via CSS Grid (se `layout.tsx`-ændring). |

---

## 8. `<VoteCard>`

**Path**: `src/components/voting/VoteCard.tsx`

**Formål**: Animeret kort der præsenterer én madmulighed med Ja/Måske/Nej-knapper.

### Props

```ts
interface VoteCardProps {
  option: FoodOption;
  onVote: (vote: "ja" | "måske" | "nej") => void;
  /** Whether this card is the active one in the stack. Default: true. */
  active?: boolean;
}
```

### Adfærdsgarantier

| Garanti | Beskrivelse |
|---------|-------------|
| **Entry** | `opacity 0 → 1`, `scale 0.96 → 1`, 250 ms. |
| **Exit direction** | Ja: op (`y: -120%`, rotate `-8°`). Nej: ned (`y: +120%`, rotate `+8°`). Måske: højre (`x: +110%`, rotate `+12°`). 300 ms. |
| **Reduced motion** | Entry/exit hopper til slutstadie. |
| **Keyboard** | Pil op = ja, pil ned = nej, pil højre = måske; Enter aktiverer fokuseret knap. |

---

## 9. `<MatchScoreCounter>`

**Path**: `src/components/results/MatchScoreCounter.tsx`

**Formål**: Animér en procent fra 0 til target-værdi.

### Props

```ts
interface MatchScoreCounterProps {
  /** Target percentage (0–100). */
  target: number;
  /** Animation duration in ms. Default: 800. */
  duration?: number;
  /** Optional suffix (default: "%"). */
  suffix?: string;
}
```

### Adfærdsgarantier

| Garanti | Beskrivelse |
|---------|-------------|
| **Easing** | `easeOut` (hurtig start, blød afslutning). |
| **Reduced motion** | Viser øjeblikkeligt target uden animation. |
| **A11y** | Endelig værdi annonceres via `aria-live="polite"` efter animation er færdig. |

---

## 10. `<ResultRow>` + staggered reveal

**Path**: `src/components/results/ResultRow.tsx`

**Formål**: Vis ét resultat (rank, navn, score, forklaring) med stagger-baseret entry.

### Props

```ts
interface ResultRowProps {
  rank: 1 | 2 | 3 | 4 | 5;
  name: string;
  matchPercent: number;
  explanation: string;
  /** Index used for stagger delay calculation. */
  index: number;
}
```

### Adfærdsgarantier

| Garanti | Beskrivelse |
|---------|-------------|
| **Stagger** | Hver række forsinkes med `index * 150 ms`. |
| **Entry** | `opacity 0 → 1`, `y: 12 → 0`, 300 ms, easeOut. |
| **Reduced motion** | Ingen stagger, hopper direkte til slutstadie. |

---

## 11. `<RandomWheel>`

**Path**: `src/components/results/RandomWheel.tsx`

**Formål**: Spin-baseret tilfældig vælger blandt top-resultater.

### Props

```ts
interface RandomWheelProps {
  options: Array<{ name: string; color: string }>;
  /** Called with the winning option after spin completes. */
  onResult: (option: { name: string; color: string }) => void;
  /** Spin duration in ms. Default: 3000. */
  duration?: number;
}
```

### Adfærdsgarantier

| Garanti | Beskrivelse |
|---------|-------------|
| **Deterministic landing** | Final rotation = `360 * randomSpins + targetAngle`. |
| **Easing** | Custom cubic-bezier `[0.16, 1, 0.3, 1]`. |
| **Reduced motion** | Ingen spin — `onResult` kaldes efter 200 ms med tilfældig valg. |

---

## 12. Hooks

### `useReducedMotion()`

```ts
function useReducedMotion(): boolean;
```

Returnerer `true` hvis brugeren har `prefers-reduced-motion: reduce`. Tynd wrapper omkring Framer Motion's egen hook for at gøre import-stien konsistent.

### `usePointerTrail(callback)`

```ts
function usePointerTrail(
  callback: (position: { x: number; y: number }) => void,
  options?: { targetRef?: React.RefObject<HTMLElement> }
): void;
```

Binder `pointermove`-listener (mus + touch) og kalder `callback` med koordinater relative til `targetRef` (eller window). Ryddes op automatisk ved unmount.

---

## 13. Motion tokens

**Path**: `src/lib/motion/tokens.ts`

```ts
export const DURATION = {
  fast: 0.15,     // hover transitions
  base: 0.22,     // page transitions enter
  exit: 0.16,     // page transitions exit
  card: 0.30,    // vote card swipe
  reveal: 0.30,  // result row reveal
  count: 0.80,   // match score count-up
} as const;

export const EASING = {
  out: [0.16, 1, 0.3, 1] as const,
  in: [0.7, 0, 0.84, 0] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
  spring: { type: "spring", stiffness: 300, damping: 30 } as const,
} as const;

export const STAGGER = {
  row: 0.15,
} as const;
```

**Garanti**: Alle nye animationer i kodebasen MUST importere fra disse tokens — ingen magic numbers i komponentfiler. Dette giver os ét sted at ændre hele appens "føles"-profil.
