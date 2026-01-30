-- Add payroll tracking to candidates
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS payroll_status TEXT DEFAULT 'Pending';
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ;

-- Update existing candidates to 'Pending' if the column was just added
UPDATE public.candidates SET payroll_status = 'Pending' WHERE payroll_status IS NULL;
