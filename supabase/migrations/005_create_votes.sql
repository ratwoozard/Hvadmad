create table votes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  food_option_id uuid not null references food_options(id) on delete cascade,
  value smallint not null check (value in (-3, 1, 2)),
  created_at timestamptz not null default now(),
  unique(room_id, participant_id, food_option_id)
);

create index votes_room_idx on votes (room_id);
