-- Migration: Add secure dev_password column to system_settings and configure column-level security
-- Author: Antigravity

-- 1. Add dev_password column with a default value of the current passphrase
ALTER TABLE public.system_settings 
ADD COLUMN dev_password text NOT NULL DEFAULT 'Breakfast@9am';

-- 2. Revoke all select and update privileges on system_settings from public roles to lock access
REVOKE SELECT, UPDATE ON public.system_settings FROM public, anon, authenticated;

-- 3. Grant select privileges ONLY on non-sensitive branding columns to public roles
GRANT SELECT (id, primary_color, secondary_color, login_bg_url, watermark_url, watermark_opacity, updated_at) 
ON public.system_settings 
TO anon, authenticated;

-- 4. Grant update privileges ONLY on styling configuration columns to authenticated users
GRANT UPDATE (primary_color, secondary_color, login_bg_url, watermark_url, watermark_opacity) 
ON public.system_settings 
TO authenticated;
