-- Migration: Auto-resolve failed messages when a resend succeeds
-- Author: Antigravity

-- 1. Create trigger function to auto-resolve older failures on success
CREATE OR REPLACE FUNCTION public.handle_message_success()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'sent' THEN
    UPDATE public.messages
    SET status = 'sent',
        content = CASE 
                    WHEN content LIKE '[RESENT-SUCCESS]%' THEN content 
                    ELSE '[RESENT-SUCCESS] ' || content 
                  END,
        retried = true
    WHERE recipient = NEW.recipient
      AND status = 'failed'
      AND sent_at <= NEW.sent_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing triggers if they exist
DROP TRIGGER IF EXISTS tr_message_success_update ON public.messages;
DROP TRIGGER IF EXISTS tr_message_success_insert ON public.messages;

-- 3. Create triggers for both INSERT and UPDATE
CREATE TRIGGER tr_message_success_update
  AFTER UPDATE OF status ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_message_success();

CREATE TRIGGER tr_message_success_insert
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_message_success();

-- 4. Backfill: Resolve any existing failed messages that have a corresponding successful send
UPDATE public.messages m1
SET status = 'sent',
    content = '[RESENT-SUCCESS] ' || m1.content,
    retried = true
WHERE m1.status = 'failed'
  AND EXISTS (
    SELECT 1 FROM public.messages m2
    WHERE m2.recipient = m1.recipient
      AND m2.status = 'sent'
      AND m2.sent_at >= m1.sent_at
  );
