-- Create cron jobs using the service role JWT so edge functions accept the Bearer token
select cron.schedule(
  'process-pending-sms',
  '* * * * *',
  $$
  select net.http_post(
    url:='https://vjcvmfnobjgsdsmkqijv.supabase.co/functions/v1/process-messages',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqY3ZtZm5vYmpnc2RzbWtxaWp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTAzNzg0MSwiZXhwIjoyMDk0NjEzODQxfQ.lJmZ7yjbGgTYsgDL8G0uE0GUiCWW9bmKSYyiTXvK5LE"}'::jsonb
  );
  $$
);

select cron.schedule(
  'process-scheduled-reminders',
  '* * * * *',
  $$
  select net.http_post(
    url:='https://vjcvmfnobjgsdsmkqijv.supabase.co/functions/v1/process-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqY3ZtZm5vYmpnc2RzbWtxaWp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTAzNzg0MSwiZXhwIjoyMDk0NjEzODQxfQ.lJmZ7yjbGgTYsgDL8G0uE0GUiCWW9bmKSYyiTXvK5LE"}'::jsonb
  );
  $$
);
