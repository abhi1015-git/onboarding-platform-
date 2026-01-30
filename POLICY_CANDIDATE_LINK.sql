-- Migration to support candidate-specific policies
ALTER TABLE public.policy_documents ADD COLUMN IF NOT EXISTS candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE;

-- Optional: Link existing global policies to all candidates if needed, 
-- or leave them global/null. The user said they should "refresh" for every candidate,
-- so starting empty is likely what they want.

SELECT '✅ Candidate-specific policy support added' as status;
