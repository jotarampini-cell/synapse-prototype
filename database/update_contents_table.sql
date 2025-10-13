-- Add AI analysis status columns to contents table
ALTER TABLE public.contents 
ADD COLUMN IF NOT EXISTS ai_analysis_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS ai_analysis_updated_at TIMESTAMP WITH TIME ZONE;

-- Create index for AI analysis status
CREATE INDEX IF NOT EXISTS idx_contents_ai_analysis_status ON public.contents(ai_analysis_status);

-- Add comment to explain the status values
COMMENT ON COLUMN public.contents.ai_analysis_status IS 'Status of AI analysis: pending, analyzing, completed, error';
COMMENT ON COLUMN public.contents.ai_analysis_updated_at IS 'Timestamp when AI analysis was last updated';




