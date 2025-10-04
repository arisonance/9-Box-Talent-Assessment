-- Onboarding Excellence Module Schema
-- 90-day systematic onboarding with multi-stakeholder accountability

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Onboarding Templates - Customizable by role, department, location
CREATE TABLE IF NOT EXISTS onboarding_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,

  template_name TEXT NOT NULL,
  description TEXT,

  -- Customization criteria
  role_level TEXT CHECK (role_level IN ('executive', 'manager', 'individual_contributor', 'intern')),
  department TEXT,
  location_type TEXT CHECK (location_type IN ('remote', 'hybrid', 'in_office')),

  -- Template settings
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Onboarding Plans - Individual 90-day plans for each new hire
CREATE TABLE IF NOT EXISTS onboarding_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  template_id UUID REFERENCES onboarding_templates(id) ON DELETE SET NULL,

  -- New hire details
  employee_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  employee_email TEXT,
  title TEXT NOT NULL,
  department TEXT NOT NULL,

  -- Key people
  manager_id UUID,
  manager_name TEXT NOT NULL,
  buddy_id UUID,
  buddy_name TEXT,
  hr_contact TEXT,

  -- Timeline
  offer_accepted_date TIMESTAMP WITH TIME ZONE,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  day_30_date TIMESTAMP WITH TIME ZONE NOT NULL,
  day_60_date TIMESTAMP WITH TIME ZONE NOT NULL,
  day_90_date TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Status
  status TEXT NOT NULL CHECK (status IN ('pre_boarding', 'active', 'completed', 'extended', 'terminated')),
  current_day INTEGER DEFAULT 0,
  completion_percentage INTEGER CHECK (completion_percentage BETWEEN 0 AND 100) DEFAULT 0,

  -- Outcomes
  outcome TEXT CHECK (outcome IN ('successful', 'needs_extension', 'not_successful')),
  outcome_notes TEXT,
  outcome_date TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Onboarding Tasks - Individual tasks within plans
CREATE TABLE IF NOT EXISTS onboarding_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  onboarding_plan_id UUID NOT NULL REFERENCES onboarding_plans(id) ON DELETE CASCADE,
  template_id UUID REFERENCES onboarding_templates(id) ON DELETE SET NULL,

  -- Task details
  phase TEXT NOT NULL CHECK (phase IN ('pre_boarding', 'day_1', 'week_1', 'day_30', 'day_60', 'day_90')),
  task_title TEXT NOT NULL,
  task_description TEXT,
  task_category TEXT CHECK (task_category IN ('paperwork', 'equipment', 'training', 'meetings', 'deliverable', 'review', 'cultural', 'systems', 'other')),

  -- Assignment
  assigned_to TEXT NOT NULL CHECK (assigned_to IN ('new_hire', 'manager', 'buddy', 'hr', 'it', 'other')),
  assigned_person_name TEXT,

  -- Timeline
  due_date TIMESTAMP WITH TIME ZONE,
  target_day INTEGER, -- Day relative to start date (e.g., 1, 7, 30, 60, 90)

  -- Status
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'blocked', 'skipped')) DEFAULT 'not_started',
  completed_date TIMESTAMP WITH TIME ZONE,
  completed_by TEXT,

  -- Priority and dependencies
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  is_critical BOOLEAN DEFAULT FALSE,
  depends_on_task_id UUID REFERENCES onboarding_tasks(id) ON DELETE SET NULL,

  -- Notes
  notes TEXT,
  blocker_reason TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Onboarding Milestones - Key checkpoints (30/60/90 day reviews)
CREATE TABLE IF NOT EXISTS onboarding_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  onboarding_plan_id UUID NOT NULL REFERENCES onboarding_plans(id) ON DELETE CASCADE,

  -- Milestone details
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('day_1', 'week_1', 'day_30', 'day_60', 'day_90', 'custom')),
  milestone_name TEXT NOT NULL,
  target_date TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Review
  review_date TIMESTAMP WITH TIME ZONE,
  conducted_by TEXT,
  attendees TEXT[],

  -- Assessment
  status TEXT NOT NULL CHECK (status IN ('upcoming', 'in_progress', 'completed', 'overdue')) DEFAULT 'upcoming',
  overall_rating TEXT CHECK (overall_rating IN ('exceeds_expectations', 'meets_expectations', 'needs_improvement', 'concerning')),

  -- Content
  progress_summary TEXT,
  strengths TEXT[],
  areas_for_development TEXT[],
  goals_for_next_phase TEXT[],

  -- Feedback
  manager_feedback TEXT,
  new_hire_feedback TEXT,
  new_hire_questions TEXT,

  -- Decision
  recommendation TEXT CHECK (recommendation IN ('on_track', 'needs_support', 'extend_onboarding', 'escalate_concerns')),
  action_items TEXT[],

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Onboarding Stakeholder Meetings - Key relationship building
CREATE TABLE IF NOT EXISTS onboarding_stakeholder_meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  onboarding_plan_id UUID NOT NULL REFERENCES onboarding_plans(id) ON DELETE CASCADE,

  -- Stakeholder details
  stakeholder_name TEXT NOT NULL,
  stakeholder_title TEXT,
  stakeholder_department TEXT,
  relationship_importance TEXT CHECK (relationship_importance IN ('critical', 'important', 'helpful', 'optional')) DEFAULT 'important',

  -- Meeting details
  purpose TEXT,
  suggested_topics TEXT[],

  -- Status
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled', 'pending')) DEFAULT 'pending',
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,

  -- Follow-up
  meeting_notes TEXT,
  key_takeaways TEXT[],
  follow_up_needed BOOLEAN DEFAULT FALSE,
  follow_up_notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Onboarding Training Modules - Required learning
CREATE TABLE IF NOT EXISTS onboarding_training_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  onboarding_plan_id UUID NOT NULL REFERENCES onboarding_plans(id) ON DELETE CASCADE,

  -- Module details
  module_name TEXT NOT NULL,
  module_type TEXT CHECK (module_type IN ('systems', 'compliance', 'product', 'process', 'culture', 'technical', 'soft_skills')),
  description TEXT,

  -- Delivery
  delivery_method TEXT CHECK (delivery_method IN ('online', 'in_person', 'shadowing', 'self_paced', 'mentored')),
  duration_hours DECIMAL(4,1),

  -- Resources
  resource_links TEXT[],
  trainer_name TEXT,

  -- Timeline
  target_completion_day INTEGER,
  due_date TIMESTAMP WITH TIME ZONE,

  -- Status
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')) DEFAULT 'not_started',
  started_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  progress_percentage INTEGER CHECK (progress_percentage BETWEEN 0 AND 100) DEFAULT 0,

  -- Assessment
  assessment_required BOOLEAN DEFAULT FALSE,
  assessment_score INTEGER,
  assessment_passed BOOLEAN,

  -- Feedback
  new_hire_rating INTEGER CHECK (new_hire_rating BETWEEN 1 AND 5),
  new_hire_feedback TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Onboarding Feedback - Continuous feedback throughout onboarding
CREATE TABLE IF NOT EXISTS onboarding_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  onboarding_plan_id UUID NOT NULL REFERENCES onboarding_plans(id) ON DELETE CASCADE,

  -- Feedback details
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('manager_to_new_hire', 'new_hire_to_manager', 'buddy_to_manager', 'new_hire_to_program', 'team_to_new_hire')),
  feedback_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Source and recipient
  from_person TEXT NOT NULL,
  to_person TEXT,

  -- Content
  feedback_text TEXT NOT NULL,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'concern', 'critical')),
  tags TEXT[],

  -- Action
  requires_action BOOLEAN DEFAULT FALSE,
  action_taken TEXT,
  action_date TIMESTAMP WITH TIME ZONE,

  -- Visibility
  is_private BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Onboarding Analytics Snapshot - Dashboard metrics
CREATE TABLE IF NOT EXISTS onboarding_analytics_snapshot (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,

  snapshot_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Overall metrics
  total_active_onboarding INTEGER,
  total_completed_this_quarter INTEGER,
  average_completion_percentage DECIMAL(5,2),
  average_time_to_productivity INTEGER, -- days

  -- Success metrics
  successful_completions INTEGER,
  extended_onboarding INTEGER,
  early_terminations INTEGER,
  success_rate DECIMAL(5,2),

  -- Task metrics
  total_tasks_due INTEGER,
  total_tasks_overdue INTEGER,
  total_tasks_completed_on_time INTEGER,
  on_time_completion_rate DECIMAL(5,2),

  -- Milestone metrics
  milestones_completed_on_time INTEGER,
  milestones_overdue INTEGER,

  -- Manager accountability
  manager_tasks_overdue INTEGER,
  managers_with_overdue_tasks TEXT[],

  -- New hire satisfaction
  average_new_hire_satisfaction DECIMAL(3,2), -- 1-5 scale

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_templates_org ON onboarding_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_templates_active ON onboarding_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_onboarding_plans_org ON onboarding_plans(organization_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_plans_employee ON onboarding_plans(employee_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_plans_manager ON onboarding_plans(manager_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_plans_status ON onboarding_plans(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_plans_start_date ON onboarding_plans(start_date);

CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_plan ON onboarding_tasks(onboarding_plan_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_status ON onboarding_tasks(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_phase ON onboarding_tasks(phase);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_assigned ON onboarding_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_due_date ON onboarding_tasks(due_date);

CREATE INDEX IF NOT EXISTS idx_onboarding_milestones_plan ON onboarding_milestones(onboarding_plan_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_milestones_type ON onboarding_milestones(milestone_type);
CREATE INDEX IF NOT EXISTS idx_onboarding_milestones_status ON onboarding_milestones(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_milestones_date ON onboarding_milestones(target_date);

CREATE INDEX IF NOT EXISTS idx_stakeholder_meetings_plan ON onboarding_stakeholder_meetings(onboarding_plan_id);
CREATE INDEX IF NOT EXISTS idx_stakeholder_meetings_status ON onboarding_stakeholder_meetings(status);

CREATE INDEX IF NOT EXISTS idx_training_modules_plan ON onboarding_training_modules(onboarding_plan_id);
CREATE INDEX IF NOT EXISTS idx_training_modules_status ON onboarding_training_modules(status);

CREATE INDEX IF NOT EXISTS idx_onboarding_feedback_plan ON onboarding_feedback(onboarding_plan_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_feedback_type ON onboarding_feedback(feedback_type);

CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_org ON onboarding_analytics_snapshot(organization_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_date ON onboarding_analytics_snapshot(snapshot_date DESC);

-- Comments for documentation
COMMENT ON TABLE onboarding_templates IS 'Customizable onboarding plan templates by role, department, and location';
COMMENT ON TABLE onboarding_plans IS 'Individual 90-day onboarding plans for new hires';
COMMENT ON TABLE onboarding_tasks IS 'Specific tasks within onboarding plans with accountability';
COMMENT ON TABLE onboarding_milestones IS 'Key checkpoints and reviews at 30/60/90 days';
COMMENT ON TABLE onboarding_stakeholder_meetings IS 'Important relationship-building meetings for new hires';
COMMENT ON TABLE onboarding_training_modules IS 'Required training and learning modules';
COMMENT ON TABLE onboarding_feedback IS 'Continuous feedback throughout the onboarding journey';
COMMENT ON TABLE onboarding_analytics_snapshot IS 'Pre-calculated metrics for onboarding dashboards';
