-- migration: CANDIDATE_TASKS_SETUP
-- This table will store daily tasks assigned by HR to candidates.

CREATE TABLE IF NOT EXISTS public.candidate_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE DEFAULT CURRENT_DATE,
    priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
    status TEXT DEFAULT 'pending', -- pending, in_progress, completed, overdue
    assigned_by TEXT, -- HR Email/Name
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_candidate_tasks_candidate_id ON public.candidate_tasks(candidate_id);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
