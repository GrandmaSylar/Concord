-- Migration: Add retried column to messages table to filter out old retried dispatches
-- Author: Antigravity

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS retried boolean DEFAULT false NOT NULL;
