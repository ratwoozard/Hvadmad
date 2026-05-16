-- Cleanup function to remove expired rooms
create or replace function cleanup_expired_rooms()
returns void as $$
begin
  delete from rooms
  where last_activity < now() - interval '24 hours';
end;
$$ language plpgsql security definer;

-- Enable pg_cron extension (if available)
-- Note: pg_cron must be enabled in Supabase dashboard under Extensions
-- Schedule: run every hour
-- select cron.schedule('cleanup-expired-rooms', '0 * * * *', 'select cleanup_expired_rooms()');
