-- migration: BRUTE_FORCE_DEDUPLICATION
-- This script will forcefully remove ANY duplicate candidates and their dependent data.
-- It prioritizes keeping the MOST RECENT profile created for any phone or email.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. IDENTIFY ALL DUPLICATES BASED ON PHONE
    FOR r IN (
        SELECT id as duplicate_id
        FROM (
            SELECT id,
            ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at DESC) as row_num
            FROM public.candidates
            WHERE phone IS NOT NULL AND phone != ''
        ) t
        WHERE t.row_num > 1
    ) LOOP
        -- Remove dependent data first to avoid FK errors
        DELETE FROM public.assets WHERE assigned_to = r.duplicate_id;
        DELETE FROM public.it_requests WHERE candidate_id = r.duplicate_id;
        DELETE FROM public.candidate_details WHERE candidate_id = r.duplicate_id;
        DELETE FROM public.candidate_responses WHERE candidate_id = r.duplicate_id;
        DELETE FROM public.notifications WHERE candidate_id = r.duplicate_id;
        DELETE FROM public.audit_logs WHERE record_id = r.duplicate_id::text;
        
        -- Delete the duplicate candidate
        DELETE FROM public.candidates WHERE id = r.duplicate_id;
    END LOOP;

    -- 2. IDENTIFY ALL DUPLICATES BASED ON EMAIL
    FOR r IN (
        SELECT id as duplicate_id
        FROM (
            SELECT id,
            ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as row_num
            FROM public.candidates
            WHERE email IS NOT NULL AND email != ''
        ) t
        WHERE t.row_num > 1
    ) LOOP
        -- Same cleanup as above
        DELETE FROM public.assets WHERE assigned_to = r.duplicate_id;
        DELETE FROM public.it_requests WHERE candidate_id = r.duplicate_id;
        DELETE FROM public.candidate_details WHERE candidate_id = r.duplicate_id;
        DELETE FROM public.candidate_responses WHERE candidate_id = r.duplicate_id;
        DELETE FROM public.notifications WHERE candidate_id = r.duplicate_id;
        
        DELETE FROM public.candidates WHERE id = r.duplicate_id;
    END LOOP;
END $$;

-- 3. APPLY CONSTRAINTS (Should now be clean)
ALTER TABLE public.candidates DROP CONSTRAINT IF EXISTS candidates_email_key;
ALTER TABLE public.candidates ADD CONSTRAINT candidates_email_key UNIQUE (email);

ALTER TABLE public.candidates DROP CONSTRAINT IF EXISTS candidates_phone_key;
ALTER TABLE public.candidates ADD CONSTRAINT candidates_phone_key UNIQUE (phone);

-- 4. Final Cache Refresh
NOTIFY pgrst, 'reload schema';

SELECT '✅ BRUTE FORCE CLEANUP COMPLETE' as status;
