-- Comprehensive structured data tables for candidate onboarding

-- 1. Personal Information
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

-- 2. Offer & Policy Responses (Logs)
CREATE TABLE IF NOT EXISTS public.candidate_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
    response_type TEXT CHECK (response_type IN ('OFFER_ACCEPTANCE', 'POLICY_ACKNOWLEDGEMENT')),
    is_accepted BOOLEAN DEFAULT FALSE,
    ip_address TEXT,
    user_agent TEXT,
    accepted_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. Education (Future Proofing)
CREATE TABLE IF NOT EXISTS public.candidate_education (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
    institution TEXT,
    degree TEXT,
    field_of_study TEXT,
    start_date DATE,
    end_date DATE,
    percentage_cgpa TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Work Experience (Future Proofing)
CREATE TABLE IF NOT EXISTS public.candidate_experience (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
    company_name TEXT,
    designation TEXT,
    start_date DATE,
    end_date DATE,
    responsibilities TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for all
ALTER TABLE public.candidate_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_experience ENABLE ROW LEVEL SECURITY;

-- Simple "Allow All" policies for demo/easy setup
DROP POLICY IF EXISTS "Allow all candidate_details" ON public.candidate_details;
CREATE POLICY "Allow all candidate_details" ON public.candidate_details FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all candidate_responses" ON public.candidate_responses;
CREATE POLICY "Allow all candidate_responses" ON public.candidate_responses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all candidate_education" ON public.candidate_education;
CREATE POLICY "Allow all candidate_education" ON public.candidate_education FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all candidate_experience" ON public.candidate_experience;
CREATE POLICY "Allow all candidate_experience" ON public.candidate_experience FOR ALL USING (true) WITH CHECK (true);
