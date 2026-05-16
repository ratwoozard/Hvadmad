# Data Model: HvadMad MVP

**Branch**: `001-hvadmad-mvp` | **Date**: 2026-05-16

## Entities

### Room

Repræsenterer en aktiv mad-afstemningssession.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Intern identifikator |
| code | VARCHAR(6) | UNIQUE, NOT NULL | Offentlig rumkode (5 tegn, uppercase alphanumeric) |
| status | ENUM | NOT NULL, DEFAULT 'lobby' | Room state: lobby, voting, calculating, results |
| category | VARCHAR(50) | NULL | Valgt madkategori (null i lobby) |
| host_session_id | UUID | NOT NULL | Session-ID for værten |
| host_nickname | VARCHAR(20) | NOT NULL | Værtens nickname |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Oprettelsestidspunkt |
| last_activity | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Sidst aktive tidspunkt (for expiry) |
| expires_at | TIMESTAMPTZ | NOT NULL | Beregnet udløbstidspunkt (created_at + 24h) |

**State transitions**:
- `lobby` → `voting` (host triggers, requires ≥1 participant)
- `voting` → `calculating` (all voted OR host forces)
- `calculating` → `results` (calculation complete)
- Any state → expired (24h inactivity, handled by cron)

### Participant

En deltager i et rum. Inkluderer værten.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Intern identifikator |
| room_id | UUID | FK → Room.id, NOT NULL | Hvilket rum deltageren er i |
| session_id | UUID | NOT NULL | Browser session identifikator |
| nickname | VARCHAR(20) | NOT NULL | Visningsnavn (2-20 tegn) |
| is_host | BOOLEAN | NOT NULL, DEFAULT false | Om deltageren er vært |
| status | ENUM | NOT NULL, DEFAULT 'active' | active, voting, done, inactive, disconnected |
| joined_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Hvornår de joinede |
| last_seen | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Sidste aktivitetstidspunkt |
| has_voted | BOOLEAN | NOT NULL, DEFAULT false | Om de har afsluttet stemmeafgivelse |

**Unique constraint**: (room_id, session_id) — én session per rum.

### FoodOption

Statisk kurateret madmulighed.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Intern identifikator |
| name | VARCHAR(100) | NOT NULL | Navn på retten/typen (dansk) |
| category | VARCHAR(50) | NOT NULL | Hvilken kategori (hjemmelavet, take-away, etc.) |
| description | VARCHAR(200) | NULL | Kort beskrivelse (valgfri) |
| emoji | VARCHAR(10) | NULL | Emoji til visuel genkendelighed |
| tags | TEXT[] | DEFAULT '{}' | Tags for fremtidig filtrering |

**Index**: (category) for hurtig filtrering ved afstemningsstart.

### Vote

En deltagers stemme på én madmulighed i ét rum.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Intern identifikator |
| room_id | UUID | FK → Room.id, NOT NULL | Hvilket rum |
| participant_id | UUID | FK → Participant.id, NOT NULL | Hvem stemte |
| food_option_id | UUID | FK → FoodOption.id, NOT NULL | Hvad de stemte på |
| value | SMALLINT | NOT NULL, CHECK(value IN (-3, 1, 2)) | Stemmeværdi: Nej=-3, Måske=+1, Ja=+2 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Hvornår stemmen blev afgivet |

**Unique constraint**: (room_id, participant_id, food_option_id) — én stemme per person per mulighed.

### RoomFoodOption

Linking table: hvilke madmuligheder er aktive i et specifikt rum.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| room_id | UUID | FK → Room.id, NOT NULL | Rummet |
| food_option_id | UUID | FK → FoodOption.id, NOT NULL | Madmuligheden |
| display_order | SMALLINT | NOT NULL | Rækkefølge i afstemningen |

**Primary key**: (room_id, food_option_id)

## Relationships

```text
Room 1──* Participant       (et rum har mange deltagere)
Room 1──* RoomFoodOption    (et rum har mange aktive madmuligheder)
Room 1──* Vote              (et rum har mange stemmer)
Participant 1──* Vote       (en deltager afgiver mange stemmer)
FoodOption 1──* RoomFoodOption  (en madmulighed kan være i mange rum)
FoodOption 1──* Vote        (en madmulighed kan have mange stemmer)
```

## Lifecycle & Cleanup

1. **Room creation**: Insert Room + Participant (host) atomisk
2. **Join**: Insert Participant med room_id
3. **Start voting**: Update Room.status → 'voting', insert RoomFoodOptions (random selection from category)
4. **Vote**: Insert Vote per food option per participant
5. **Complete**: Update Room.status → 'results' when all have voted
6. **Expiry**: pg_cron deletes rooms where last_activity < NOW() - INTERVAL '24 hours'
7. **Cascade**: ON DELETE CASCADE on all FK relationships to Room

## Row-Level Security (RLS)

| Table | Policy | Rule |
|-------|--------|------|
| Room | SELECT | Anyone with room code can read |
| Room | UPDATE | Only host (matching session_id) can change status/category |
| Participant | SELECT | Anyone in same room can read |
| Participant | INSERT | Anyone can join if room is in 'lobby' state |
| Vote | INSERT | Participant can insert own votes (session_id match) |
| Vote | SELECT | Only visible after room.status = 'results' |
| FoodOption | SELECT | Public read access |

## Indexes

- `rooms_code_idx`: UNIQUE index on Room.code WHERE status != 'expired'
- `rooms_expires_idx`: Index on Room.expires_at for cleanup queries
- `participants_room_idx`: Index on Participant.room_id for lobby queries
- `votes_room_idx`: Index on Vote.room_id for result calculation
- `food_options_category_idx`: Index on FoodOption.category for selection queries
