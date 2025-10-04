-- Manager Notes Database Schema
-- Run this in Supabase SQL Editor after running supabase-schema.sql

-- Manager Notes table
CREATE TABLE IF NOT EXISTS manager_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_private BOOLEAN DEFAULT true,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    CONSTRAINT note_length CHECK (char_length(note) <= 5000)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_manager_notes_employee_id ON manager_notes(employee_id);
CREATE INDEX IF NOT EXISTS idx_manager_notes_organization_id ON manager_notes(organization_id);
CREATE INDEX IF NOT EXISTS idx_manager_notes_created_at ON manager_notes(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE manager_notes IS 'Private notes that managers can add about employees for future reference and performance reviews';
COMMENT ON COLUMN manager_notes.note IS 'The note content (max 5000 characters)';
COMMENT ON COLUMN manager_notes.created_by IS 'Username or email of the manager who created the note';
COMMENT ON COLUMN manager_notes.is_private IS 'Whether the note is visible only to managers (always true for now)';
COMMENT ON COLUMN manager_notes.tags IS 'Optional tags for categorizing notes (e.g., performance, feedback, achievement)';
