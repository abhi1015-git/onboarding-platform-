-- =================================================================
-- 🧨 HARD RESET SCRIPT
-- WARNING: THIS WILL DELETE ALL DATA AND RECREATE ALL TABLES
-- This is necessary to ensure your database EXACTLY matches the code.
-- =================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. DROP ALMOST EVERYTHING (To remove any bad tables/columns)
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.orientations CASCADE;
DROP TABLE IF EXISTS public.it_requests CASCADE;
DROP TABLE IF EXISTS public.assets CASCADE;
DROP TABLE IF EXISTS public.candidate_documents CASCADE;
DROP TABLE IF EXISTS public.candidates CASCADE;
DROP TABLE IF EXISTS public.operational_units CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;

-- 3. RECREATE TABLES (Clean Slate)

-- 3.1 CANDIDATES
CREATE TABLE public.candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT,
    email TEXT,
    phone TEXT,
    position TEXT,
    department TEXT,
    progress INTEGER DEFAULT 0,
    hr_status TEXT DEFAULT 'Pending',
    it_status TEXT DEFAULT 'Pending',
    status TEXT DEFAULT 'Pending',
    location TEXT DEFAULT 'Remote',
    employment_type TEXT DEFAULT 'Full-time',
    ctc INTEGER DEFAULT 0,
    joining_date DATE,
    reporting_manager TEXT,
    assigned_hr TEXT,
    assigned_it TEXT,
    it_email TEXT,
    it_password TEXT,
    offer_accepted BOOLEAN DEFAULT FALSE,
    policy_accepted BOOLEAN DEFAULT FALSE,
    device_received BOOLEAN DEFAULT FALSE,
    personal_info JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 PROFILES (Users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT CHECK (role IN ('admin', 'hr', 'it', 'candidate')),
    status TEXT DEFAULT 'Active',
    phone TEXT,
    department TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.3 OPERATIONAL UNITS (Departments)
CREATE TABLE public.operational_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    head_name TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.4 IT REQUESTS
CREATE TABLE public.it_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL DEFAULT 'Software, Access & Hardware',
    items TEXT,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    assigned_to UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.5 ASSETS
CREATE TABLE public.assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_tag TEXT UNIQUE,
    category TEXT,
    name TEXT NOT NULL,
    type TEXT,
    serial_number TEXT,
    status TEXT DEFAULT 'Available',
    assigned_to UUID REFERENCES public.candidates(id),
    purchase_date DATE,
    warranty_expiry DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.6 DOCUMENTS
CREATE TABLE public.candidate_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL,
    doc_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    rejection_reason TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(candidate_id, doc_type)
);

-- 3.7 ORIENTATIONS
CREATE TABLE public.orientations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    type TEXT DEFAULT 'Virtual',
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.8 NOTIFICATIONS
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.9 POLICY DOCUMENTS
CREATE TABLE public.policy_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_name TEXT NOT NULL,
    policy_type TEXT NOT NULL, -- 'Code of Conduct', 'ISP', 'Data Privacy', 'AUP', 'Safety'
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    uploaded_by TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PERMISSIONS
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.it_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orientations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_documents ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
    tbl text;
BEGIN 
    FOR tbl IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS "Allow all access %I" ON public.%I', tbl, tbl); 
        EXECUTE format('CREATE POLICY "Allow all access %I" ON public.%I FOR ALL USING (true) WITH CHECK (true)', tbl, tbl); 
    END LOOP; 
END $$;

-- 5. SEED DATA
INSERT INTO public.operational_units (name, head_name, status) VALUES 
('Engineering', 'Rajesh Kumar', 'Active'),
('Design', 'Priya Sharma', 'Active'),
('Product', 'Amit Patel', 'Active'),
('HR', 'Sneha Reddy', 'Active'),
('Sales', 'Vikram Singh', 'Active'),
('Marketing', 'Arjun Mehta', 'Active'),
('Finance', 'Kavita Iyer', 'Active')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.profiles (email, full_name, role, status) VALUES 
('admin@nexus.com', 'System Admin', 'admin', 'Active'),
('hr@nexus.com', 'HR Manager', 'hr', 'Active'),
('it@nexus.com', 'IT Administrator', 'it', 'Active')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, status = 'Active';

INSERT INTO public.orientations (title, date, time, type, location) VALUES
('Company Culture & Values', '2024-03-15', '10:00 AM', 'Virtual', 'Zoom');

SELECT '✅ HARD RESET COMPLETE' as status;
