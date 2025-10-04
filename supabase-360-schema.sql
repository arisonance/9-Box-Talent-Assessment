-- 360 Survey System Database Schema
-- Run this in Supabase SQL Editor after running supabase-schema.sql

-- Survey 360s table
CREATE TABLE IF NOT EXISTS survey_360s (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    created_by TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'completed', 'closed')),
    survey_title TEXT NOT NULL,
    custom_questions JSONB DEFAULT '[]'::jsonb,
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Survey 360 Participants table
CREATE TABLE IF NOT EXISTS survey_360_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID REFERENCES survey_360s(id) ON DELETE CASCADE,
    participant_name TEXT NOT NULL,
    participant_email TEXT NOT NULL,
    relationship TEXT NOT NULL CHECK (relationship IN ('manager', 'peer', 'direct_report', 'self', 'other')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
    unique_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Survey 360 Responses table
CREATE TABLE IF NOT EXISTS survey_360_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID REFERENCES survey_360s(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES survey_360_participants(id) ON DELETE CASCADE,
    responses JSONB NOT NULL DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(survey_id, participant_id)
);

-- Survey 360 Reports table
CREATE TABLE IF NOT EXISTS survey_360_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID REFERENCES survey_360s(id) ON DELETE CASCADE,
    ai_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    generated_by TEXT DEFAULT 'claude-sonnet-4-20250514',
    manager_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(survey_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_survey_360s_employee_id ON survey_360s(employee_id);
CREATE INDEX IF NOT EXISTS idx_survey_360s_organization_id ON survey_360s(organization_id);
CREATE INDEX IF NOT EXISTS idx_survey_360s_status ON survey_360s(status);
CREATE INDEX IF NOT EXISTS idx_survey_360_participants_survey_id ON survey_360_participants(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_360_participants_token ON survey_360_participants(unique_token);
CREATE INDEX IF NOT EXISTS idx_survey_360_participants_status ON survey_360_participants(status);
CREATE INDEX IF NOT EXISTS idx_survey_360_responses_survey_id ON survey_360_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_360_responses_participant_id ON survey_360_responses(participant_id);
CREATE INDEX IF NOT EXISTS idx_survey_360_reports_survey_id ON survey_360_reports(survey_id);

-- Add comments for documentation
COMMENT ON TABLE survey_360s IS '360-degree feedback surveys initiated by managers';
COMMENT ON TABLE survey_360_participants IS 'Participants selected to provide feedback in a 360 survey';
COMMENT ON TABLE survey_360_responses IS 'Individual responses submitted by participants';
COMMENT ON TABLE survey_360_reports IS 'AI-generated analysis reports for completed surveys';

COMMENT ON COLUMN survey_360_participants.unique_token IS 'Unique token for anonymous survey access without login';
COMMENT ON COLUMN survey_360_participants.relationship IS 'Relationship of participant to the employee being reviewed';
COMMENT ON COLUMN survey_360s.custom_questions IS 'Array of additional custom questions beyond default ones';
COMMENT ON COLUMN survey_360_reports.ai_analysis IS 'JSON object containing themes, strengths, development areas, and recommendations';
