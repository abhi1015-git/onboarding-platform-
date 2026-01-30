-- =================================================================
-- 🚀 ULTIMATE PAYROLL & TRACKING FIX
-- Run this in your Supabase SQL Editor to enable all features.
-- =================================================================

-- 1. Ensure candidates table has payroll columns
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS payroll_status TEXT DEFAULT 'Pending';
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ;

-- 2. Create Payroll Batches Table
CREATE TABLE IF NOT EXISTS public.payroll_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_name TEXT NOT NULL,
    total_amount NUMERIC(15, 2),
    employee_count INTEGER,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processed', 'Failed')),
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.payroll_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. Create "Allow All" Policies (For Demo/Development)
DROP POLICY IF EXISTS "Allow all access payroll_batches" ON public.payroll_batches;
CREATE POLICY "Allow all access payroll_batches" ON public.payroll_batches FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access audit_logs" ON public.audit_logs;
CREATE POLICY "Allow all access audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- 6. Initialize existing candidates to 'Pending'
UPDATE public.candidates SET payroll_status = 'Pending' WHERE payroll_status IS NULL;

-- 7. Ensure profiles has all needed columns (Settings fix)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#3b82f6';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS compact_view BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT TRUE;

SELECT '✅ ULTIMATE PAYROLL FIX APPLIED SUCCESSFULY' as status;
