-- Adds avatar configuration to participants for feature 003-avatars-hats-attribution.
-- Both columns are nullable / empty-default so existing rooms keep working without
-- a backfill — the client renders a deterministic placeholder when avatar_id is null.

alter table participants add column if not exists avatar_id text;
alter table participants add column if not exists hat_ids text[] not null default '{}';
