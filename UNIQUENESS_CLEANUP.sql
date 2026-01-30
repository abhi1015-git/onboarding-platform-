-- migration: CLEANUP_AND_ENFORCE_UNIQUENESS
-- 1. Identify and delete duplicates keeping only the latest one to allow constraint creation
DELETE FROM public.candidates
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
        ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at DESC) as row_num
        FROM public.candidates
        WHERE phone IS NOT NULL AND phone != ''
    ) t
    WHERE t.row_num > 1
);

DELETE FROM public.candidates
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
        ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as row_num
        FROM public.candidates
        WHERE email IS NOT NULL AND email != ''
    ) t
    WHERE t.row_num > 1
);

-- 2. Now apply the constraints since duplicates are gone
ALTER TABLE public.candidates DROP CONSTRAINT IF EXISTS candidates_email_key;
ALTER TABLE public.candidates ADD CONSTRAINT candidates_email_key UNIQUE (email);

ALTER TABLE public.candidates DROP CONSTRAINT IF EXISTS candidates_phone_key;
ALTER TABLE public.candidates ADD CONSTRAINT candidates_phone_key UNIQUE (phone);

-- 3. Ensure candidate_details handles updates correctly
ALTER TABLE public.candidate_details DROP CONSTRAINT IF EXISTS candidate_details_candidate_id_key;
ALTER TABLE public.candidate_details ADD CONSTRAINT candidate_details_candidate_id_key UNIQUE (candidate_id);

-- 4. Refresh the schema cache
NOTIFY pgrst, 'reload schema';

SELECT '✅ DUPLICATES CLEANED AND UNIQUENESS ENFORCED' as status;
