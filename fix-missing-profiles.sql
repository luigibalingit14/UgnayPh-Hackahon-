-- ==============================================================
-- FIX: SYNC MISSING USERS FROM auth.users TO public.profiles
-- ==============================================================
-- This script will insert missing users (created via Supabase Auth but missing in public.profiles)
-- ensuring they appear in the Admin Portal mapping.

INSERT INTO public.profiles (id, full_name)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'Unknown User')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);
