-- ============================================
-- FIX: ENABLE USERS TO SAVE THEIR OWN PROFILES
-- ============================================

-- When we enabled Row Level Security (RLS) earlier to secure the maps,
-- it naturally blocked the "Save Profile" UPDATE commands from the frontend.
-- This policy explicitly allows a logged-in user to edit their own data.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile" 
        ON public.profiles FOR UPDATE 
        USING (auth.uid() = id);
    END IF;
END
$$;
