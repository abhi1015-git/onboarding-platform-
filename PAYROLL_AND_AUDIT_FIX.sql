-- Create tables for Payroll and Audit logging

-- 1. Audit Logs
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

-- 2. Payroll Batches
CREATE TABLE IF NOT EXISTS public.payroll_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_name TEXT NOT NULL,
    total_amount NUMERIC(15, 2),
    employee_count INTEGER,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processed', 'Failed')),
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_batches ENABLE ROW LEVEL SECURITY;

-- Simple "Allow All" policies for demo/easy setup
DROP POLICY IF EXISTS "Allow all audit_logs" ON public.audit_logs;
CREATE POLICY "Allow all audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all payroll_batches" ON public.payroll_batches;
CREATE POLICY "Allow all payroll_batches" ON public.payroll_batches FOR ALL USING (true) WITH CHECK (true);
