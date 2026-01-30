-- ============================================
-- 🗑️ RESET SCRIPT: DELETE ALL CANDIDATES
-- Use this to clear all test data and start fresh
-- ============================================

-- 1. DELETE from dependent tables first (to avoid foreign key errors)
DELETE FROM public.it_requests;
DELETE FROM public.candidate_documents;
DELETE FROM public.assets WHERE assigned_to IS NOT NULL;

-- 2. DELETE all candidates
DELETE FROM public.candidates;

-- 3. VERIFY everything is empty
SELECT '✅ Data Cleared' as status, 
       (SELECT COUNT(*) FROM public.candidates) as remaining_candidates;
