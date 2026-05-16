# Realtime Channel Contracts: HvadMad MVP

**Date**: 2026-05-16

## Channel Naming Convention

All channels use the pattern: `room:{room_code}`

Example: `room:ABCD5`

## Presence (Who's in the Room)

**Channel**: `room:{code}`
**Type**: Supabase Realtime Presence

### Presence State (per participant)

```typescript
interface PresenceState {
  session_id: string;      // UUID
  nickname: string;        // 2-20 chars
  is_host: boolean;
  status: 'active' | 'voting' | 'done';
  joined_at: string;       // ISO timestamp
}
```

### Events

- `presence_state` → Full sync of all participants
- `presence_diff` → Join/leave updates (keys: `joins`, `leaves`)

## Broadcast (Room Events)

**Channel**: `room:{code}`
**Type**: Supabase Realtime Broadcast

### Event: `room_status_change`

Sent when room transitions between states.

```typescript
interface RoomStatusChange {
  type: 'room_status_change';
  payload: {
    new_status: 'lobby' | 'voting' | 'calculating' | 'results';
    category?: string;         // Set when transitioning to 'voting'
    food_option_count?: number; // Number of options to vote on
    triggered_by: string;       // session_id of triggering user
  };
}
```

### Event: `vote_progress`

Sent when a participant completes all their votes.

```typescript
interface VoteProgress {
  type: 'vote_progress';
  payload: {
    session_id: string;    // Who finished voting
    nickname: string;
    total_voted: number;   // How many participants have completed
    total_participants: number;
  };
}
```

### Event: `host_transfer`

Sent when host role is transferred (disconnect timeout).

```typescript
interface HostTransfer {
  type: 'host_transfer';
  payload: {
    old_host_session_id: string;
    new_host_session_id: string;
    new_host_nickname: string;
    reason: 'disconnect_timeout' | 'manual';
  };
}
```

### Event: `participant_kicked`

Sent when host removes a participant.

```typescript
interface ParticipantKicked {
  type: 'participant_kicked';
  payload: {
    session_id: string;
    nickname: string;
    reason: string;
  };
}
```

## Postgres Changes (Database Listeners)

### Votes Table

**Filter**: `room_id=eq.{room_id}`
**Events**: INSERT only

Used for real-time vote counting (how many votes submitted, not vote values).

### Room Table

**Filter**: `id=eq.{room_id}`
**Events**: UPDATE

Used for detecting status changes as backup to Broadcast.

## Client Subscription Pattern

```typescript
// Pseudocode for room subscription
const channel = supabase.channel(`room:${roomCode}`)
  .on('presence', { event: 'sync' }, handlePresenceSync)
  .on('presence', { event: 'join' }, handleParticipantJoin)
  .on('presence', { event: 'leave' }, handleParticipantLeave)
  .on('broadcast', { event: 'room_status_change' }, handleStatusChange)
  .on('broadcast', { event: 'vote_progress' }, handleVoteProgress)
  .on('broadcast', { event: 'host_transfer' }, handleHostTransfer)
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track(presenceState);
    }
  });
```

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Channel subscription fails | Retry with exponential backoff (1s, 2s, 4s, max 30s) |
| Presence track fails | Retry once, then show "Forbindelse mistet" UI |
| Broadcast send fails | Queue locally, retry on reconnect |
| Room not found | Unsubscribe, show "Rummet er udløbet" |
