create table food_options (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  category voting_category not null,
  description varchar(200),
  emoji varchar(10),
  tags text[] default '{}'
);

create index food_options_category_idx on food_options (category);
