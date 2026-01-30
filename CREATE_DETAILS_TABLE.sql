-- Create a dedicated table for structured candidate personal information
CREATE TABLE IF NOT EXISTS public.candidate_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE UNIQUE,
    phone TEXT,
    dob DATE,
    gender TEXT,
    marital_status TEXT,
    nationality TEXT,
    blood_group TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    emergency_name TEXT,
    emergency_relation TEXT,
    emergency_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.candidate_details ENABLE ROW LEVEL SECURITY;

-- Policy for candidate_details
DROP POLICY IF EXISTS "Allow all access to candidate_details" ON public.candidate_details;
CREATE POLICY "Allow all access to candidate_details" 
ON public.candidate_details 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Ensure updated_at trigger exists (Optional but good)
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = NOW();
--     RETURN NEW;
-- END;
-- $$ language 'plpgsql';

-- CREATE TRIGGER update_candidate_details_updated_at BEFORE UPDATE ON public.candidate_details FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
