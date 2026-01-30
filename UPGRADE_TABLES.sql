-- Add missing columns to profiles table to support settings and notifications
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS candidate_updates BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS resource_alerts BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#3b82f6';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS compact_view BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS slack_integrated BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS teams_integrated BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Also ensure candidates table has the necessary columns for tracking policy and device acknowledgements correctly
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS policy_accepted_at TIMESTAMPTZ;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS device_received_at TIMESTAMPTZ;

-- Re-enable RLS and policies just in case
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for profiles" ON public.profiles;
CREATE POLICY "Enable all access for profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
