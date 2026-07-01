-- Add missing indices to improve query performance

CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON public.messages(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_user_id ON public.scheduled_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_status ON public.scheduled_reminders(status);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);
