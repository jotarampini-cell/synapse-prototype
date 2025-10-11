-- Verification script to check if AI analysis setup is correct

-- 1. Check if ai_analyses table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'ai_analyses';

-- 2. Check if contents table has the new columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'contents' 
AND column_name IN ('ai_analysis_status', 'ai_analysis_updated_at');

-- 3. Check RLS policies on ai_analyses
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'ai_analyses';

-- 4. Check indexes
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('ai_analyses', 'contents')
AND indexname LIKE '%ai_analysis%';


