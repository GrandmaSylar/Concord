-- Add sender_id column to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS sender_id TEXT;

-- Add sender_id column to scheduled_reminders table
ALTER TABLE public.scheduled_reminders ADD COLUMN IF NOT EXISTS sender_id TEXT;
