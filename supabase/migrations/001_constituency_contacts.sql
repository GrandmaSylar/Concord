-- Extend existing contacts table for Drybone constituency data
-- Makes phone nullable (Drybone contacts often lack phone numbers)
-- Adds constituency-specific fields as nullable columns

-- Allow phone to be NULL for imported contacts without numbers
ALTER TABLE public.contacts ALTER COLUMN phone DROP NOT NULL;

-- Add constituency-specific columns
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS voter_id             TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS position             TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS polling_station      TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS polling_station_code TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS sub_area             TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS has_contact          BOOLEAN DEFAULT true;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS has_voter_id         BOOLEAN DEFAULT false;

-- Indexes for fast constituency filtering
CREATE INDEX IF NOT EXISTS idx_contacts_sub_area         ON public.contacts(sub_area);
CREATE INDEX IF NOT EXISTS idx_contacts_position         ON public.contacts(position);
CREATE INDEX IF NOT EXISTS idx_contacts_polling_station  ON public.contacts(polling_station_code);
CREATE INDEX IF NOT EXISTS idx_contacts_has_contact      ON public.contacts(has_contact);

-- Allow all authenticated users to view constituency contacts (those with sub_area set)
-- This supplements existing per-user RLS — users can see shared constituency data
CREATE POLICY "Authenticated users can view constituency contacts"
  ON public.contacts FOR SELECT
  USING (sub_area IS NOT NULL AND auth.role() = 'authenticated');
