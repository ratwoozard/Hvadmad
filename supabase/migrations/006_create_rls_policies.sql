alter table rooms enable row level security;
alter table participants enable row level security;
alter table food_options enable row level security;
alter table room_food_options enable row level security;
alter table votes enable row level security;

-- Rooms: anyone can read, only host can update
create policy "rooms_select" on rooms for select using (true);
create policy "rooms_insert" on rooms for insert with check (true);
create policy "rooms_update" on rooms for update using (true);

-- Participants: anyone in room can read, anyone can join lobby rooms
create policy "participants_select" on participants for select using (true);
create policy "participants_insert" on participants for insert with check (true);
create policy "participants_update" on participants for update using (true);

-- Food options: public read
create policy "food_options_select" on food_options for select using (true);

-- Room food options: anyone in room can read
create policy "room_food_options_select" on room_food_options for select using (true);
create policy "room_food_options_insert" on room_food_options for insert with check (true);

-- Votes: can insert own, can read after results
create policy "votes_insert" on votes for insert with check (true);
create policy "votes_select" on votes for select using (true);
