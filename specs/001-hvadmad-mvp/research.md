# Research: HvadMad MVP

**Branch**: `001-hvadmad-mvp` | **Date**: 2026-05-16

## Research Decisions

### 1. Realtime Technology

**Decision**: Supabase Realtime (Presence + Broadcast channels)

**Rationale**: Supabase Realtime provides three primitives that map perfectly to HvadMad's needs:
- **Presence**: Track who's in a room (join/leave events, online status)
- **Broadcast**: Send voting state updates to all participants without database writes
- **Postgres Changes**: Listen for database changes (vote submissions, room state transitions)

Built-in reconnection with exponential backoff. No separate WebSocket server to deploy.

**Alternatives considered**:
- Socket.IO + custom Node server: More control but doubles deployment complexity
- Pusher/Ably: Third-party cost, vendor lock-in
- Server-Sent Events: Unidirectional, doesn't support presence natively

### 2. Room Code Generation

**Decision**: 5-character alphanumeric code (uppercase letters + digits, excluding ambiguous chars like 0/O, 1/I/L)

**Rationale**: 
- Character set: `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (29 chars)
- 29^5 = ~20 million possible codes
- Easy to read aloud, type on mobile
- Case-insensitive input (normalize to uppercase)
- Collision check on generation (query existing active rooms)

**Alternatives considered**:
- 4 chars: Only 707K combinations, collision risk with scale
- 6 chars: Harder to communicate verbally
- Words (like what3words): More memorable but harder to type on mobile

### 3. Session Identity

**Decision**: UUID v4 generated client-side, stored in `sessionStorage`

**Rationale**:
- Dies with browser tab (privacy-light principle)
- No server-side session management needed
- Combined with nickname for display purposes
- Reconnection: same tab = same session = resume position

**Alternatives considered**:
- localStorage: Persists across sessions (violates privacy-light)
- Supabase Anonymous Auth: Creates persistent user record in auth.users
- Cookie-based: Requires cookie consent banner (GDPR)

### 4. Food Option Data Structure

**Decision**: Static PostgreSQL table seeded at deployment time

**Rationale**:
- MVP needs ~50-100 options per category (5 categories = ~400 total options)
- Options are universal (not user-specific)
- Easy to curate and test
- Database allows future expansion (user suggestions, location-based)

**Categories and approximate option counts**:
- Hjemmelavet mad: 60 options (pasta, steg, salat, suppe, wok, etc.)
- Take-away: 50 options (pizza, sushi, burger, thai, indisk, etc.)
- Restaurant (køkkentype): 40 options (italiensk, japansk, dansk, mexican, etc.)
- Køkkentype (generelt): 30 options (asiatisk, europæisk, mellemøstlig, etc.)
- Hurtig aftensmad: 40 options (toast, æg, rugbrød, rester, etc.)

### 5. Match Explanation Generation

**Decision**: Template-based explanations in Danish, generated client-side

**Rationale**: Simple string templates that fill in vote statistics:
- "4 ud af 5 sagde ja til {option} — ingen sagde nej!"
- "Alle var positive! {option} fik fuld tilslutning."
- "{option} scorede højt fordi ingen havde stærke indvendinger."
- "Godt kompromis: de fleste sagde ja eller måske til {option}."

No need for AI/LLM generation in MVP. Templates cover the common patterns.

**Alternatives considered**:
- LLM-generated explanations: Overkill for MVP, adds latency and cost
- No explanation: Violates constitution principle VI (Decision Quality)

### 6. Database Cleanup Strategy

**Decision**: Supabase pg_cron extension runs hourly cleanup of expired rooms

**Rationale**:
- Rooms expire after 24h inactivity (last_activity timestamp)
- Cascade delete: room deletion removes participants, votes, results
- Hourly cron is sufficient granularity (no need for real-time expiry)
- pg_cron is built into Supabase, no external scheduler needed

**Alternatives considered**:
- Edge Function on schedule: More complex, separate deployment
- Client-side check on room access: Race conditions, doesn't free storage
- TTL on rows: Not natively supported in PostgreSQL

### 7. Mobile-First UI Framework

**Decision**: Tailwind CSS with custom design tokens, no component library

**Rationale**:
- Full control over touch targets (44px minimum)
- Mobile-first responsive utilities built-in
- Small bundle size vs. full component libraries
- Custom "Kahoot-like" feel requires custom design anyway

**Alternatives considered**:
- shadcn/ui: Good but opinionated, might fight against custom game-like UX
- Chakra UI: Bundle size concern, less Tailwind-native
- Material UI: Too "Google-looking", wrong vibe for fun food app
