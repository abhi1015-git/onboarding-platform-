-- migration: FINAL_DEDUPLICATION_FIX
-- This script cleans up duplicates and prepares the database for unique constraints.
-- It avoids invalid "UPDATE ... ON CONFLICT" syntax.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Identify and process duplicates
    -- We use a CTE to find all candidate IDs that are duplicates (not the latest for their phone/email)
    FOR r IN (
        WITH DuplicateList AS (
            SELECT 
                id,
                email,
                phone,
                FIRST_VALUE(id) OVER (PARTITION BY COALESCE(email, 'no-email-' || id::text), COALESCE(phone, 'no-phone-' || id::text) ORDER BY created_at DESC) as keep_id
            FROM public.candidates
        )
        SELECT id as duplicate_id, keep_id
        FROM DuplicateList
        WHERE id != keep_id
    ) LOOP
        -- Re-link important data to the record we are keeping
        UPDATE public.assets SET assigned_to = r.keep_id WHERE assigned_to = r.duplicate_id;
        UPDATE public.it_requests SET candidate_id = r.keep_id WHERE candidate_id = r.duplicate_id;
        
        -- For 1:1 or log data, we can just remove the duplicate's data to avoid unique errors
        DELETE FROM public.candidate_details WHERE candidate_id = r.duplicate_id;
        DELETE FROM public.candidate_responses WHERE candidate_id = r.duplicate_id;
        DELETE FROM public.notifications WHERE candidate_id = r.duplicate_id;
        
        -- Finally delete the duplicate candidate record
        DELETE FROM public.candidates WHERE id = r.duplicate_id;
    END LOOP;
END $$;

-- 2. Apply the unique constraints now that the data is clean
-- Ensure Email uniqueness
ALTER TABLE public.candidates DROP CONSTRAINT IF EXISTS candidates_email_key;
ALTER TABLE public.candidates ADD CONSTRAINT candidates_email_key UNIQUE (email);

-- Ensure Phone uniqueness
ALTER TABLE public.candidates DROP CONSTRAINT IF EXISTS candidates_phone_key;
ALTER TABLE public.candidates ADD CONSTRAINT candidates_phone_key UNIQUE (phone);

-- Ensure Candidate Details link is unique (1:1 relation)
ALTER TABLE public.candidate_details DROP CONSTRAINT IF EXISTS candidate_details_candidate_id_key;
ALTER TABLE public.candidate_details ADD CONSTRAINT candidate_details_candidate_id_key UNIQUE (candidate_id);

-- 3. Refresh the schema cache
NOTIFY pgrst, 'reload schema';

SELECT '✅ DATABASE CLEANED: Duplicates removed and unique constraints enforced.' as status;
