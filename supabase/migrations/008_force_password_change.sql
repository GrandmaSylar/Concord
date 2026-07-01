-- Migration: Add force_password_change column to profiles and set existing profiles to true
-- Author: Antigravity

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN NOT NULL DEFAULT true;

-- Enforce password change for all existing users immediately
UPDATE public.profiles SET force_password_change = true;
