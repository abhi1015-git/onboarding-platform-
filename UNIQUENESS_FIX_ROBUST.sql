-- migration: ROBUST_UNIQUENESS_FIX
-- This script handles foreign key constraints by re-linking data before deleting duplicates.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Handle candidates duplicated by PHONE
    FOR r IN (
        SELECT 
            phone,
            id as duplicate_id,
            FIRST_VALUE(id) OVER (PARTITION BY phone ORDER BY created_at DESC) as keep_id
        FROM public.candidates
        WHERE phone IS NOT NULL AND phone != ''
    ) LOOP
        IF r.duplicate_id != r.keep_id THEN
            -- Re-link Assets
            UPDATE public.assets SET assigned_to = r.keep_id WHERE assigned_to = r.duplicate_id;
            -- Re-link IT Requests
            UPDATE public.it_requests SET candidate_id = r.keep_id WHERE candidate_id = r.duplicate_id;
            -- Re-link Details
            UPDATE public.candidate_details SET candidate_id = r.keep_id WHERE candidate_id = r.duplicate_id 
            ON CONFLICT (candidate_id) DO NOTHING;
            -- Re-link Responses
            UPDATE public.candidate_responses SET candidate_id = r.keep_id WHERE candidate_id = r.duplicate_id;
            -- Re-link Notifications
            UPDATE public.notifications SET candidate_id = r.keep_id WHERE candidate_id = r.duplicate_id;
            
            -- Finally delete the duplicate
            DELETE FROM public.candidates WHERE id = r.duplicate_id;
        END IF;
    END LOOP;

    -- 2. Handle candidates duplicated by EMAIL
    FOR r IN (
        SELECT 
            email,
            id as duplicate_id,
            FIRST_VALUE(id) OVER (PARTITION BY email ORDER BY created_at DESC) as keep_id
        FROM public.candidates
        WHERE email IS NOT NULL AND email != ''
    ) LOOP
        IF r.duplicate_id != r.keep_id THEN
            -- Re-link Assets
            UPDATE public.assets SET assigned_to = r.keep_id WHERE assigned_to = r.duplicate_id;
            -- Re-link IT Requests
            UPDATE public.it_requests SET candidate_id = r.keep_id WHERE candidate_id = r.duplicate_id;
            -- Re-link Details
            UPDATE public.candidate_details SET candidate_id = r.keep_id WHERE candidate_id = r.duplicate_id 
            ON CONFLICT (candidate_id) DO NOTHING;
            -- Re-link Responses
            UPDATE public.candidate_responses SET candidate_id = r.keep_id WHERE candidate_id = r.duplicate_id;
            -- Re-link Notifications
            UPDATE public.notifications SET candidate_id = r.keep_id WHERE candidate_id = r.duplicate_id;
            
            -- Finally delete the duplicate
            DELETE FROM public.candidates WHERE id = r.duplicate_id;
        END IF;
    END LOOP;
END $$;

-- 3. Now apply the constraints safely
ALTER TABLE public.candidates DROP CONSTRAINT IF EXISTS candidates_email_key;
ALTER TABLE public.candidates ADD CONSTRAINT candidates_email_key UNIQUE (email);

ALTER TABLE public.candidates DROP CONSTRAINT IF EXISTS candidates_phone_key;
ALTER TABLE public.candidates ADD CONSTRAINT candidates_phone_key UNIQUE (phone);

-- 4. Ensure candidate_details handles updates correctly
ALTER TABLE public.candidate_details DROP CONSTRAINT IF EXISTS candidate_details_candidate_id_key;
ALTER TABLE public.candidate_details ADD CONSTRAINT candidate_details_candidate_id_key UNIQUE (candidate_id);

-- 5. Refresh the schema cache
NOTIFY pgrst, 'reload schema';

SELECT '✅ DEDUPLICATION COMPLETE: All assets and requests have been re-assigned to primary records' as status;
