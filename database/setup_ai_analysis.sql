-- =====================================================
-- AI Analysis Database Setup
-- =====================================================
-- This script sets up the database tables and columns
-- needed for AI analysis functionality

-- 1. Add AI analysis status columns to contents table
ALTER TABLE public.contents 
ADD COLUMN IF NOT EXISTS ai_analysis_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS ai_analysis_updated_at TIMESTAMP WITH TIME ZONE;

-- Create index for AI analysis status
CREATE INDEX IF NOT EXISTS idx_contents_ai_analysis_status ON public.contents(ai_analysis_status);

-- Add comments to explain the status values
COMMENT ON COLUMN public.contents.ai_analysis_status IS 'Status of AI analysis: pending, analyzing, completed, error';
COMMENT ON COLUMN public.contents.ai_analysis_updated_at IS 'Timestamp when AI analysis was last updated';

-- 2. Create ai_analyses table for storing AI analysis results
CREATE TABLE IF NOT EXISTS public.ai_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    summary TEXT,
    extracted_tasks JSONB,
    key_concepts JSONB,
    connections JSONB,
    analysis_type VARCHAR(50) DEFAULT 'manual',
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one analysis per content per user
    UNIQUE(content_id, user_id)
);

-- Add RLS (Row Level Security)
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own AI analyses" ON public.ai_analyses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI analyses" ON public.ai_analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI analyses" ON public.ai_analyses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI analyses" ON public.ai_analyses
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_analyses_content_id ON public.ai_analyses(content_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_user_id ON public.ai_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_created_at ON public.ai_analyses(created_at);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_analyses_updated_at 
    BEFORE UPDATE ON public.ai_analyses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 3. Grant necessary permissions
GRANT ALL ON public.ai_analyses TO authenticated;
GRANT ALL ON public.contents TO authenticated;







