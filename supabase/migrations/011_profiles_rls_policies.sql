-- Migration: Add profiles RLS policies and admin bypass helper
-- Author: Antigravity

-- 1. Create a security definer helper to check if a user is an admin without recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Profiles Policies
DROP POLICY IF EXISTS "Allow select on profiles for owner" ON public.profiles;
DROP POLICY IF EXISTS "Allow select on own profile or for admins" ON public.profiles;
CREATE POLICY "Allow select on own profile or for admins" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Allow update on profiles for owner" ON public.profiles;
DROP POLICY IF EXISTS "Allow update on own profile or for admins" ON public.profiles;
CREATE POLICY "Allow update on own profile or for admins" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Allow delete on profiles for admins" ON public.profiles;
CREATE POLICY "Allow delete on profiles for admins" ON public.profiles
  FOR DELETE USING (public.is_admin(auth.uid()));

-- 4. Ensure contacts table has an INSERT policy that allows users and admins
DROP POLICY IF EXISTS "Users can insert own contacts or admins insert all" ON public.contacts;
CREATE POLICY "Users can insert own contacts or admins insert all" ON public.contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));
