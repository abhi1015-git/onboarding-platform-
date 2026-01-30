-- =================================================================
-- 🌟 LOKACHAKRA MASTER PROVISIONING SCRIPT
-- =================================================================
-- This script creates the ENTIRE database schema from scratch.
-- It works safely even if run multiple times (Idempotent).

-- =================================================================
-- 1. CLEANUP (Optional - Use CAUTION)
-- =================================================================
-- Uncomment the lines below only if you want to WIPE EVERYTHING and start fresh.
-- DROP TABLE IF EXISTS public.notifications CASCADE;
-- DROP TABLE IF EXISTS public.orientations CASCADE;
-- DROP TABLE IF EXISTS public.it_requests CASCADE;
-- DROP TABLE IF EXISTS public.assets CASCADE;
-- DROP TABLE IF EXISTS public.candidate_documents CASCADE;
-- DROP TABLE IF EXISTS public.candidates CASCADE;
-- DROP TABLE IF EXISTS public.operational_units CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;
-- DROP TABLE IF EXISTS public.audit_logs CASCADE;

-- =================================================================
-- 2. CORE TABLES
-- =================================================================

-- 2.1 CANDIDATES
CREATE TABLE IF NOT EXISTS public.candidates (
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

-- 2.2 PROFILES (Users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT CHECK (role IN ('admin', 'hr', 'it', 'candidate')),
    status TEXT DEFAULT 'Active',
    phone TEXT,
    department TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 OPERATIONAL UNITS (Departments)
CREATE TABLE IF NOT EXISTS public.operational_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    head_name TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================
-- 3. MODULE TABLES
-- =================================================================

-- 3.1 IT REQUESTS
CREATE TABLE IF NOT EXISTS public.it_requests (
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

-- 3.2 ASSETS
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT,
    serial_number TEXT,
    status TEXT DEFAULT 'Available',
    assigned_to UUID REFERENCES public.candidates(id),
    purchase_date DATE,
    warranty_expiry DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.3 DOCUMENTS
CREATE TABLE IF NOT EXISTS public.candidate_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL,
    doc_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    status TEXT DEFAULT 'Pending', -- Pending, Verified, Rejected
    rejection_reason TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.4 ORIENTATIONS
CREATE TABLE IF NOT EXISTS public.orientations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    type TEXT DEFAULT 'Virtual',
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.5 NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- info, alert, success
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.6 AUDIT LOGS (For Admin Analytics)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    performed_by TEXT, -- Email or Name
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================
-- 4. SECURITY & PERMISSIONS
-- =================================================================

-- Enable RLS for all tables
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.it_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orientations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create "Allow All" policies for development
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

-- =================================================================
-- 5. INITIAL DATA SEEDING
-- =================================================================

-- 5.1 Seed Departments
INSERT INTO public.operational_units (name, head_name, status)
VALUES 
('Engineering', 'Rajesh Kumar', 'Active'),
('Design', 'Priya Sharma', 'Active'),
('Product', 'Amit Patel', 'Active'),
('HR', 'Sneha Reddy', 'Active'),
('Sales', 'Vikram Singh', 'Active'),
('Marketing', 'Arjun Mehta', 'Active'),
('Finance', 'Kavita Iyer', 'Active')
ON CONFLICT (name) DO NOTHING;

-- 5.2 Seed Users
INSERT INTO public.profiles (email, full_name, role, status)
VALUES 
('admin@nexus.com', 'System Admin', 'admin', 'Active'),
('hr@nexus.com', 'HR Manager', 'hr', 'Active'),
('it@nexus.com', 'IT Administrator', 'it', 'Active')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, status = 'Active';

-- 5.3 Seed Orientations
INSERT INTO public.orientations (title, date, time, type, location)
SELECT 'Company Culture & Values', '2024-03-15', '10:00 AM', 'Virtual', 'Zoom'
WHERE NOT EXISTS (SELECT 1 FROM public.orientations);

-- =================================================================
-- 6. VERIFICATION
-- =================================================================
SELECT 
    '✅ SYSTEM READY' as result,
    (SELECT COUNT(*) FROM public.candidates) as candidates,
    (SELECT COUNT(*) FROM public.it_requests) as it_requests,
    (SELECT COUNT(*) FROM public.operational_units) as departments,
    (SELECT COUNT(*) FROM public.notifications) as notifications,
    (SELECT COUNT(*) FROM public.orientations) as orientations;
