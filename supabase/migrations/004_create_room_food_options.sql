create table room_food_options (
  room_id uuid not null references rooms(id) on delete cascade,
  food_option_id uuid not null references food_options(id) on delete cascade,
  display_order smallint not null,
  primary key (room_id, food_option_id)
);
