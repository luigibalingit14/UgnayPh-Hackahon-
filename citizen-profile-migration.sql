-- ============================================
-- CITIZEN PROFILE EXTENSION
-- Adds personal details fields to profiles table
-- Run this in your Supabase SQL Editor
-- ============================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS citizen_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sex TEXT CHECK (sex IN ('M', 'F'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS civil_status TEXT DEFAULT 'Single';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS barangay TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'NCR';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS philhealth_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS voter_status TEXT DEFAULT 'unregistered' CHECK (voter_status IN ('registered', 'unregistered'));

-- Auto-generate citizen_id for existing and new profiles
-- Format: UPH-XXXXXXXX (UPH = UgnayPH, 8 hex chars from UUID)
CREATE OR REPLACE FUNCTION public.generate_citizen_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.citizen_id IS NULL THEN
        NEW.citizen_id := 'UPH-' || UPPER(SUBSTRING(NEW.id::text, 1, 4)) || '-' || UPPER(SUBSTRING(NEW.id::text, 10, 4));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_citizen_id ON public.profiles;
CREATE TRIGGER auto_citizen_id
    BEFORE INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.generate_citizen_id();

-- Backfill citizen_id for existing profiles
UPDATE public.profiles
SET citizen_id = 'UPH-' || UPPER(SUBSTRING(id::text, 1, 4)) || '-' || UPPER(SUBSTRING(id::text, 10, 4))
WHERE citizen_id IS NULL;

-- Allow users to update their own extended profile fields
-- (The existing RLS policy "Users can update own profile" already covers this)
