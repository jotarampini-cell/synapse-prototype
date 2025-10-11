-- Migration: Add content_blocks table for managing sources and related content
-- Created: 2024-01-XX
-- Description: Creates a table to store content blocks (sources, related notes, files, references) 
--              associated with notes, enabling a more structured approach to content management

-- Create content_blocks table
CREATE TABLE IF NOT EXISTS content_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('source', 'related_note', 'file', 'reference')),
    title VARCHAR(255) NOT NULL,
    url TEXT,
    note_id UUID REFERENCES contents(id) ON DELETE SET NULL,
    file_url TEXT,
    excerpt TEXT,
    metadata JSONB DEFAULT '{}',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_blocks_content_id ON content_blocks(content_id);
CREATE INDEX IF NOT EXISTS idx_content_blocks_type ON content_blocks(type);
CREATE INDEX IF NOT EXISTS idx_content_blocks_note_id ON content_blocks(note_id);
CREATE INDEX IF NOT EXISTS idx_content_blocks_order ON content_blocks(content_id, order_index);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_content_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_content_blocks_updated_at
    BEFORE UPDATE ON content_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_content_blocks_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE content_blocks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see content blocks for their own content
CREATE POLICY "Users can view their own content blocks" ON content_blocks
    FOR SELECT USING (
        content_id IN (
            SELECT id FROM contents WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can insert content blocks for their own content
CREATE POLICY "Users can insert their own content blocks" ON content_blocks
    FOR INSERT WITH CHECK (
        content_id IN (
            SELECT id FROM contents WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can update their own content blocks
CREATE POLICY "Users can update their own content blocks" ON content_blocks
    FOR UPDATE USING (
        content_id IN (
            SELECT id FROM contents WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can delete their own content blocks
CREATE POLICY "Users can delete their own content blocks" ON content_blocks
    FOR DELETE USING (
        content_id IN (
            SELECT id FROM contents WHERE user_id = auth.uid()
        )
    );

-- Add comments for documentation
COMMENT ON TABLE content_blocks IS 'Stores content blocks (sources, related notes, files, references) associated with notes';
COMMENT ON COLUMN content_blocks.type IS 'Type of content block: source, related_note, file, reference';
COMMENT ON COLUMN content_blocks.title IS 'Display title for the content block';
COMMENT ON COLUMN content_blocks.url IS 'URL for source blocks';
COMMENT ON COLUMN content_blocks.note_id IS 'Reference to related note for related_note blocks';
COMMENT ON COLUMN content_blocks.file_url IS 'File URL for file blocks';
COMMENT ON COLUMN content_blocks.excerpt IS 'Text excerpt or description';
COMMENT ON COLUMN content_blocks.metadata IS 'Additional metadata as JSON';
COMMENT ON COLUMN content_blocks.order_index IS 'Order of blocks within the content';
