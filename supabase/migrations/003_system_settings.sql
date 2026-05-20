CREATE TABLE public.system_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  primary_color text NOT NULL DEFAULT '#2563eb',
  secondary_color text NOT NULL DEFAULT '#4f46e5',
  login_bg_url text,
  watermark_url text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert the default NPP Preset row (we enforce a single row by using a fixed UUID)
INSERT INTO public.system_settings (id, primary_color, secondary_color, login_bg_url, watermark_url)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '#063b82', -- Deep Blue from flyer
  '#d32f2f', -- Striking Red from flyer
  '/WhatsApp Image 2026-05-19 at 8.32.50 AM.jpeg',
  '/10222020147300g730m4yxsnppflag1.jpeg'
) ON CONFLICT (id) DO NOTHING;

-- Set up Row-Level Security
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Everyone (even unauthenticated users on the login page) needs to read the settings
CREATE POLICY "Anyone can read system settings" ON public.system_settings
  FOR SELECT USING (true);

-- Authenticated users (devs) can update the settings
CREATE POLICY "Authenticated users can update system settings" ON public.system_settings
  FOR UPDATE USING (auth.role() = 'authenticated');
