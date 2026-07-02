-- Migration: Add Admin RLS Policies for Messages, Contacts, Reminders, and Templates
-- Author: Antigravity

-- 1. Messages Policies
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages or admins can view all" 
ON public.messages FOR SELECT 
USING (
  auth.uid() = user_id 
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 2. Contacts Policies
DROP POLICY IF EXISTS "Users can view own contacts" ON public.contacts;
CREATE POLICY "Users can view own contacts or admins can view all" 
ON public.contacts FOR SELECT 
USING (
  auth.uid() = user_id 
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "Users can update own contacts" ON public.contacts;
CREATE POLICY "Users can update own contacts or admins can manage all" 
ON public.contacts FOR UPDATE 
USING (
  auth.uid() = user_id 
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "Users can delete own contacts" ON public.contacts;
CREATE POLICY "Users can delete own contacts or admins can manage all" 
ON public.contacts FOR DELETE 
USING (
  auth.uid() = user_id 
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 3. Scheduled Reminders Policies
DROP POLICY IF EXISTS "Users can view own reminders" ON public.scheduled_reminders;
CREATE POLICY "Users can view own reminders or admins can view all" 
ON public.scheduled_reminders FOR SELECT 
USING (
  auth.uid() = user_id 
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "Users can update own reminders" ON public.scheduled_reminders;
CREATE POLICY "Users can update own reminders or admins can manage all" 
ON public.scheduled_reminders FOR UPDATE 
USING (
  auth.uid() = user_id 
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "Users can delete own reminders" ON public.scheduled_reminders;
CREATE POLICY "Users can delete own reminders or admins can manage all" 
ON public.scheduled_reminders FOR DELETE 
USING (
  auth.uid() = user_id 
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 4. Templates Policies
DROP POLICY IF EXISTS "Users can view own templates" ON public.templates;
CREATE POLICY "Users can view own templates or admins can view all" 
ON public.templates FOR SELECT 
USING (
  auth.uid() = user_id 
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "Users can update own templates" ON public.templates;
CREATE POLICY "Users can update own templates or admins can manage all" 
ON public.templates FOR UPDATE 
USING (
  auth.uid() = user_id 
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "Users can delete own templates" ON public.templates;
CREATE POLICY "Users can delete own templates or admins can manage all" 
ON public.templates FOR DELETE 
USING (
  auth.uid() = user_id 
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
