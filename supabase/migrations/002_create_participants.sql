create type participant_status as enum ('active', 'voting', 'done', 'inactive', 'disconnected');

create table participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  session_id uuid not null,
  nickname varchar(20) not null,
  is_host boolean not null default false,
  status participant_status not null default 'active',
  joined_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  has_voted boolean not null default false,
  unique(room_id, session_id)
);

create index participants_room_idx on participants (room_id);
