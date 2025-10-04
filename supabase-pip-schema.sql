-- Performance Improvement Plan (PIP) System Schema

-- PIP Main Table
CREATE TABLE IF NOT EXISTS performance_improvement_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  manager_id UUID NOT NULL,
  manager_name TEXT NOT NULL,

  -- Plan Status
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'terminated', 'extended')),

  -- Timeline
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  day_30_review_date TIMESTAMP WITH TIME ZONE NOT NULL,
  day_60_review_date TIMESTAMP WITH TIME ZONE NOT NULL,
  day_90_review_date TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Plan Details
  reason_for_pip TEXT NOT NULL, -- Why the employee is on PIP
  consequences TEXT NOT NULL, -- What happens if standards aren't met
  support_provided TEXT, -- Resources and support being offered

  -- Outcomes
  outcome TEXT, -- Final outcome if completed/terminated
  outcome_date TIMESTAMP WITH TIME ZONE,
  outcome_notes TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PIP Expectations (30/60/90 day milestones)
CREATE TABLE IF NOT EXISTS pip_expectations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pip_id UUID NOT NULL REFERENCES performance_improvement_plans(id) ON DELETE CASCADE,

  -- Milestone Phase
  phase TEXT NOT NULL CHECK (phase IN ('30_day', '60_day', '90_day')),

  -- Expectation Details
  category TEXT NOT NULL, -- Performance, Behavior, Skills, Attendance, etc.
  expectation TEXT NOT NULL, -- Clear, measurable expectation
  success_criteria TEXT NOT NULL, -- How success will be measured

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'met', 'not_met', 'partially_met')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),

  -- Review
  reviewed_date TIMESTAMP WITH TIME ZONE,
  reviewed_by TEXT,
  review_notes TEXT,

  -- Order
  order_index INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PIP Check-ins (Daily/Weekly meetings)
CREATE TABLE IF NOT EXISTS pip_check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pip_id UUID NOT NULL REFERENCES performance_improvement_plans(id) ON DELETE CASCADE,

  -- Check-in Details
  check_in_date TIMESTAMP WITH TIME ZONE NOT NULL,
  check_in_type TEXT NOT NULL CHECK (check_in_type IN ('daily', 'weekly', 'milestone', 'ad_hoc')),

  -- Meeting Info
  duration_minutes INTEGER,
  attendees TEXT[], -- Array of attendee names

  -- Content
  progress_summary TEXT NOT NULL,
  challenges TEXT,
  manager_feedback TEXT,
  employee_feedback TEXT,
  action_items TEXT,

  -- Status
  overall_status TEXT CHECK (overall_status IN ('on_track', 'at_risk', 'off_track', 'needs_attention')),

  -- Documentation
  conducted_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PIP Resources (Training, materials, support)
CREATE TABLE IF NOT EXISTS pip_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pip_id UUID NOT NULL REFERENCES performance_improvement_plans(id) ON DELETE CASCADE,

  -- Resource Details
  resource_type TEXT NOT NULL CHECK (resource_type IN ('training', 'documentation', 'mentoring', 'tool', 'course', 'book', 'video', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,

  -- Assignment
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,

  -- Status
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'skipped')),
  completed_date TIMESTAMP WITH TIME ZONE,

  -- Feedback
  employee_notes TEXT,
  helpful_rating INTEGER CHECK (helpful_rating >= 1 AND helpful_rating <= 5),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PIP Reminders (Automated notifications)
CREATE TABLE IF NOT EXISTS pip_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pip_id UUID NOT NULL REFERENCES performance_improvement_plans(id) ON DELETE CASCADE,

  -- Reminder Details
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('check_in', 'milestone_review', 'resource_due', 'plan_ending', 'custom')),
  reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Recipients
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('manager', 'employee', 'both', 'hr')),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'dismissed')),
  sent_date TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PIP Milestone Reviews (30/60/90 day formal reviews)
CREATE TABLE IF NOT EXISTS pip_milestone_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pip_id UUID NOT NULL REFERENCES performance_improvement_plans(id) ON DELETE CASCADE,

  -- Review Details
  milestone TEXT NOT NULL CHECK (milestone IN ('30_day', '60_day', '90_day')),
  review_date TIMESTAMP WITH TIME ZONE NOT NULL,
  conducted_by TEXT NOT NULL,

  -- Performance Assessment
  overall_rating TEXT CHECK (overall_rating IN ('exceeds', 'meets', 'partially_meets', 'does_not_meet')),
  progress_summary TEXT NOT NULL,

  -- Strengths and Areas
  strengths TEXT[],
  areas_for_improvement TEXT[],

  -- Expectations Met
  expectations_met INTEGER DEFAULT 0,
  expectations_partially_met INTEGER DEFAULT 0,
  expectations_not_met INTEGER DEFAULT 0,

  -- Decision
  decision TEXT NOT NULL CHECK (decision IN ('continue', 'extend', 'complete_success', 'terminate', 'escalate')),
  decision_rationale TEXT NOT NULL,
  next_steps TEXT,

  -- Documentation
  employee_signature_date TIMESTAMP WITH TIME ZONE,
  manager_signature_date TIMESTAMP WITH TIME ZONE,
  employee_comments TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pip_employee ON performance_improvement_plans(employee_id);
CREATE INDEX IF NOT EXISTS idx_pip_organization ON performance_improvement_plans(organization_id);
CREATE INDEX IF NOT EXISTS idx_pip_status ON performance_improvement_plans(status);
CREATE INDEX IF NOT EXISTS idx_pip_dates ON performance_improvement_plans(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_pip_expectations_pip ON pip_expectations(pip_id);
CREATE INDEX IF NOT EXISTS idx_pip_expectations_phase ON pip_expectations(phase);
CREATE INDEX IF NOT EXISTS idx_pip_checkins_pip ON pip_check_ins(pip_id);
CREATE INDEX IF NOT EXISTS idx_pip_checkins_date ON pip_check_ins(check_in_date);
CREATE INDEX IF NOT EXISTS idx_pip_resources_pip ON pip_resources(pip_id);
CREATE INDEX IF NOT EXISTS idx_pip_reminders_pip ON pip_reminders(pip_id);
CREATE INDEX IF NOT EXISTS idx_pip_reminders_date ON pip_reminders(reminder_date, status);
CREATE INDEX IF NOT EXISTS idx_pip_reviews_pip ON pip_milestone_reviews(pip_id);
CREATE INDEX IF NOT EXISTS idx_pip_reviews_milestone ON pip_milestone_reviews(milestone);
