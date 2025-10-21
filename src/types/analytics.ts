// Advanced Talent Analytics Types

export type ChurnRiskLevel = 'critical' | 'high' | 'medium' | 'low';
export type PerformanceTrend = 'improving' | 'stable' | 'declining' | 'volatile';
export type TeamHealthStatus = 'excellent' | 'good' | 'at_risk' | 'critical';
export type PipelineStrength = 'strong' | 'adequate' | 'weak' | 'critical';
export type DependencyRiskLevel = 'critical' | 'high' | 'medium' | 'low';

// Churn Risk Prediction
export interface ChurnRiskPrediction {
  employee_id: string;
  employee_name: string;
  title: string;
  department: string;

  // Risk scoring
  churn_risk_score: number; // 0-100
  churn_risk_level: ChurnRiskLevel;
  churn_probability_6m: number; // 0-1 probability
  churn_probability_12m: number; // 0-1 probability

  // Contributing factors (weighted)
  risk_factors: Array<{
    factor: string;
    impact_score: number; // 0-100
    evidence: string;
  }>;

  // Protective factors
  retention_factors: Array<{
    factor: string;
    strength_score: number; // 0-100
    evidence: string;
  }>;

  // Recommendations
  recommended_actions: Array<{
    action: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    impact_potential: number; // 0-100
    timeline: string;
  }>;

  // Business impact
  replacement_cost_estimate?: number;
  impact_if_lost: 'critical' | 'high' | 'medium' | 'low';

  last_updated: string;
}

// Performance Trajectory
export interface PerformanceTrajectory {
  employee_id: string;
  employee_name: string;
  title: string;
  department: string;

  // Current state
  current_performance: 'high' | 'medium' | 'low';
  current_potential: 'high' | 'medium' | 'low';
  current_box_key: string;

  // Trend analysis
  trend: PerformanceTrend;
  trend_confidence: number; // 0-1
  velocity: number; // Rate of change (-100 to +100)

  // Historical data points
  trajectory_points: Array<{
    date: string;
    performance_score: number; // 0-100
    box_key: string;
    event?: string; // e.g., "Promotion", "New role", "PIP started"
  }>;

  // Predictions
  predicted_6m_box: string;
  predicted_12m_box: string;
  predicted_6m_performance: number; // 0-100
  predicted_12m_performance: number; // 0-100

  // Insights
  performance_drivers: string[];
  performance_barriers: string[];
  inflection_points: Array<{
    date: string;
    event: string;
    impact: string;
  }>;

  last_updated: string;
}

// Team Health Scoring
export interface TeamHealthScore {
  team_id: string; // department_id or manager_id
  team_name: string;
  team_type: 'department' | 'manager' | 'custom';

  // Overall health
  overall_health_score: number; // 0-100
  health_status: TeamHealthStatus;
  health_trend: 'improving' | 'stable' | 'declining';

  // Dimension scores
  dimensions: {
    talent_quality: {
      score: number; // 0-100
      high_performers_pct: number;
      top_talent_pct: number;
      underperformers_pct: number;
    };
    engagement: {
      score: number; // 0-100
      retention_rate_12m: number;
      promotion_rate_12m: number;
      survey_360_participation: number;
      one_on_one_frequency: number;
    };
    development: {
      score: number; // 0-100
      employees_with_plans_pct: number;
      plan_completion_rate: number;
      avg_development_hours: number;
      internal_mobility_rate: number;
    };
    succession_readiness: {
      score: number; // 0-100
      critical_roles_covered_pct: number;
      bench_strength: number;
      ready_now_successors: number;
    };
    team_balance: {
      score: number; // 0-100
      performance_distribution_balance: number;
      tenure_diversity_score: number;
      skills_coverage_score: number;
    };
  };

  // Risk indicators
  risks: Array<{
    risk_type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    affected_employees: number;
    recommended_action: string;
  }>;

  // Opportunities
  opportunities: Array<{
    opportunity_type: string;
    potential_impact: number; // 0-100
    description: string;
    action_required: string;
  }>;

  // Team composition
  team_size: number;
  avg_tenure_months: number;
  manager_name?: string;

  last_updated: string;
}

// Talent Pipeline Strength
export interface TalentPipelineAnalysis {
  pipeline_id: string;
  pipeline_name: string;
  pipeline_type: 'role_level' | 'skill' | 'department' | 'succession';

  // Overall strength
  pipeline_strength: PipelineStrength;
  pipeline_score: number; // 0-100

  // Current state
  total_positions: number;
  filled_positions: number;
  fill_rate: number; // 0-1

  // Pipeline depth by readiness
  ready_now: number;
  ready_1_year: number;
  ready_2_years: number;
  future_potential: number;

  // Quality metrics
  avg_readiness_score: number; // 0-100
  high_potential_count: number;
  proven_performers_count: number;

  // By level (if applicable)
  by_level?: {
    executive: { current: number; pipeline: number; strength: number };
    vp: { current: number; pipeline: number; strength: number };
    director: { current: number; pipeline: number; strength: number };
    manager: { current: number; pipeline: number; strength: number };
    ic: { current: number; pipeline: number; strength: number };
  };

  // By skill (if applicable)
  by_skill?: Array<{
    skill: string;
    required_count: number;
    current_count: number;
    developing_count: number;
    gap: number;
  }>;

  // Gaps and risks
  critical_gaps: Array<{
    gap_type: string;
    severity: 'critical' | 'high' | 'medium';
    description: string;
    positions_affected: number;
    time_to_fill_estimate: string;
    recommended_action: string;
  }>;

  // Development velocity
  avg_time_to_ready: number; // months
  promotion_rate_12m: number;
  internal_fill_rate: number;

  // Trends
  trend_6m: 'strengthening' | 'stable' | 'weakening';
  trend_12m: 'strengthening' | 'stable' | 'weakening';

  last_updated: string;
}

// Key Person Dependency Risk
export interface KeyPersonDependencyRisk {
  employee_id: string;
  employee_name: string;
  title: string;
  department: string;

  // Dependency scoring
  dependency_risk_score: number; // 0-100
  dependency_risk_level: DependencyRiskLevel;

  // Criticality factors
  criticality_factors: {
    unique_skills: {
      score: number; // 0-100
      skills: string[];
      others_with_skill: number;
    };
    unique_relationships: {
      score: number; // 0-100
      key_relationships: string[];
      relationship_redundancy: number;
    };
    knowledge_concentration: {
      score: number; // 0-100
      critical_knowledge_areas: string[];
      documentation_coverage: number; // 0-100
    };
    direct_reports: {
      score: number; // 0-100
      report_count: number;
      high_performers_reporting: number;
    };
    project_dependencies: {
      score: number; // 0-100
      critical_projects: string[];
      backup_coverage: number; // 0-100
    };
  };

  // Succession readiness
  has_designated_successor: boolean;
  successor_readiness: number; // 0-100
  successors_in_pipeline: number;
  time_to_backfill_estimate: string; // e.g., "3-6 months"

  // Knowledge transfer status
  knowledge_transfer_plan_exists: boolean;
  documentation_completeness: number; // 0-100
  cross_training_coverage: number; // 0-100

  // Business impact
  revenue_dependency?: number; // Revenue at risk
  projects_at_risk: string[];
  teams_affected: number;
  client_relationships_at_risk: number;

  // Mitigation actions
  mitigation_priority: 'urgent' | 'high' | 'medium' | 'low';
  recommended_actions: Array<{
    action: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    timeline: string;
    status: 'not_started' | 'in_progress' | 'completed';
  }>;

  // Flight risk (cross-reference with churn prediction)
  flight_risk_level?: ChurnRiskLevel;
  combined_risk_score?: number; // Dependency + Churn combined

  last_updated: string;
}

// Executive Analytics Dashboard Summary
export interface ExecutiveAnalyticsSummary {
  organization_id: string;
  generated_at: string;

  // Overall health
  overall_talent_health_score: number; // 0-100
  talent_health_trend: 'improving' | 'stable' | 'declining';

  // Key metrics
  total_employees: number;
  total_assessed: number;
  assessment_coverage: number; // 0-1

  // Performance distribution
  performance_distribution: {
    high_performance_high_potential: number; // 3-3
    high_performance: number; // all 3-x
    high_potential: number; // all x-3
    solid_performers: number; // 2-2
    needs_development: number; // 1-x or x-1
  };

  // Risk summary
  critical_risks: {
    high_churn_risk_count: number;
    critical_dependencies_count: number;
    unfilled_critical_roles: number;
    weak_pipelines_count: number;
    at_risk_teams_count: number;
  };

  // Opportunity summary
  opportunities: {
    ready_for_promotion_count: number;
    high_potential_unassigned: number;
    succession_ready_count: number;
    underutilized_talent: number;
  };

  // Trend indicators
  trends: {
    retention_rate_12m: number;
    internal_promotion_rate_12m: number;
    avg_time_to_fill_days: number;
    development_plan_completion_rate: number;
    survey_360_completion_rate: number;
  };

  // Action dashboard
  urgent_actions_required: number;
  high_priority_actions: number;
  total_open_actions: number;

  // Top risks requiring immediate attention
  top_risks: Array<{
    risk_id: string;
    risk_type: 'churn' | 'dependency' | 'pipeline_gap' | 'team_health' | 'succession';
    severity: 'critical' | 'high';
    description: string;
    employees_affected: number;
    action_required: string;
    owner?: string;
  }>;

  // Top opportunities
  top_opportunities: Array<{
    opportunity_id: string;
    opportunity_type: 'promotion' | 'succession' | 'development' | 'retention';
    potential_impact: number; // 0-100
    description: string;
    action_required: string;
  }>;
}

// Analytics Filters
export interface AnalyticsFilters {
  department_ids?: string[];
  manager_ids?: string[];
  performance_levels?: ('high' | 'medium' | 'low')[];
  potential_levels?: ('high' | 'medium' | 'low')[];
  tenure_min_months?: number;
  tenure_max_months?: number;
  is_critical_role?: boolean;
  date_range?: {
    start: string;
    end: string;
  };
}

// Analytics Comparison
export interface AnalyticsComparison {
  current: ExecutiveAnalyticsSummary;
  previous?: ExecutiveAnalyticsSummary;
  changes: {
    overall_health: number; // +/- change
    high_performers: number; // +/- change
    churn_risk_count: number; // +/- change
    retention_rate: number; // +/- change
    [key: string]: number;
  };
  period: string; // e.g., "vs. Last Quarter", "vs. 6 Months Ago"
}
