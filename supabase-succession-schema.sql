-- Succession Planning Schema
-- Multi-tier succession planning with analytics

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Critical Roles table - defines positions requiring succession planning
CREATE TABLE IF NOT EXISTS critical_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,

  role_title TEXT NOT NULL,
  department TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('executive', 'vp', 'director', 'manager', 'individual_contributor')),

  current_incumbent_id UUID,
  current_incumbent_name TEXT,

  -- Risk assessment
  criticality_score INTEGER CHECK (criticality_score BETWEEN 1 AND 10),
  flight_risk_level TEXT CHECK (flight_risk_level IN ('low', 'medium', 'high', 'critical')),
  retirement_risk_date TIMESTAMP WITH TIME ZONE,

  -- Requirements
  key_responsibilities TEXT,
  required_competencies TEXT[],
  required_experience_years INTEGER,
  required_education TEXT,

  -- Succession readiness
  has_emergency_backup BOOLEAN DEFAULT FALSE,
  emergency_backup_id UUID,
  emergency_backup_name TEXT,

  succession_health_score INTEGER CHECK (succession_health_score BETWEEN 0 AND 100),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Succession Candidates table - potential successors for critical roles
CREATE TABLE IF NOT EXISTS succession_candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  critical_role_id UUID NOT NULL REFERENCES critical_roles(id) ON DELETE CASCADE,

  employee_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  current_title TEXT NOT NULL,

  -- Readiness tier
  readiness_tier TEXT NOT NULL CHECK (readiness_tier IN ('ready_now', 'ready_soon', 'future_pipeline', 'emergency_backup')),

  -- Readiness assessment
  readiness_percentage INTEGER CHECK (readiness_percentage BETWEEN 0 AND 100),
  estimated_ready_date TIMESTAMP WITH TIME ZONE,

  -- Gap analysis
  competency_gaps TEXT[],
  experience_gaps TEXT[],
  development_needs TEXT,

  -- Experience tracking
  completed_stretch_assignments INTEGER DEFAULT 0,
  completed_rotations TEXT[],
  proven_in_similar_role BOOLEAN DEFAULT FALSE,

  -- Notes
  strengths TEXT,
  concerns TEXT,
  recommendation TEXT,

  -- Metadata
  nominated_by TEXT,
  nominated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_reviewed_date TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Succession Development Plans - specific development activities for candidates
CREATE TABLE IF NOT EXISTS succession_development_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  succession_candidate_id UUID NOT NULL REFERENCES succession_candidates(id) ON DELETE CASCADE,

  activity_type TEXT NOT NULL CHECK (activity_type IN ('stretch_assignment', 'job_rotation', 'mentorship', 'training', 'executive_education', 'special_project', 'shadowing', 'acting_role')),

  activity_title TEXT NOT NULL,
  activity_description TEXT,

  -- Timeline
  start_date TIMESTAMP WITH TIME ZONE,
  target_completion_date TIMESTAMP WITH TIME ZONE,
  actual_completion_date TIMESTAMP WITH TIME ZONE,

  -- Progress
  status TEXT NOT NULL CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled', 'deferred')),
  progress_percentage INTEGER CHECK (progress_percentage BETWEEN 0 AND 100) DEFAULT 0,

  -- Impact
  competencies_developed TEXT[],
  outcome_notes TEXT,
  effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Succession Reviews - periodic assessment meetings
CREATE TABLE IF NOT EXISTS succession_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  critical_role_id UUID NOT NULL REFERENCES critical_roles(id) ON DELETE CASCADE,

  review_date TIMESTAMP WITH TIME ZONE NOT NULL,
  review_type TEXT NOT NULL CHECK (review_type IN ('quarterly', 'annual', 'emergency', 'ad_hoc')),

  attendees TEXT[],
  facilitator TEXT,

  -- Review outcomes
  succession_bench_strength INTEGER CHECK (succession_bench_strength BETWEEN 1 AND 5),
  candidates_added INTEGER DEFAULT 0,
  candidates_removed INTEGER DEFAULT 0,
  candidates_advanced INTEGER DEFAULT 0,

  -- Decisions and actions
  key_decisions TEXT,
  action_items TEXT[],
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),

  notes TEXT,
  next_review_date TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge Transfer Plans - documentation for critical role transitions
CREATE TABLE IF NOT EXISTS knowledge_transfer_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  critical_role_id UUID NOT NULL REFERENCES critical_roles(id) ON DELETE CASCADE,

  plan_name TEXT NOT NULL,

  -- Transfer details
  from_employee_id UUID,
  from_employee_name TEXT,
  to_employee_id UUID,
  to_employee_name TEXT,

  -- Timeline
  transfer_start_date TIMESTAMP WITH TIME ZONE,
  transfer_end_date TIMESTAMP WITH TIME ZONE,

  -- Content areas
  key_relationships TEXT[],
  critical_processes TEXT[],
  specialized_knowledge TEXT[],
  systems_and_tools TEXT[],

  -- Progress tracking
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
  completion_percentage INTEGER CHECK (completion_percentage BETWEEN 0 AND 100) DEFAULT 0,

  -- Documentation
  documentation_links TEXT[],
  transition_notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Succession Analytics Snapshot - cached metrics for dashboard performance
CREATE TABLE IF NOT EXISTS succession_analytics_snapshot (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,

  snapshot_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Overall metrics
  overall_health_score INTEGER CHECK (overall_health_score BETWEEN 0 AND 100),
  total_critical_roles INTEGER,
  roles_with_successors INTEGER,
  roles_at_risk INTEGER,

  -- Bench strength by level
  executive_bench_strength DECIMAL(3,1),
  vp_bench_strength DECIMAL(3,1),
  director_bench_strength DECIMAL(3,1),
  manager_bench_strength DECIMAL(3,1),

  -- Ready now pipeline
  ready_now_count INTEGER,
  ready_soon_count INTEGER,
  future_pipeline_count INTEGER,

  -- Risk indicators
  high_flight_risk_roles INTEGER,
  retirement_risk_12_months INTEGER,
  single_successor_roles INTEGER,

  -- Alerts
  immediate_attention_roles TEXT[],

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_critical_roles_org ON critical_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_critical_roles_level ON critical_roles(level);
CREATE INDEX IF NOT EXISTS idx_critical_roles_incumbent ON critical_roles(current_incumbent_id);

CREATE INDEX IF NOT EXISTS idx_succession_candidates_org ON succession_candidates(organization_id);
CREATE INDEX IF NOT EXISTS idx_succession_candidates_role ON succession_candidates(critical_role_id);
CREATE INDEX IF NOT EXISTS idx_succession_candidates_employee ON succession_candidates(employee_id);
CREATE INDEX IF NOT EXISTS idx_succession_candidates_tier ON succession_candidates(readiness_tier);

CREATE INDEX IF NOT EXISTS idx_development_plans_org ON succession_development_plans(organization_id);
CREATE INDEX IF NOT EXISTS idx_development_plans_candidate ON succession_development_plans(succession_candidate_id);
CREATE INDEX IF NOT EXISTS idx_development_plans_status ON succession_development_plans(status);

CREATE INDEX IF NOT EXISTS idx_succession_reviews_org ON succession_reviews(organization_id);
CREATE INDEX IF NOT EXISTS idx_succession_reviews_role ON succession_reviews(critical_role_id);
CREATE INDEX IF NOT EXISTS idx_succession_reviews_date ON succession_reviews(review_date);

CREATE INDEX IF NOT EXISTS idx_knowledge_transfer_org ON knowledge_transfer_plans(organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_transfer_role ON knowledge_transfer_plans(critical_role_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_transfer_status ON knowledge_transfer_plans(status);

CREATE INDEX IF NOT EXISTS idx_analytics_snapshot_org ON succession_analytics_snapshot(organization_id);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshot_date ON succession_analytics_snapshot(snapshot_date DESC);

-- Comments for documentation
COMMENT ON TABLE critical_roles IS 'Defines key organizational positions requiring succession planning';
COMMENT ON TABLE succession_candidates IS 'Potential successors for critical roles across different readiness tiers';
COMMENT ON TABLE succession_development_plans IS 'Development activities to prepare candidates for succession';
COMMENT ON TABLE succession_reviews IS 'Periodic succession planning review meetings and outcomes';
COMMENT ON TABLE knowledge_transfer_plans IS 'Structured knowledge transfer for role transitions';
COMMENT ON TABLE succession_analytics_snapshot IS 'Pre-calculated metrics for succession planning dashboard';
