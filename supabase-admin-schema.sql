-- Admin Dashboard Enhancement Schema
-- Run this in Supabase SQL Editor AFTER supabase-schema.sql

-- Admin Activity Log - Track all changes for audit purposes
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID,
    user_name TEXT,

    -- Action details
    action_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'export', 'import', 'bulk_update'
    entity_type TEXT NOT NULL, -- 'employee', 'department', 'assessment', 'plan', 'box_definition', 'template'
    entity_id UUID,
    entity_name TEXT, -- For display purposes

    -- Change tracking
    changes_made JSONB, -- Store before/after snapshots
    affected_count INTEGER DEFAULT 1, -- For bulk operations

    -- Context
    ip_address TEXT,
    user_agent TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization Settings - Flexible configuration storage
CREATE TABLE IF NOT EXISTS organization_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,

    -- General settings
    settings JSONB DEFAULT '{}'::jsonb, -- Flexible JSON config

    -- Common settings to extract for easier querying
    assessment_required_days INTEGER DEFAULT 90, -- Warn if employee unassessed for X days
    pip_auto_reminders BOOLEAN DEFAULT true,
    succession_planning_enabled BOOLEAN DEFAULT true,

    -- Data retention
    assessment_retention_years INTEGER DEFAULT 7,
    archive_inactive_employees_after_days INTEGER DEFAULT 730, -- 2 years

    -- Features enabled
    features_enabled JSONB DEFAULT '{"360_feedback": true, "pip": true, "succession": true, "onboarding": true}'::jsonb,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report Templates - Save custom report configurations
CREATE TABLE IF NOT EXISTS report_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Template info
    template_name TEXT NOT NULL,
    description TEXT,
    created_by UUID,
    created_by_name TEXT,

    -- Report configuration
    report_type TEXT NOT NULL, -- 'employee_roster', 'talent_distribution', 'flight_risk', 'development_status', 'custom'
    report_config JSONB, -- Filters, columns, groupings

    -- Scheduling (for future auto-reports)
    schedule_enabled BOOLEAN DEFAULT false,
    schedule_config JSONB, -- Cron-like schedule, recipients
    last_generated_at TIMESTAMP WITH TIME ZONE,

    -- Access
    is_public BOOLEAN DEFAULT false, -- Available to all admins

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data Quality Issues - Track validation warnings
CREATE TABLE IF NOT EXISTS data_quality_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Issue details
    issue_type TEXT NOT NULL, -- 'missing_assessment', 'missing_email', 'missing_department', 'stale_plan', 'orphaned_record'
    severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'

    -- Affected entity
    entity_type TEXT NOT NULL, -- 'employee', 'assessment', 'plan'
    entity_id UUID NOT NULL,
    entity_name TEXT,

    -- Issue description
    description TEXT NOT NULL,
    suggested_action TEXT,

    -- Status
    status TEXT DEFAULT 'open', -- 'open', 'resolved', 'ignored'
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,

    -- Auto-detection
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Notifications - Admin alerts and reminders
CREATE TABLE IF NOT EXISTS system_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Notification details
    notification_type TEXT NOT NULL, -- 'pip_ending', 'assessment_overdue', 'data_quality', 'system_update'
    priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'

    -- Content
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT, -- Link to relevant page

    -- Recipients
    recipient_role TEXT, -- 'admin', 'manager', 'all'
    recipient_user_id UUID, -- Specific user if targeted

    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,

    -- Lifecycle
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable Row Level Security (matching main schema approach)
ALTER TABLE admin_activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_issues DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_notifications DISABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_activity_log_org_id ON admin_activity_log(organization_id);
CREATE INDEX idx_activity_log_user_id ON admin_activity_log(user_id);
CREATE INDEX idx_activity_log_entity ON admin_activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_created ON admin_activity_log(created_at DESC);

CREATE INDEX idx_report_templates_org_id ON report_templates(organization_id);
CREATE INDEX idx_report_templates_created_by ON report_templates(created_by);

CREATE INDEX idx_data_quality_org_id ON data_quality_issues(organization_id);
CREATE INDEX idx_data_quality_entity ON data_quality_issues(entity_type, entity_id);
CREATE INDEX idx_data_quality_status ON data_quality_issues(status);
CREATE INDEX idx_data_quality_severity ON data_quality_issues(severity);

CREATE INDEX idx_notifications_org_id ON system_notifications(organization_id);
CREATE INDEX idx_notifications_recipient ON system_notifications(recipient_user_id);
CREATE INDEX idx_notifications_unread ON system_notifications(is_read, created_at DESC);

-- Update triggers for timestamps
CREATE TRIGGER update_org_settings_updated_at BEFORE UPDATE ON organization_settings
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_report_templates_updated_at BEFORE UPDATE ON report_templates
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to log admin activities (can be called from app or triggers)
CREATE OR REPLACE FUNCTION log_admin_activity(
    p_organization_id UUID,
    p_user_id UUID,
    p_user_name TEXT,
    p_action_type TEXT,
    p_entity_type TEXT,
    p_entity_id UUID DEFAULT NULL,
    p_entity_name TEXT DEFAULT NULL,
    p_changes_made JSONB DEFAULT NULL,
    p_affected_count INTEGER DEFAULT 1
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO admin_activity_log (
        organization_id, user_id, user_name, action_type, entity_type,
        entity_id, entity_name, changes_made, affected_count
    ) VALUES (
        p_organization_id, p_user_id, p_user_name, p_action_type, p_entity_type,
        p_entity_id, p_entity_name, p_changes_made, p_affected_count
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to detect data quality issues
CREATE OR REPLACE FUNCTION detect_data_quality_issues(p_organization_id UUID)
RETURNS TABLE (
    issue_count BIGINT,
    issue_type TEXT,
    severity TEXT
) AS $$
BEGIN
    -- Clear old open issues for re-detection
    UPDATE data_quality_issues
    SET status = 'resolved', resolved_at = NOW()
    WHERE organization_id = p_organization_id
    AND status = 'open'
    AND issue_type IN ('missing_assessment', 'missing_email', 'missing_department');

    -- Detect employees without assessments
    INSERT INTO data_quality_issues (
        organization_id, issue_type, severity, entity_type, entity_id, entity_name,
        description, suggested_action
    )
    SELECT
        p_organization_id,
        'missing_assessment',
        'medium',
        'employee',
        e.id,
        e.name,
        'Employee has no performance assessment',
        'Add assessment via 9-Box Grid or employee detail page'
    FROM employees e
    LEFT JOIN assessments a ON a.employee_id = e.id
    WHERE e.organization_id = p_organization_id
    AND a.id IS NULL;

    -- Detect employees without email
    INSERT INTO data_quality_issues (
        organization_id, issue_type, severity, entity_type, entity_id, entity_name,
        description, suggested_action
    )
    SELECT
        p_organization_id,
        'missing_email',
        'low',
        'employee',
        e.id,
        e.name,
        'Employee has no email address',
        'Update employee profile with email'
    FROM employees e
    WHERE e.organization_id = p_organization_id
    AND (e.email IS NULL OR e.email = '');

    -- Detect employees without department
    INSERT INTO data_quality_issues (
        organization_id, issue_type, severity, entity_type, entity_id, entity_name,
        description, suggested_action
    )
    SELECT
        p_organization_id,
        'missing_department',
        'medium',
        'employee',
        e.id,
        e.name,
        'Employee has no department assigned',
        'Assign employee to a department'
    FROM employees e
    WHERE e.organization_id = p_organization_id
    AND e.department_id IS NULL;

    -- Return summary
    RETURN QUERY
    SELECT
        COUNT(*) as issue_count,
        dqi.issue_type,
        dqi.severity
    FROM data_quality_issues dqi
    WHERE dqi.organization_id = p_organization_id
    AND dqi.status = 'open'
    GROUP BY dqi.issue_type, dqi.severity;
END;
$$ LANGUAGE plpgsql;

-- Insert default organization settings for existing organization
INSERT INTO organization_settings (organization_id, settings)
SELECT id, '{
    "theme": "light",
    "default_view": "grid",
    "enable_email_notifications": true,
    "require_assessment_justification": false
}'::jsonb
FROM organizations
WHERE id = 'f8a8b8c8-d8e8-4f8f-8f8f-8f8f8f8f8f8f'
ON CONFLICT (organization_id) DO NOTHING;

-- Create sample report template
INSERT INTO report_templates (
    organization_id,
    template_name,
    description,
    report_type,
    report_config,
    created_by_name,
    is_public
)
SELECT
    'f8a8b8c8-d8e8-4f8f-8f8f-8f8f8f8f8f8f',
    'High Performers Report',
    'List of all employees with high performance and potential',
    'custom',
    '{
        "filters": {
            "performance": ["high"],
            "potential": ["high"]
        },
        "columns": ["name", "title", "department", "performance", "potential"],
        "sortBy": "name",
        "format": "table"
    }'::jsonb,
    'System',
    true
FROM organizations
WHERE id = 'f8a8b8c8-d8e8-4f8f-8f8f-8f8f8f8f8f8f'
LIMIT 1;
