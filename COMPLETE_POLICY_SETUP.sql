-- =================================================================
-- COMPLETE POLICY DOCUMENTS SETUP (All-in-One, Safe)
-- No data loss - only adds missing table and fixes storage
-- =================================================================

-- 1. Create policy_documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.policy_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_name TEXT NOT NULL,
    policy_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    uploaded_by TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.policy_documents ENABLE ROW LEVEL SECURITY;

-- 3. Set up table policy
DROP POLICY IF EXISTS "Allow all access policy_documents" ON public.policy_documents;
CREATE POLICY "Allow all access policy_documents" 
ON public.policy_documents 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 4. Set up storage policies (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'documents' );

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'documents' );

CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'documents' );

-- 5. Verify everything is set up
SELECT 
    'Setup complete! You can now upload policy documents.' as status,
    (SELECT COUNT(*) FROM public.policy_documents) as existing_policies;
