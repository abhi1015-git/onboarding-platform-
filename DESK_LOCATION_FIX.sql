-- Add desk_location to relevant tables
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS desk_location TEXT;
ALTER TABLE public.it_requests ADD COLUMN IF NOT EXISTS desk_location TEXT;

-- Ensure profiles has the theme and compact view columns for all roles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#3b82f6';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS compact_view BOOLEAN DEFAULT FALSE;

-- Ensure we have the it columns in candidates (already there but double check)
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS it_email TEXT;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS it_password TEXT;

-- Update the it_requests with desk_location if it's missing
-- (No specific update needed yet since it's a new column)

SELECT '✅ TABLES UPGRADED WITH DESK LOCATION AND THEME SUPPORT' as status;
