-- =================================================================
-- ADD POLICY DOCUMENTS TABLE (Safe Migration - No Data Loss)
-- This script only adds the missing policy_documents table
-- =================================================================

-- Create policy_documents table if it doesn't exist
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

-- Enable Row Level Security
ALTER TABLE public.policy_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow all access policy_documents" ON public.policy_documents;

-- Create policy to allow all access (matching your existing setup)
CREATE POLICY "Allow all access policy_documents" 
ON public.policy_documents 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Verify table was created
SELECT 'policy_documents table created successfully!' as status;
