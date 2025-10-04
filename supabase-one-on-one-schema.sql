-- One-on-One Meeting Database Schema
-- Run this in Supabase SQL Editor after running supabase-schema.sql

-- One-on-One Meetings table
CREATE TABLE IF NOT EXISTS one_on_one_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    manager_id TEXT NOT NULL,
    manager_name TEXT NOT NULL,
    meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    duration_minutes INTEGER DEFAULT 30,
    location TEXT,
    meeting_type TEXT DEFAULT 'regular' CHECK (meeting_type IN ('regular', 'performance', 'development', 'check_in', 'other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agenda Items table (shared between manager and employee)
CREATE TABLE IF NOT EXISTS one_on_one_agenda_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES one_on_one_meetings(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    added_by TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT agenda_title_length CHECK (char_length(title) <= 200),
    CONSTRAINT agenda_description_length CHECK (char_length(description) <= 2000)
);

-- Shared Notes table (visible to both manager and employee)
CREATE TABLE IF NOT EXISTS one_on_one_shared_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES one_on_one_meetings(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT shared_note_length CHECK (char_length(note) <= 5000)
);

-- Private Manager Notes table (visible only to manager)
CREATE TABLE IF NOT EXISTS one_on_one_private_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES one_on_one_meetings(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_by TEXT NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT private_note_length CHECK (char_length(note) <= 5000)
);

-- Action Items table (follow-ups from meetings)
CREATE TABLE IF NOT EXISTS one_on_one_action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES one_on_one_meetings(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to TEXT NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT action_title_length CHECK (char_length(title) <= 200),
    CONSTRAINT action_description_length CHECK (char_length(description) <= 1000)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_one_on_one_meetings_employee_id ON one_on_one_meetings(employee_id);
CREATE INDEX IF NOT EXISTS idx_one_on_one_meetings_organization_id ON one_on_one_meetings(organization_id);
CREATE INDEX IF NOT EXISTS idx_one_on_one_meetings_date ON one_on_one_meetings(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_one_on_one_meetings_status ON one_on_one_meetings(status);
CREATE INDEX IF NOT EXISTS idx_one_on_one_agenda_items_meeting_id ON one_on_one_agenda_items(meeting_id);
CREATE INDEX IF NOT EXISTS idx_one_on_one_shared_notes_meeting_id ON one_on_one_shared_notes(meeting_id);
CREATE INDEX IF NOT EXISTS idx_one_on_one_private_notes_meeting_id ON one_on_one_private_notes(meeting_id);
CREATE INDEX IF NOT EXISTS idx_one_on_one_action_items_meeting_id ON one_on_one_action_items(meeting_id);
CREATE INDEX IF NOT EXISTS idx_one_on_one_action_items_status ON one_on_one_action_items(status);

-- Add comments for documentation
COMMENT ON TABLE one_on_one_meetings IS 'One-on-one meetings between managers and employees';
COMMENT ON TABLE one_on_one_agenda_items IS 'Agenda items for one-on-one meetings, visible to both parties';
COMMENT ON TABLE one_on_one_shared_notes IS 'Meeting notes that are shared between manager and employee';
COMMENT ON TABLE one_on_one_private_notes IS 'Private notes that only the manager can see';
COMMENT ON TABLE one_on_one_action_items IS 'Action items and follow-ups from one-on-one meetings';

COMMENT ON COLUMN one_on_one_meetings.status IS 'Meeting status: scheduled, in_progress, completed, cancelled';
COMMENT ON COLUMN one_on_one_meetings.meeting_type IS 'Type of meeting: regular, performance, development, check_in, other';
COMMENT ON COLUMN one_on_one_agenda_items.added_by IS 'Who added this agenda item (manager or employee email/name)';
COMMENT ON COLUMN one_on_one_shared_notes.created_by IS 'Who created this note (manager or employee)';
COMMENT ON COLUMN one_on_one_private_notes.note IS 'Private manager observations, not visible to employee';
COMMENT ON COLUMN one_on_one_action_items.assigned_to IS 'Who is responsible for completing this action (manager or employee)';
