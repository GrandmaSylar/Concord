-- Migration: Update contacts RLS policies to allow admins to view/edit/delete all contacts
-- Author: Antigravity
-- Reason: test@concord.com (admin) cannot see contacts imported under grandma@concord.com's user_id

-- 1. SELECT — admins see all, regular users see only their own
DROP POLICY IF EXISTS "Users can view own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can view own contacts or admins view all" ON public.contacts;
CREATE POLICY "Users can view own contacts or admins view all" ON public.contacts
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 2. UPDATE — admins can update all, regular users only their own
DROP POLICY IF EXISTS "Users can update own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update own contacts or admins update all" ON public.contacts;
CREATE POLICY "Users can update own contacts or admins update all" ON public.contacts
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 3. DELETE — admins can delete all, regular users only their own
DROP POLICY IF EXISTS "Users can delete own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete own contacts or admins delete all" ON public.contacts;
CREATE POLICY "Users can delete own contacts or admins delete all" ON public.contacts
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
