create type room_status as enum ('lobby', 'voting', 'calculating', 'results');
create type voting_category as enum ('hjemmelavet', 'takeaway', 'restaurant', 'koekkentype', 'hurtig');

create table rooms (
  id uuid primary key default gen_random_uuid(),
  code varchar(6) not null,
  status room_status not null default 'lobby',
  category voting_category,
  host_session_id uuid not null,
  host_nickname varchar(20) not null,
  created_at timestamptz not null default now(),
  last_activity timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create unique index rooms_code_active_idx on rooms (code) where status != 'results';
create index rooms_expires_idx on rooms (expires_at);
