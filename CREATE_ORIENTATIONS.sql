-- ============================================
-- 🚀 FIX: CREATE MISSING ORIENTATIONS TABLE
-- Run this to fix the HR Orientations page error
-- ============================================

CREATE TABLE IF NOT EXISTS public.orientations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    type TEXT DEFAULT 'Virtual', -- Virtual or In-Person
    location TEXT,               -- Zoom link or Room name
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Security Policies (RLS)
ALTER TABLE public.orientations ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read/write for now (to prevent permission errors during testing)
DROP POLICY IF EXISTS "Allow all access orientations" ON public.orientations;
CREATE POLICY "Allow all access orientations" ON public.orientations FOR ALL USING (true) WITH CHECK (true);

-- Insert some sample data so the page isn't empty
INSERT INTO public.orientations (title, date, time, type, location)
VALUES 
('Company Culture & Values', '2024-03-15', '10:00 AM', 'Virtual', 'Zoom'),
('IT & Security Workshop', '2024-03-16', '02:00 PM', 'Virtual', 'Teams'),
('Benefits & Payroll Overview', '2024-03-18', '11:30 AM', 'In-Person', 'Meeting Room A');

-- Success Verification
SELECT '✅ Orientations Table Created' as status, COUNT(*) as count FROM public.orientations;
