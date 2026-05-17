-- Adds "collecting" room status and per-participant pick tracking for the new
-- "Alle vælger fra liste" mode where every participant contributes N picks
-- from a curated category list before voting starts.
--
-- Design notes:
--   * `collecting` sits between `lobby` and `voting` in the state machine.
--   * `collect_count` is host-configurable (1..5).
--   * `collect_deadline` is a hard cutoff; clients race to flip the room into
--     `voting` once it elapses (idempotent via status check).
--   * `participant_picks` uses (room_id, food_option_id) as PK so the DB
--     itself blocks duplicates — two participants can never pick the same
--     dish, matching the "block duplicate" UX decision.

alter type room_status add value if not exists 'collecting' before 'voting';

alter table rooms
  add column if not exists collect_count smallint,
  add column if not exists collect_deadline timestamptz;

alter table rooms
  add constraint rooms_collect_count_range
    check (collect_count is null or (collect_count between 1 and 5));

create table if not exists participant_picks (
  room_id uuid not null references rooms(id) on delete cascade,
  food_option_id uuid not null references food_options(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  picked_at timestamptz not null default now(),
  primary key (room_id, food_option_id)
);

create index if not exists participant_picks_room_idx
  on participant_picks (room_id);
create index if not exists participant_picks_participant_idx
  on participant_picks (participant_id);

alter table participant_picks enable row level security;

create policy "participant_picks_select" on participant_picks
  for select using (true);
create policy "participant_picks_insert" on participant_picks
  for insert with check (true);
create policy "participant_picks_delete" on participant_picks
  for delete using (true);
