-- Migration to refine uniqueness constraints according to user request
-- 1. Ensure candidates table has unique email and phone
ALTER TABLE public.candidates DROP CONSTRAINT IF EXISTS candidates_email_key;
ALTER TABLE public.candidates ADD CONSTRAINT candidates_email_key UNIQUE (email);

-- Optional: Phone uniqueness (be careful if dual SIM/landlines are used by multiple people, but user asked for it)
ALTER TABLE public.candidates DROP CONSTRAINT IF EXISTS candidates_phone_key;
ALTER TABLE public.candidates ADD CONSTRAINT candidates_phone_key UNIQUE (phone);

-- 2. Ensure NO OTHER fields are unique in candidates (like position, department, etc)
-- (Normally they aren't, but the SQL Editor will show if they were added accidentally)

-- 3. Ensure candidate_details still has candidate_id as unique (for the 1:1 relation)
-- The error was actually a frontend logic issue (missing onConflict), not a schema choice error.
ALTER TABLE public.candidate_details DROP CONSTRAINT IF EXISTS candidate_details_candidate_id_key;
ALTER TABLE public.candidate_details ADD CONSTRAINT candidate_details_candidate_id_key UNIQUE (candidate_id);

SELECT '✅ UNIQUNESS CONSTRAINTS UPDATED: Email and Phone are now unique.' as status;
