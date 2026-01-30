-- Debug script to check assets table and data
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check if assets table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'assets'
) as assets_table_exists;

-- 2. Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'assets'
ORDER BY ordinal_position;

-- 3. Count total assets
SELECT COUNT(*) as total_assets FROM public.assets;

-- 4. View all assets with candidate info (same query as the app)
SELECT 
    a.*,
    c.full_name
FROM public.assets a
LEFT JOIN public.candidates c ON a.assigned_to = c.id
ORDER BY a.created_at DESC;

-- 5. Check RLS policies on assets table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'assets';

-- 6. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'assets';
