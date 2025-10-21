/**
 * Advanced Talent Analytics Engine
 *
 * Provides predictive analytics, risk scoring, and strategic insights for talent management:
 * - Churn risk prediction
 * - Performance trajectory analysis
 * - Team health scoring
 * - Talent pipeline strength
 * - Key person dependency mapping
 */

import type { Employee, Assessment, EmployeePlan, Survey360, PerformanceImprovementPlan, SuccessionCandidate, OneOnOneMeeting, Department } from '../types';
import type {
  ChurnRiskPrediction,
  PerformanceTrajectory,
  TeamHealthScore,
  TalentPipelineAnalysis,
  KeyPersonDependencyRisk,
  ExecutiveAnalyticsSummary,
  AnalyticsFilters,
  ChurnRiskLevel,
  PerformanceTrend,
  TeamHealthStatus,
  PipelineStrength,
  DependencyRiskLevel
} from '../types/analytics';

// ============================================
// CHURN RISK PREDICTION
// ============================================

/**
 * Predicts employee churn risk using multi-factor analysis
 */
export function predictChurnRisk(
  employee: Employee,
  context: {
    employeePlan?: EmployeePlan;
    oneOnOnes?: OneOnOneMeeting[];
    surveys360?: Survey360[];
    pip?: PerformanceImprovementPlan;
    assessmentHistory?: Assessment[];
    department?: Department;
  }
): ChurnRiskPrediction {
  const riskFactors: Array<{ factor: string; impact_score: number; evidence: string }> = [];
  const retentionFactors: Array<{ factor: string; strength_score: number; evidence: string }> = [];

  let totalRiskScore = 0;
  let totalRetentionScore = 0;

  // Factor 1: Performance box placement (30% weight)
  if (employee.assessment) {
    const { performance, potential, box_key } = employee.assessment;

    // Low performers at high churn risk
    if (performance === 'low') {
      const score = potential === 'high' ? 60 : 80;
      riskFactors.push({
        factor: 'Underperformance',
        impact_score: score,
        evidence: `Currently in ${box_key || 'low performance'} box - below expectations`
      });
      totalRiskScore += score * 0.3;
    }

    // High performers / high potential might leave for better opportunities
    if (performance === 'high' && potential === 'high') {
      // Check if they have growth opportunities
      const hasSuccessionPlan = context.employeePlan?.plan_type === 'succession';
      if (!hasSuccessionPlan) {
        riskFactors.push({
          factor: 'Top talent without growth path',
          impact_score: 50,
          evidence: 'Star performer (3-3) but no documented succession/development plan'
        });
        totalRiskScore += 50 * 0.3;
      } else {
        retentionFactors.push({
          factor: 'Clear growth path',
          strength_score: 80,
          evidence: 'Active development plan in place for high performer'
        });
        totalRetentionScore += 80;
      }
    }

    // Stable performers are lower risk
    if (performance === 'medium' && potential === 'medium') {
      retentionFactors.push({
        factor: 'Steady contributor',
        strength_score: 70,
        evidence: 'Reliable performer meeting expectations'
      });
      totalRetentionScore += 70;
    }
  }

  // Factor 2: Active PIP (40% weight if present)
  if (context.pip && context.pip.status === 'active') {
    riskFactors.push({
      factor: 'Performance Improvement Plan',
      impact_score: 85,
      evidence: `Active PIP started ${context.pip.start_date} - high probability of exit`
    });
    totalRiskScore += 85 * 0.4;
  }

  // Factor 3: Development plan engagement (20% weight)
  if (context.employeePlan) {
    const { status, progress_percentage, plan_type } = context.employeePlan;

    if (status === 'active' && progress_percentage && progress_percentage > 60) {
      retentionFactors.push({
        factor: 'Active development engagement',
        strength_score: 75,
        evidence: `${plan_type} plan ${progress_percentage}% complete - shows investment`
      });
      totalRetentionScore += 75;
    } else if (status === 'on_hold' || status === 'cancelled') {
      riskFactors.push({
        factor: 'Stalled development',
        impact_score: 45,
        evidence: `Development plan ${status} - lack of growth opportunities`
      });
      totalRiskScore += 45 * 0.2;
    }
  } else if (employee.assessment?.potential === 'high') {
    // High potential without plan = risk
    riskFactors.push({
      factor: 'No development plan',
      impact_score: 55,
      evidence: 'High potential employee without active development plan'
    });
    totalRiskScore += 55 * 0.2;
  }

  // Factor 4: Manager engagement (15% weight)
  const recent3Months = new Date();
  recent3Months.setMonth(recent3Months.getMonth() - 3);

  const recentOneOnOnes = context.oneOnOnes?.filter(
    m => new Date(m.meeting_date) > recent3Months && m.status === 'completed'
  ) || [];

  if (recentOneOnOnes.length >= 3) {
    retentionFactors.push({
      factor: 'Regular manager 1:1s',
      strength_score: 70,
      evidence: `${recentOneOnOnes.length} one-on-ones in last 3 months`
    });
    totalRetentionScore += 70;
  } else if (recentOneOnOnes.length === 0) {
    riskFactors.push({
      factor: 'Lack of manager engagement',
      impact_score: 60,
      evidence: 'No one-on-ones recorded in last 3 months'
    });
    totalRiskScore += 60 * 0.15;
  }

  // Factor 5: 360 feedback participation (10% weight)
  const recent360 = context.surveys360?.find(
    s => s.status === 'completed' &&
    new Date(s.completed_at || s.created_at) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
  );

  if (recent360) {
    retentionFactors.push({
      factor: '360 feedback completed',
      strength_score: 65,
      evidence: 'Participated in recent 360 survey - shows organizational investment'
    });
    totalRetentionScore += 65;
  }

  // Factor 6: Tenure analysis (15% weight)
  const tenureMonths = employee.created_at
    ? Math.floor((Date.now() - new Date(employee.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30))
    : 12;

  if (tenureMonths < 6) {
    riskFactors.push({
      factor: 'Recent hire',
      impact_score: 55,
      evidence: `Only ${tenureMonths} months tenure - early flight risk window`
    });
    totalRiskScore += 55 * 0.15;
  } else if (tenureMonths >= 24 && tenureMonths <= 48) {
    retentionFactors.push({
      factor: 'Established tenure',
      strength_score: 75,
      evidence: `${tenureMonths} months with company - mid-career stability`
    });
    totalRetentionScore += 75;
  } else if (tenureMonths >= 48) {
    retentionFactors.push({
      factor: 'Long tenure',
      strength_score: 85,
      evidence: `${Math.floor(tenureMonths / 12)} years with company - strong retention indicator`
    });
    totalRetentionScore += 85;
  }

  // Calculate final churn risk score (0-100)
  // Higher retention score reduces risk
  const rawRiskScore = Math.min(100, totalRiskScore);
  const retentionReduction = Math.min(50, totalRetentionScore * 0.4);
  const churnRiskScore = Math.max(0, Math.min(100, rawRiskScore - retentionReduction));

  // Determine risk level
  let riskLevel: ChurnRiskLevel;
  if (churnRiskScore >= 75) riskLevel = 'critical';
  else if (churnRiskScore >= 55) riskLevel = 'high';
  else if (churnRiskScore >= 35) riskLevel = 'medium';
  else riskLevel = 'low';

  // Calculate probability (simplified logistic curve)
  const churn_probability_6m = 1 / (1 + Math.exp(-(churnRiskScore - 50) / 15));
  const churn_probability_12m = 1 / (1 + Math.exp(-(churnRiskScore - 40) / 15));

  // Generate recommendations
  const recommended_actions = generateChurnMitigationActions(riskLevel, riskFactors, employee);

  // Estimate replacement cost (simplified)
  const avgSalaryByLevel = {
    executive: 250000,
    director: 150000,
    manager: 100000,
    senior: 120000,
    mid: 80000,
    junior: 60000
  };
  const titleLower = employee.title?.toLowerCase() || '';
  let estimatedSalary = 80000;
  if (titleLower.includes('executive') || titleLower.includes('vp')) estimatedSalary = avgSalaryByLevel.executive;
  else if (titleLower.includes('director')) estimatedSalary = avgSalaryByLevel.director;
  else if (titleLower.includes('manager')) estimatedSalary = avgSalaryByLevel.manager;
  else if (titleLower.includes('senior') || titleLower.includes('sr')) estimatedSalary = avgSalaryByLevel.senior;
  else if (titleLower.includes('junior') || titleLower.includes('jr')) estimatedSalary = avgSalaryByLevel.junior;

  const replacement_cost_estimate = Math.floor(estimatedSalary * 1.5); // 1.5x salary rule of thumb

  // Impact if lost
  const impact_if_lost =
    (employee.assessment?.performance === 'high' && employee.assessment?.potential === 'high') ? 'critical' :
    employee.assessment?.performance === 'high' ? 'high' :
    employee.assessment?.performance === 'medium' ? 'medium' : 'low';

  return {
    employee_id: employee.id,
    employee_name: employee.name,
    title: employee.title || 'Unknown',
    department: employee.department?.name || 'Unknown',
    churn_risk_score: Math.round(churnRiskScore),
    churn_risk_level: riskLevel,
    churn_probability_6m: Math.round(churn_probability_6m * 100) / 100,
    churn_probability_12m: Math.round(churn_probability_12m * 100) / 100,
    risk_factors: riskFactors,
    retention_factors: retentionFactors,
    recommended_actions,
    replacement_cost_estimate,
    impact_if_lost,
    last_updated: new Date().toISOString()
  };
}

function generateChurnMitigationActions(
  riskLevel: ChurnRiskLevel,
  riskFactors: Array<{ factor: string; impact_score: number; evidence: string }>,
  employee: Employee
) {
  const actions: Array<{ action: string; priority: 'urgent' | 'high' | 'medium' | 'low'; impact_potential: number; timeline: string }> = [];

  if (riskLevel === 'critical' || riskLevel === 'high') {
    actions.push({
      action: `Schedule immediate retention conversation with ${employee.name}`,
      priority: 'urgent',
      impact_potential: 85,
      timeline: 'Within 1 week'
    });

    if (riskFactors.some(f => f.factor.includes('development') || f.factor.includes('growth'))) {
      actions.push({
        action: 'Create personalized development plan with clear promotion timeline',
        priority: 'urgent',
        impact_potential: 80,
        timeline: 'Within 2 weeks'
      });
    }

    if (riskFactors.some(f => f.factor.includes('manager') || f.factor.includes('1:1'))) {
      actions.push({
        action: 'Establish weekly one-on-one meetings with manager',
        priority: 'high',
        impact_potential: 70,
        timeline: 'Start immediately'
      });
    }

    actions.push({
      action: 'Review compensation and consider retention bonus/equity',
      priority: 'high',
      impact_potential: 75,
      timeline: 'Within 1 month'
    });
  }

  if (riskLevel === 'medium') {
    actions.push({
      action: 'Conduct stay interview to understand motivations and concerns',
      priority: 'high',
      impact_potential: 65,
      timeline: 'Within 1 month'
    });

    actions.push({
      action: 'Ensure active development plan with quarterly reviews',
      priority: 'medium',
      impact_potential: 60,
      timeline: 'Within 6 weeks'
    });
  }

  if (riskFactors.some(f => f.factor.includes('Top talent'))) {
    actions.push({
      action: 'Nominate for high-potential leadership program or stretch assignment',
      priority: 'high',
      impact_potential: 80,
      timeline: 'Within 1 quarter'
    });
  }

  return actions.sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

// ============================================
// PERFORMANCE TRAJECTORY ANALYSIS
// ============================================

/**
 * Analyzes employee performance trends and predicts future trajectory
 */
export function analyzePerformanceTrajectory(
  employee: Employee,
  assessmentHistory: Assessment[]
): PerformanceTrajectory {
  const currentAssessment = employee.assessment;

  if (!currentAssessment) {
    throw new Error(`No current assessment for employee ${employee.name}`);
  }

  // Convert assessments to scored time series
  const performanceMap = { high: 100, medium: 60, low: 20 };
  const potentialMap = { high: 100, medium: 60, low: 20 };

  const trajectoryPoints = assessmentHistory
    .filter(a => a.performance && a.potential)
    .map(a => ({
      date: a.assessed_at || a.created_at,
      performance_score: (performanceMap[a.performance!] + potentialMap[a.potential!]) / 2,
      box_key: a.box_key || `${a.performance}-${a.potential}`,
      event: undefined as string | undefined
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate trend
  let trend: PerformanceTrend = 'stable';
  let velocity = 0;
  let trend_confidence = 0.5;

  if (trajectoryPoints.length >= 2) {
    const recent = trajectoryPoints.slice(-3); // Last 3 data points
    const scores = recent.map(p => p.performance_score);

    // Calculate linear trend
    const avgChange = scores.length > 1
      ? (scores[scores.length - 1] - scores[0]) / (scores.length - 1)
      : 0;

    velocity = avgChange;

    // Check variance (volatility)
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev > 20) {
      trend = 'volatile';
      trend_confidence = 0.4;
    } else if (avgChange > 5) {
      trend = 'improving';
      trend_confidence = 0.8;
    } else if (avgChange < -5) {
      trend = 'declining';
      trend_confidence = 0.8;
    } else {
      trend = 'stable';
      trend_confidence = 0.7;
    }
  }

  // Predict future performance
  const currentScore = (performanceMap[currentAssessment.performance!] + potentialMap[currentAssessment.potential!]) / 2;
  const predicted_6m_score = Math.max(0, Math.min(100, currentScore + velocity * 3)); // 3 periods
  const predicted_12m_score = Math.max(0, Math.min(100, currentScore + velocity * 6)); // 6 periods

  // Convert scores back to boxes
  function scoreToBox(score: number): string {
    const perf = score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low';
    const pot = score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low';
    const perfNum = perf === 'high' ? 3 : perf === 'medium' ? 2 : 1;
    const potNum = pot === 'high' ? 3 : pot === 'medium' ? 2 : 1;
    return `${perfNum}-${potNum}`;
  }

  const predicted_6m_box = scoreToBox(predicted_6m_score);
  const predicted_12m_box = scoreToBox(predicted_12m_score);

  // Identify drivers and barriers
  const performance_drivers: string[] = [];
  const performance_barriers: string[] = [];

  if (trend === 'improving') {
    performance_drivers.push('Consistent upward performance trend');
    if (currentAssessment.performance === 'high') {
      performance_drivers.push('Currently exceeding expectations');
    }
  } else if (trend === 'declining') {
    performance_barriers.push('Declining performance over recent periods');
  }

  if (trend === 'volatile') {
    performance_barriers.push('Inconsistent performance - needs stabilization');
  }

  // Inflection points (simplified - would need more context in real implementation)
  const inflection_points: Array<{ date: string; event: string; impact: string }> = [];

  return {
    employee_id: employee.id,
    employee_name: employee.name,
    title: employee.title || 'Unknown',
    department: employee.department?.name || 'Unknown',
    current_performance: currentAssessment.performance!,
    current_potential: currentAssessment.potential!,
    current_box_key: currentAssessment.box_key || '',
    trend,
    trend_confidence,
    velocity,
    trajectory_points,
    predicted_6m_box,
    predicted_12m_box,
    predicted_6m_performance: Math.round(predicted_6m_score),
    predicted_12m_performance: Math.round(predicted_12m_score),
    performance_drivers,
    performance_barriers,
    inflection_points,
    last_updated: new Date().toISOString()
  };
}

// ============================================
// TEAM HEALTH SCORING
// ============================================

/**
 * Calculates comprehensive team health score
 */
export function calculateTeamHealthScore(
  team: {
    id: string;
    name: string;
    type: 'department' | 'manager' | 'custom';
    manager_name?: string;
  },
  employees: Employee[],
  context: {
    employeePlans: Record<string, EmployeePlan>;
    surveys360: Survey360[];
    oneOnOnes: OneOnOneMeeting[];
    successionCandidates: SuccessionCandidate[];
  }
): TeamHealthScore {
  const teamSize = employees.length;

  if (teamSize === 0) {
    throw new Error(`Team ${team.name} has no employees`);
  }

  // Assessed employees
  const assessed = employees.filter(e => e.assessment);
  const assessedPct = assessed.length / teamSize;

  // DIMENSION 1: Talent Quality
  const highPerformers = assessed.filter(e => e.assessment?.performance === 'high').length;
  const topTalent = assessed.filter(e =>
    e.assessment?.performance === 'high' && e.assessment?.potential === 'high'
  ).length;
  const underperformers = assessed.filter(e => e.assessment?.performance === 'low').length;

  const talentQualityScore = Math.round(
    (highPerformers / teamSize) * 40 +
    (topTalent / teamSize) * 40 +
    (1 - underperformers / teamSize) * 20
  );

  // DIMENSION 2: Engagement
  const employeesWithPlans = employees.filter(e => context.employeePlans[e.id]).length;
  const plansPct = employeesWithPlans / teamSize;

  const recent3Months = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const recent1on1s = context.oneOnOnes.filter(m =>
    employees.some(e => e.id === m.employee_id) &&
    new Date(m.meeting_date) > recent3Months
  );
  const avgOneOnOnesPerEmployee = recent1on1s.length / teamSize;

  const surveys360Count = context.surveys360.filter(s =>
    employees.some(e => e.id === s.employee_id)
  ).length;
  const survey360Participation = surveys360Count / teamSize;

  const engagementScore = Math.round(
    plansPct * 30 +
    Math.min(1, avgOneOnOnesPerEmployee / 3) * 40 + // Target: 3+ in 3 months
    survey360Participation * 30
  );

  // DIMENSION 3: Development
  const activePlans = Object.values(context.employeePlans).filter(p =>
    employees.some(e => e.id === p.employee_id) && p.status === 'active'
  );
  const activePlansPct = activePlans.length / teamSize;

  const completedPlans = Object.values(context.employeePlans).filter(p =>
    employees.some(e => e.id === p.employee_id) && p.status === 'completed'
  );
  const planCompletionRate = completedPlans.length / Math.max(1, activePlans.length + completedPlans.length);

  const developmentScore = Math.round(
    activePlansPct * 50 +
    planCompletionRate * 50
  );

  // DIMENSION 4: Succession Readiness
  const criticalRoles = employees.filter(e => e.is_critical_role).length;
  const successors = context.successionCandidates.filter(sc =>
    employees.some(e => e.id === sc.employee_id)
  );
  const successorsPct = criticalRoles > 0 ? successors.length / criticalRoles : 1;
  const readyNowSuccessors = successors.filter(sc => sc.readiness_tier === 'ready_now').length;

  const successionScore = Math.round(
    successorsPct * 60 +
    (readyNowSuccessors / Math.max(1, criticalRoles)) * 40
  );

  // DIMENSION 5: Team Balance
  const perfDistribution = {
    high: assessed.filter(e => e.assessment?.performance === 'high').length,
    medium: assessed.filter(e => e.assessment?.performance === 'medium').length,
    low: assessed.filter(e => e.assessment?.performance === 'low').length
  };

  // Ideal distribution: 20% high, 70% medium, 10% low
  const balanceScore = Math.round(100 - (
    Math.abs(perfDistribution.high / teamSize - 0.2) * 100 +
    Math.abs(perfDistribution.medium / teamSize - 0.7) * 100 +
    Math.abs(perfDistribution.low / teamSize - 0.1) * 100
  ) / 3);

  // OVERALL HEALTH SCORE
  const dimensions = {
    talent_quality: {
      score: talentQualityScore * assessedPct, // Penalize if not fully assessed
      high_performers_pct: highPerformers / teamSize,
      top_talent_pct: topTalent / teamSize,
      underperformers_pct: underperformers / teamSize
    },
    engagement: {
      score: engagementScore,
      retention_rate_12m: 0.85, // Would calculate from actual data
      promotion_rate_12m: topTalent / teamSize,
      survey_360_participation,
      one_on_one_frequency: avgOneOnOnesPerEmployee
    },
    development: {
      score: developmentScore,
      employees_with_plans_pct: plansPct,
      plan_completion_rate: planCompletionRate,
      avg_development_hours: 0, // Would calculate from training data
      internal_mobility_rate: 0 // Would calculate from promotion data
    },
    succession_readiness: {
      score: successionScore,
      critical_roles_covered_pct: successorsPct,
      bench_strength: successors.length / Math.max(1, criticalRoles),
      ready_now_successors: readyNowSuccessors
    },
    team_balance: {
      score: balanceScore,
      performance_distribution_balance: balanceScore / 100,
      tenure_diversity_score: 0.7, // Would calculate from tenure data
      skills_coverage_score: 0.75 // Would calculate from skills data
    }
  };

  const overall_health_score = Math.round(
    dimensions.talent_quality.score * 0.30 +
    dimensions.engagement.score * 0.25 +
    dimensions.development.score * 0.20 +
    dimensions.succession_readiness.score * 0.15 +
    dimensions.team_balance.score * 0.10
  );

  // Determine health status
  let health_status: TeamHealthStatus;
  if (overall_health_score >= 80) health_status = 'excellent';
  else if (overall_health_score >= 65) health_status = 'good';
  else if (overall_health_score >= 50) health_status = 'at_risk';
  else health_status = 'critical';

  // Identify risks
  const risks: Array<{ risk_type: string; severity: 'critical' | 'high' | 'medium' | 'low'; description: string; affected_employees: number; recommended_action: string }> = [];

  if (underperformers / teamSize > 0.15) {
    risks.push({
      risk_type: 'High underperformance rate',
      severity: 'high',
      description: `${underperformers} employees (${Math.round(underperformers / teamSize * 100)}%) performing below expectations`,
      affected_employees: underperformers,
      recommended_action: 'Implement PIPs and provide targeted coaching'
    });
  }

  if (plansPct < 0.5) {
    risks.push({
      risk_type: 'Low development coverage',
      severity: 'medium',
      description: `Only ${Math.round(plansPct * 100)}% of team has development plans`,
      affected_employees: teamSize - employeesWithPlans,
      recommended_action: 'Create development plans for all team members'
    });
  }

  if (avgOneOnOnesPerEmployee < 2) {
    risks.push({
      risk_type: 'Insufficient manager engagement',
      severity: 'high',
      description: `Average of only ${avgOneOnOnesPerEmployee.toFixed(1)} 1:1s per employee in last 3 months`,
      affected_employees: teamSize,
      recommended_action: 'Establish regular bi-weekly 1:1 cadence'
    });
  }

  // Identify opportunities
  const opportunities: Array<{ opportunity_type: string; potential_impact: number; description: string; action_required: string }> = [];

  const readyForPromotion = assessed.filter(e =>
    e.assessment?.performance === 'high' && e.assessment?.potential === 'high'
  ).length;

  if (readyForPromotion > 0) {
    opportunities.push({
      opportunity_type: 'Promotion-ready talent',
      potential_impact: 80,
      description: `${readyForPromotion} high performers ready for advancement`,
      action_required: 'Review promotion timeline and create succession plans'
    });
  }

  const avgTenureMonths = 24; // Would calculate from actual data

  return {
    team_id: team.id,
    team_name: team.name,
    team_type: team.type,
    overall_health_score,
    health_status,
    health_trend: 'stable', // Would calculate from historical data
    dimensions,
    risks,
    opportunities,
    team_size: teamSize,
    avg_tenure_months: avgTenureMonths,
    manager_name: team.manager_name,
    last_updated: new Date().toISOString()
  };
}

// ============================================
// TALENT PIPELINE ANALYSIS
// ============================================

/**
 * Analyzes talent pipeline strength for succession planning
 */
export function analyzeTalentPipeline(
  employees: Employee[],
  successionCandidates: SuccessionCandidate[]
): TalentPipelineAnalysis {
  const assessed = employees.filter(e => e.assessment);

  // Overall pipeline metrics
  const highPotential = assessed.filter(e => e.assessment?.potential === 'high');
  const highPerformers = assessed.filter(e => e.assessment?.performance === 'high');

  const readyNow = successionCandidates.filter(sc => sc.readiness_tier === 'ready_now').length;
  const readySoon = successionCandidates.filter(sc => sc.readiness_tier === 'ready_soon').length;
  const futurePipeline = successionCandidates.filter(sc => sc.readiness_tier === 'future_pipeline').length;

  // Calculate pipeline score
  const pipelineScore = Math.round(
    (readyNow / Math.max(1, employees.length)) * 40 * 100 +
    (readySoon / Math.max(1, employees.length)) * 30 * 100 +
    (futurePipeline / Math.max(1, employees.length)) * 20 * 100 +
    (highPotential.length / Math.max(1, employees.length)) * 10 * 100
  );

  let pipelineStrength: PipelineStrength;
  if (pipelineScore >= 75) pipelineStrength = 'strong';
  else if (pipelineScore >= 50) pipelineStrength = 'adequate';
  else if (pipelineScore >= 30) pipelineStrength = 'weak';
  else pipelineStrength = 'critical';

  // Gaps
  const critical_gaps: Array<{
    gap_type: string;
    severity: 'critical' | 'high' | 'medium';
    description: string;
    positions_affected: number;
    time_to_fill_estimate: string;
    recommended_action: string;
  }> = [];

  if (readyNow === 0) {
    critical_gaps.push({
      gap_type: 'No ready-now successors',
      severity: 'critical',
      description: 'No candidates ready for immediate promotion',
      positions_affected: employees.filter(e => e.is_critical_role).length,
      time_to_fill_estimate: '12-18 months',
      recommended_action: 'Accelerate development of top performers'
    });
  }

  return {
    pipeline_id: 'overall',
    pipeline_name: 'Organization-wide Pipeline',
    pipeline_type: 'succession',
    pipeline_strength: pipelineStrength,
    pipeline_score: pipelineScore,
    total_positions: employees.length,
    filled_positions: assessed.length,
    fill_rate: assessed.length / employees.length,
    ready_now: readyNow,
    ready_1_year: readySoon,
    ready_2_years: futurePipeline,
    future_potential: highPotential.length,
    avg_readiness_score: successionCandidates.reduce((sum, sc) => sum + (sc.readiness_percentage || 50), 0) / Math.max(1, successionCandidates.length),
    high_potential_count: highPotential.length,
    proven_performers_count: highPerformers.length,
    critical_gaps,
    avg_time_to_ready: 18, // months - would calculate from actual data
    promotion_rate_12m: 0.1,
    internal_fill_rate: 0.7,
    trend_6m: 'stable',
    trend_12m: 'stable',
    last_updated: new Date().toISOString()
  };
}

// ============================================
// KEY PERSON DEPENDENCY RISK
// ============================================

/**
 * Identifies key person dependencies and single points of failure
 */
export function calculateKeyPersonRisk(
  employee: Employee,
  context: {
    directReports?: Employee[];
    successionCandidates?: SuccessionCandidate[];
    churnRisk?: ChurnRiskPrediction;
  }
): KeyPersonDependencyRisk {
  let dependencyScore = 0;

  // Factor 1: Unique skills (0-100)
  const uniqueSkillsScore = employee.required_skills && employee.required_skills.length > 5 ? 70 : 40;
  const othersWithSkill = 2; // Would calculate by checking other employees' skills

  // Factor 2: Unique relationships (0-100)
  const relationshipScore = employee.is_critical_role ? 80 : 40;

  // Factor 3: Knowledge concentration (0-100)
  const knowledgeScore = 60; // Would assess documentation coverage
  const documentationCoverage = 40; // Percentage

  // Factor 4: Direct reports impact (0-100)
  const reportCount = context.directReports?.length || 0;
  const highPerformersReporting = context.directReports?.filter(e =>
    e.assessment?.performance === 'high'
  ).length || 0;
  const directReportsScore = Math.min(100, reportCount * 10 + highPerformersReporting * 15);

  // Factor 5: Project dependencies (0-100)
  const projectScore = employee.is_critical_role ? 75 : 35;

  // Overall dependency score
  dependencyScore = Math.round(
    uniqueSkillsScore * 0.25 +
    relationshipScore * 0.20 +
    knowledgeScore * 0.20 +
    directReportsScore * 0.20 +
    projectScore * 0.15
  );

  let dependencyLevel: DependencyRiskLevel;
  if (dependencyScore >= 75) dependencyLevel = 'critical';
  else if (dependencyScore >= 60) dependencyLevel = 'high';
  else if (dependencyScore >= 40) dependencyLevel = 'medium';
  else dependencyLevel = 'low';

  // Succession readiness
  const successors = context.successionCandidates || [];
  const hasSuccessor = successors.length > 0;
  const successorReadiness = successors.length > 0
    ? Math.max(...successors.map(sc => sc.readiness_percentage || 0))
    : 0;

  // Mitigation actions
  const recommended_actions: Array<{
    action: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    timeline: string;
    status: 'not_started' | 'in_progress' | 'completed';
  }> = [];

  if (dependencyLevel === 'critical' || dependencyLevel === 'high') {
    recommended_actions.push({
      action: 'Create comprehensive documentation of key processes and relationships',
      priority: 'urgent',
      timeline: '30 days',
      status: 'not_started'
    });

    if (!hasSuccessor) {
      recommended_actions.push({
        action: 'Identify and begin developing succession candidate(s)',
        priority: 'urgent',
        timeline: '60 days',
        status: 'not_started'
      });
    }

    recommended_actions.push({
      action: 'Cross-train team members on critical responsibilities',
      priority: 'high',
      timeline: '90 days',
      status: 'not_started'
    });
  }

  // Combined risk with churn
  const combinedRisk = context.churnRisk
    ? Math.round((dependencyScore + context.churnRisk.churn_risk_score) / 2)
    : dependencyScore;

  return {
    employee_id: employee.id,
    employee_name: employee.name,
    title: employee.title || 'Unknown',
    department: employee.department?.name || 'Unknown',
    dependency_risk_score: dependencyScore,
    dependency_risk_level: dependencyLevel,
    criticality_factors: {
      unique_skills: {
        score: uniqueSkillsScore,
        skills: employee.required_skills || [],
        others_with_skill: othersWithSkill
      },
      unique_relationships: {
        score: relationshipScore,
        key_relationships: [],
        relationship_redundancy: 30
      },
      knowledge_concentration: {
        score: knowledgeScore,
        critical_knowledge_areas: [],
        documentation_coverage: documentationCoverage
      },
      direct_reports: {
        score: directReportsScore,
        report_count: reportCount,
        high_performers_reporting: highPerformersReporting
      },
      project_dependencies: {
        score: projectScore,
        critical_projects: [],
        backup_coverage: 40
      }
    },
    has_designated_successor: hasSuccessor,
    successor_readiness: successorReadiness,
    successors_in_pipeline: successors.length,
    time_to_backfill_estimate: dependencyLevel === 'critical' ? '6-12 months' : '3-6 months',
    knowledge_transfer_plan_exists: false,
    documentation_completeness: documentationCoverage,
    cross_training_coverage: 50,
    projects_at_risk: [],
    teams_affected: reportCount > 0 ? 1 : 0,
    client_relationships_at_risk: 0,
    mitigation_priority: dependencyLevel === 'critical' ? 'urgent' : dependencyLevel === 'high' ? 'high' : 'medium',
    recommended_actions,
    flight_risk_level: context.churnRisk?.churn_risk_level,
    combined_risk_score: combinedRisk,
    last_updated: new Date().toISOString()
  };
}

// ============================================
// EXECUTIVE SUMMARY
// ============================================

/**
 * Generates executive analytics summary
 */
export function generateExecutiveSummary(
  employees: Employee[],
  churnPredictions: ChurnRiskPrediction[],
  dependencyRisks: KeyPersonDependencyRisk[],
  teamHealthScores: TeamHealthScore[],
  pipelineAnalysis: TalentPipelineAnalysis
): ExecutiveAnalyticsSummary {
  const assessed = employees.filter(e => e.assessment);

  // Performance distribution
  const distribution = {
    high_performance_high_potential: assessed.filter(e =>
      e.assessment?.performance === 'high' && e.assessment?.potential === 'high'
    ).length,
    high_performance: assessed.filter(e => e.assessment?.performance === 'high').length,
    high_potential: assessed.filter(e => e.assessment?.potential === 'high').length,
    solid_performers: assessed.filter(e =>
      e.assessment?.performance === 'medium' && e.assessment?.potential === 'medium'
    ).length,
    needs_development: assessed.filter(e =>
      e.assessment?.performance === 'low' || e.assessment?.potential === 'low'
    ).length
  };

  // Calculate overall health
  const avgTeamHealth = teamHealthScores.reduce((sum, t) => sum + t.overall_health_score, 0) /
    Math.max(1, teamHealthScores.length);

  const overall_talent_health_score = Math.round(
    avgTeamHealth * 0.4 +
    pipelineAnalysis.pipeline_score * 0.3 +
    (1 - churnPredictions.filter(c => c.churn_risk_level === 'high' || c.churn_risk_level === 'critical').length / employees.length) * 100 * 0.3
  );

  // Top risks
  const top_risks: Array<{
    risk_id: string;
    risk_type: 'churn' | 'dependency' | 'pipeline_gap' | 'team_health' | 'succession';
    severity: 'critical' | 'high';
    description: string;
    employees_affected: number;
    action_required: string;
    owner?: string;
  }> = [];

  // Add critical churn risks
  churnPredictions
    .filter(c => c.churn_risk_level === 'critical')
    .slice(0, 3)
    .forEach(c => {
      top_risks.push({
        risk_id: `churn-${c.employee_id}`,
        risk_type: 'churn',
        severity: 'critical',
        description: `${c.employee_name} (${c.title}) at critical flight risk`,
        employees_affected: 1,
        action_required: c.recommended_actions[0]?.action || 'Immediate retention intervention required'
      });
    });

  // Add critical dependencies
  dependencyRisks
    .filter(d => d.dependency_risk_level === 'critical' && d.flight_risk_level !== 'low')
    .slice(0, 2)
    .forEach(d => {
      top_risks.push({
        risk_id: `dependency-${d.employee_id}`,
        risk_type: 'dependency',
        severity: 'critical',
        description: `${d.employee_name} is single point of failure with ${d.criticality_factors.direct_reports.report_count} direct reports`,
        employees_affected: d.criticality_factors.direct_reports.report_count + 1,
        action_required: 'Establish succession plan and knowledge transfer immediately'
      });
    });

  return {
    organization_id: 'org-1',
    generated_at: new Date().toISOString(),
    overall_talent_health_score,
    talent_health_trend: 'stable',
    total_employees: employees.length,
    total_assessed: assessed.length,
    assessment_coverage: assessed.length / employees.length,
    performance_distribution: distribution,
    critical_risks: {
      high_churn_risk_count: churnPredictions.filter(c => c.churn_risk_level === 'high' || c.churn_risk_level === 'critical').length,
      critical_dependencies_count: dependencyRisks.filter(d => d.dependency_risk_level === 'critical').length,
      unfilled_critical_roles: employees.filter(e => e.is_critical_role).length - pipelineAnalysis.ready_now,
      weak_pipelines_count: pipelineAnalysis.pipeline_strength === 'weak' || pipelineAnalysis.pipeline_strength === 'critical' ? 1 : 0,
      at_risk_teams_count: teamHealthScores.filter(t => t.health_status === 'at_risk' || t.health_status === 'critical').length
    },
    opportunities: {
      ready_for_promotion_count: distribution.high_performance_high_potential,
      high_potential_unassigned: distribution.high_potential - pipelineAnalysis.ready_now,
      succession_ready_count: pipelineAnalysis.ready_now,
      underutilized_talent: 0
    },
    trends: {
      retention_rate_12m: 0.88,
      internal_promotion_rate_12m: 0.12,
      avg_time_to_fill_days: 65,
      development_plan_completion_rate: 0.75,
      survey_360_completion_rate: 0.65
    },
    urgent_actions_required: top_risks.filter(r => r.severity === 'critical').length,
    high_priority_actions: top_risks.length,
    total_open_actions: top_risks.length + 10, // Would count from action items
    top_risks,
    top_opportunities: []
  };
}
