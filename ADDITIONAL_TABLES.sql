-- 1. AUDIT LOGS (For "every data stored" requirement)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email TEXT,
    action TEXT,
    table_name TEXT,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MEETINGS (For Zoom/Teams integration)
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    meeting_type TEXT DEFAULT 'zoom', -- 'zoom' or 'teams'
    meeting_link TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PAYROLL BATCHES (To track batch processing)
CREATE TABLE IF NOT EXISTS public.payroll_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_name TEXT NOT NULL,
    total_amount DECIMAL(15, 2),
    employee_count INTEGER,
    status TEXT DEFAULT 'processed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. UPDATE PROFILES (Ensure theme_color column exists)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#3b82f6';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS compact_view BOOLEAN DEFAULT FALSE;

-- 5. ENABLE RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_batches ENABLE ROW LEVEL SECURITY;

-- 6. PERMISSIONS (Allow all for demo)
DROP POLICY IF EXISTS "Allow all access audit_logs" ON public.audit_logs;
CREATE POLICY "Allow all access audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access meetings" ON public.meetings;
CREATE POLICY "Allow all access meetings" ON public.meetings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access payroll_batches" ON public.payroll_batches;
CREATE POLICY "Allow all access payroll_batches" ON public.payroll_batches FOR ALL USING (true) WITH CHECK (true);
