import { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  Target,
  Award,
  Activity,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import type { Employee, EmployeePlan, Survey360, PerformanceImprovementPlan, SuccessionCandidate, OneOnOneMeeting, Department } from '../types';
import type { ExecutiveAnalyticsSummary, ChurnRiskPrediction, KeyPersonDependencyRisk, TeamHealthScore, TalentPipelineAnalysis } from '../types/analytics';
import {
  predictChurnRisk,
  analyzePerformanceTrajectory,
  calculateTeamHealthScore,
  analyzeTalentPipeline,
  calculateKeyPersonRisk,
  generateExecutiveSummary
} from '../lib/talentAnalytics';

interface AnalyticsDashboardProps {
  employees: Employee[];
  departments: Department[];
  employeePlans: Record<string, EmployeePlan>;
  surveys360: Survey360[];
  pips: Record<string, PerformanceImprovementPlan>;
  successionCandidates: SuccessionCandidate[];
  oneOnOnes: OneOnOneMeeting[];
  onNavigate?: (view: string, employeeId?: string) => void;
}

export default function AnalyticsDashboard({
  employees,
  departments,
  employeePlans,
  surveys360,
  pips,
  successionCandidates,
  oneOnOnes,
  onNavigate
}: AnalyticsDashboardProps) {
  const [selectedView, setSelectedView] = useState<'overview' | 'churn' | 'trajectory' | 'teams' | 'pipeline' | 'dependencies'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Calculate all analytics
  const analytics = useMemo(() => {
    console.log('Calculating advanced analytics...');
    const start = Date.now();

    // Churn predictions for all employees
    const churnPredictions: ChurnRiskPrediction[] = employees
      .filter(e => e.assessment) // Only assessed employees
      .map(employee => {
        const plan = employeePlans[employee.id];
        const employeeOneOnOnes = oneOnOnes.filter(m => m.employee_id === employee.id);
        const employeeSurveys = surveys360.filter(s => s.employee_id === employee.id);
        const pip = pips[employee.id];

        return predictChurnRisk(employee, {
          employeePlan: plan,
          oneOnOnes: employeeOneOnOnes,
          surveys360: employeeSurveys,
          pip,
          assessmentHistory: employee.assessment ? [employee.assessment] : [],
          department: employee.department
        });
      });

    // Key person dependencies
    const dependencyRisks: KeyPersonDependencyRisk[] = employees
      .filter(e => e.assessment)
      .map(employee => {
        const directReports = employees.filter(e => e.reports_to_id === employee.id);
        const employeeSuccessors = successionCandidates.filter(sc => sc.employee_id === employee.id);
        const churnRisk = churnPredictions.find(c => c.employee_id === employee.id);

        return calculateKeyPersonRisk(employee, {
          directReports,
          successionCandidates: employeeSuccessors,
          churnRisk
        });
      });

    // Team health scores by department
    const teamHealthScores: TeamHealthScore[] = departments.map(dept => {
      const deptEmployees = employees.filter(e => e.department_id === dept.id);
      const manager = deptEmployees.find(e =>
        deptEmployees.some(emp => emp.reports_to_id === e.id)
      );

      return calculateTeamHealthScore(
        {
          id: dept.id,
          name: dept.name,
          type: 'department',
          manager_name: manager?.name
        },
        deptEmployees,
        {
          employeePlans,
          surveys360,
          oneOnOnes,
          successionCandidates
        }
      );
    });

    // Pipeline analysis
    const pipelineAnalysis = analyzeTalentPipeline(employees, successionCandidates);

    // Executive summary
    const summary = generateExecutiveSummary(
      employees,
      churnPredictions,
      dependencyRisks,
      teamHealthScores,
      pipelineAnalysis
    );

    console.log(`Analytics calculated in ${Date.now() - start}ms`);

    return {
      churnPredictions,
      dependencyRisks,
      teamHealthScores,
      pipelineAnalysis,
      summary
    };
  }, [employees, departments, employeePlans, surveys360, pips, successionCandidates, oneOnOnes]);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto text-blue-500 mb-4" />
          <p className="text-gray-600">Analyzing talent data...</p>
        </div>
      </div>
    );
  }

  const { summary } = analytics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Talent Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">
              Strategic insights powered by predictive models
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">{summary.overall_talent_health_score}</div>
              <div className="text-xs text-gray-500">Talent Health Score</div>
            </div>
            <div className={`p-3 rounded-lg ${
              summary.overall_talent_health_score >= 80 ? 'bg-green-100' :
              summary.overall_talent_health_score >= 60 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              {summary.talent_health_trend === 'improving' ? (
                <TrendingUp className={`w-8 h-8 ${
                  summary.overall_talent_health_score >= 80 ? 'text-green-600' :
                  summary.overall_talent_health_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`} />
              ) : summary.talent_health_trend === 'declining' ? (
                <TrendingDown className={`w-8 h-8 ${
                  summary.overall_talent_health_score >= 80 ? 'text-green-600' :
                  summary.overall_talent_health_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`} />
              ) : (
                <Minus className={`w-8 h-8 ${
                  summary.overall_talent_health_score >= 80 ? 'text-green-600' :
                  summary.overall_talent_health_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`} />
              )}
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Total Employees"
            value={summary.total_employees}
            icon={<Users className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            label="Assessment Coverage"
            value={`${Math.round(summary.assessment_coverage * 100)}%`}
            icon={<Target className="w-5 h-5" />}
            color="purple"
          />
          <StatCard
            label="Top Talent (3-3)"
            value={summary.performance_distribution.high_performance_high_potential}
            icon={<Award className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            label="Critical Risks"
            value={summary.urgent_actions_required}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="red"
            trend={summary.urgent_actions_required > 0 ? 'down' : 'up'}
          />
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="bg-white border border-gray-200 rounded-lg p-2 flex gap-2">
        {[
          { key: 'overview', label: 'Overview', icon: Activity },
          { key: 'churn', label: 'Churn Risk', icon: TrendingDown },
          { key: 'teams', label: 'Team Health', icon: Users },
          { key: 'pipeline', label: 'Pipeline', icon: Target },
          { key: 'dependencies', label: 'Key Person Risk', icon: AlertTriangle }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setSelectedView(tab.key as any)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedView === tab.key
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {selectedView === 'overview' && (
        <OverviewView summary={summary} analytics={analytics} onNavigate={onNavigate} />
      )}
      {selectedView === 'churn' && (
        <ChurnRiskView predictions={analytics.churnPredictions} onNavigate={onNavigate} />
      )}
      {selectedView === 'teams' && (
        <TeamHealthView teams={analytics.teamHealthScores} />
      )}
      {selectedView === 'pipeline' && (
        <PipelineView analysis={analytics.pipelineAnalysis} />
      )}
      {selectedView === 'dependencies' && (
        <DependencyRiskView risks={analytics.dependencyRisks} onNavigate={onNavigate} />
      )}
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function StatCard({
  label,
  value,
  icon,
  color,
  trend
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  trend?: 'up' | 'down';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
      <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500 flex items-center gap-1">
          {label}
          {trend === 'up' && <ArrowUp className="w-3 h-3 text-green-500" />}
          {trend === 'down' && <ArrowDown className="w-3 h-3 text-red-500" />}
        </div>
      </div>
    </div>
  );
}

function OverviewView({
  summary,
  analytics,
  onNavigate
}: {
  summary: ExecutiveAnalyticsSummary;
  analytics: any;
  onNavigate?: (view: string, employeeId?: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Top Risks */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          Top Risks Requiring Attention
        </h2>
        <div className="space-y-3">
          {summary.top_risks.length === 0 ? (
            <p className="text-gray-500 text-sm">No critical risks identified</p>
          ) : (
            summary.top_risks.map((risk, idx) => (
              <div
                key={risk.risk_id}
                className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  if (risk.risk_type === 'churn' && onNavigate) {
                    const employeeId = risk.risk_id.replace('churn-', '');
                    onNavigate('employee', employeeId);
                  }
                }}
              >
                <div className={`p-2 rounded-lg ${
                  risk.severity === 'critical' ? 'bg-red-500' : 'bg-orange-500'
                }`}>
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{risk.description}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      risk.severity === 'critical'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {risk.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{risk.action_required}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{risk.employees_affected} employee(s) affected</span>
                    <span className="capitalize">{risk.risk_type.replace('_', ' ')}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 mt-2" />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Performance Distribution */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Distribution</h2>
          <div className="space-y-3">
            <DistributionBar
              label="Star Talent (3-3)"
              value={summary.performance_distribution.high_performance_high_potential}
              total={summary.total_assessed}
              color="green"
            />
            <DistributionBar
              label="High Performers"
              value={summary.performance_distribution.high_performance}
              total={summary.total_assessed}
              color="blue"
            />
            <DistributionBar
              label="High Potential"
              value={summary.performance_distribution.high_potential}
              total={summary.total_assessed}
              color="purple"
            />
            <DistributionBar
              label="Solid Performers"
              value={summary.performance_distribution.solid_performers}
              total={summary.total_assessed}
              color="yellow"
            />
            <DistributionBar
              label="Needs Development"
              value={summary.performance_distribution.needs_development}
              total={summary.total_assessed}
              color="red"
            />
          </div>
        </div>

        {/* Critical Metrics */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Critical Metrics</h2>
          <div className="space-y-4">
            <MetricRow
              label="High Churn Risk"
              value={summary.critical_risks.high_churn_risk_count}
              total={summary.total_employees}
              status={summary.critical_risks.high_churn_risk_count > 5 ? 'critical' : 'ok'}
            />
            <MetricRow
              label="Key Dependencies"
              value={summary.critical_risks.critical_dependencies_count}
              total={summary.total_employees}
              status={summary.critical_risks.critical_dependencies_count > 3 ? 'warning' : 'ok'}
            />
            <MetricRow
              label="Unfilled Critical Roles"
              value={summary.critical_risks.unfilled_critical_roles}
              status={summary.critical_risks.unfilled_critical_roles > 0 ? 'critical' : 'ok'}
            />
            <MetricRow
              label="At-Risk Teams"
              value={summary.critical_risks.at_risk_teams_count}
              status={summary.critical_risks.at_risk_teams_count > 0 ? 'warning' : 'ok'}
            />
          </div>
        </div>
      </div>

      {/* Trends */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">12-Month Trends</h2>
        <div className="grid grid-cols-5 gap-4">
          <TrendCard
            label="Retention Rate"
            value={`${Math.round(summary.trends.retention_rate_12m * 100)}%`}
            target={85}
            current={summary.trends.retention_rate_12m * 100}
          />
          <TrendCard
            label="Promotion Rate"
            value={`${Math.round(summary.trends.internal_promotion_rate_12m * 100)}%`}
            target={10}
            current={summary.trends.internal_promotion_rate_12m * 100}
          />
          <TrendCard
            label="Avg Time to Fill"
            value={`${summary.trends.avg_time_to_fill_days}d`}
            target={60}
            current={summary.trends.avg_time_to_fill_days}
            inverse
          />
          <TrendCard
            label="Plan Completion"
            value={`${Math.round(summary.trends.development_plan_completion_rate * 100)}%`}
            target={70}
            current={summary.trends.development_plan_completion_rate * 100}
          />
          <TrendCard
            label="360 Completion"
            value={`${Math.round(summary.trends.survey_360_completion_rate * 100)}%`}
            target={60}
            current={summary.trends.survey_360_completion_rate * 100}
          />
        </div>
      </div>
    </div>
  );
}

function DistributionBar({
  label,
  value,
  total,
  color
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-500">
          {value} ({Math.round(percentage)}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colorClasses[color as keyof typeof colorClasses] || 'bg-gray-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  total,
  status
}: {
  label: string;
  value: number;
  total?: number;
  status: 'ok' | 'warning' | 'critical';
}) {
  const statusColors = {
    ok: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600'
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-lg font-semibold ${statusColors[status]}`}>
          {value}
        </span>
        {total && <span className="text-sm text-gray-500">/ {total}</span>}
      </div>
    </div>
  );
}

function TrendCard({
  label,
  value,
  target,
  current,
  inverse
}: {
  label: string;
  value: string;
  target: number;
  current: number;
  inverse?: boolean;
}) {
  const isGood = inverse ? current <= target : current >= target;

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
      <div className="flex items-center gap-1 mt-2">
        {isGood ? (
          <ArrowUp className="w-3 h-3 text-green-500" />
        ) : (
          <ArrowDown className="w-3 h-3 text-red-500" />
        )}
        <span className={`text-xs ${isGood ? 'text-green-600' : 'text-red-600'}`}>
          Target: {target}{inverse ? 'd' : '%'}
        </span>
      </div>
    </div>
  );
}

function ChurnRiskView({
  predictions,
  onNavigate
}: {
  predictions: ChurnRiskPrediction[];
  onNavigate?: (view: string, employeeId?: string) => void;
}) {
  const sortedPredictions = [...predictions].sort((a, b) => b.churn_risk_score - a.churn_risk_score);
  const highRisk = predictions.filter(p => p.churn_risk_level === 'high' || p.churn_risk_level === 'critical');

  return (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <h2 className="text-lg font-semibold text-red-900">
            {highRisk.length} Employees at High Churn Risk
          </h2>
        </div>
        <p className="text-sm text-red-700">
          Immediate intervention recommended to prevent talent loss
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">6m Probability</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Impact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Top Risk Factor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedPredictions.map(pred => (
              <tr
                key={pred.employee_id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onNavigate?.('employee', pred.employee_id)}
              >
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900">{pred.employee_name}</div>
                    <div className="text-sm text-gray-500">{pred.title}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      pred.churn_risk_level === 'critical' ? 'bg-red-100 text-red-700' :
                      pred.churn_risk_level === 'high' ? 'bg-orange-100 text-orange-700' :
                      pred.churn_risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {pred.churn_risk_score}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {Math.round(pred.churn_probability_6m * 100)}%
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    pred.impact_if_lost === 'critical' ? 'bg-red-100 text-red-700' :
                    pred.impact_if_lost === 'high' ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {pred.impact_if_lost}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                  {pred.risk_factors[0]?.factor || 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm text-blue-600 font-medium">
                  {pred.recommended_actions[0]?.action.slice(0, 30)}...
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TeamHealthView({ teams }: { teams: TeamHealthScore[] }) {
  const sortedTeams = [...teams].sort((a, b) => b.overall_health_score - a.overall_health_score);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        {sortedTeams.map(team => (
          <div key={team.team_id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{team.team_name}</h3>
                <p className="text-sm text-gray-500">{team.team_size} employees</p>
              </div>
              <div className={`text-3xl font-bold ${
                team.health_status === 'excellent' ? 'text-green-600' :
                team.health_status === 'good' ? 'text-blue-600' :
                team.health_status === 'at_risk' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {team.overall_health_score}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <HealthBar label="Talent Quality" score={team.dimensions.talent_quality.score} />
              <HealthBar label="Engagement" score={team.dimensions.engagement.score} />
              <HealthBar label="Development" score={team.dimensions.development.score} />
              <HealthBar label="Succession" score={team.dimensions.succession_readiness.score} />
            </div>

            {team.risks.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <div className="text-xs font-medium text-gray-700 mb-2">Top Risk:</div>
                <div className="text-sm text-red-600">{team.risks[0].risk_type}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function HealthBar({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">{label}</span>
        <span className="text-xs font-medium text-gray-900">{Math.round(score)}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full ${
            score >= 80 ? 'bg-green-500' :
            score >= 60 ? 'bg-blue-500' :
            score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function PipelineView({ analysis }: { analysis: TalentPipelineAnalysis }) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Talent Pipeline Strength</h2>
            <p className="text-sm text-gray-500 mt-1">Succession readiness across the organization</p>
          </div>
          <div className={`px-4 py-2 rounded-lg text-lg font-semibold ${
            analysis.pipeline_strength === 'strong' ? 'bg-green-100 text-green-700' :
            analysis.pipeline_strength === 'adequate' ? 'bg-blue-100 text-blue-700' :
            analysis.pipeline_strength === 'weak' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {analysis.pipeline_strength.toUpperCase()}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-3xl font-bold text-green-700">{analysis.ready_now}</div>
            <div className="text-sm text-green-600 mt-1">Ready Now</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-3xl font-bold text-blue-700">{analysis.ready_1_year}</div>
            <div className="text-sm text-blue-600 mt-1">Ready 1 Year</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-3xl font-bold text-purple-700">{analysis.ready_2_years}</div>
            <div className="text-sm text-purple-600 mt-1">Ready 2 Years</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-3xl font-bold text-gray-700">{analysis.future_potential}</div>
            <div className="text-sm text-gray-600 mt-1">Future Potential</div>
          </div>
        </div>

        {analysis.critical_gaps.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-900 mb-3">Critical Gaps</h3>
            <div className="space-y-2">
              {analysis.critical_gaps.map((gap, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-red-900">{gap.gap_type}</div>
                    <div className="text-sm text-red-700">{gap.description}</div>
                    <div className="text-xs text-red-600 mt-1">
                      Recommended: {gap.recommended_action}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DependencyRiskView({
  risks,
  onNavigate
}: {
  risks: KeyPersonDependencyRisk[];
  onNavigate?: (view: string, employeeId?: string) => void;
}) {
  const criticalRisks = risks.filter(r =>
    r.dependency_risk_level === 'critical' || r.dependency_risk_level === 'high'
  ).sort((a, b) => (b.combined_risk_score || 0) - (a.combined_risk_score || 0));

  return (
    <div className="space-y-6">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-orange-900 mb-2">
          {criticalRisks.length} Key Person Dependencies Identified
        </h2>
        <p className="text-sm text-orange-700">
          These employees represent single points of failure - implement succession plans immediately
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {criticalRisks.map(risk => (
          <div
            key={risk.employee_id}
            className="bg-white border-2 border-orange-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onNavigate?.('employee', risk.employee_id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{risk.employee_name}</h3>
                <p className="text-sm text-gray-500">{risk.title}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                risk.dependency_risk_level === 'critical' ? 'bg-red-100 text-red-700' :
                'bg-orange-100 text-orange-700'
              }`}>
                {risk.dependency_risk_score}
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <RiskFactor
                label="Unique Skills"
                score={risk.criticality_factors.unique_skills.score}
              />
              <RiskFactor
                label="Direct Reports"
                score={risk.criticality_factors.direct_reports.score}
                detail={`${risk.criticality_factors.direct_reports.report_count} reports`}
              />
              <RiskFactor
                label="Knowledge Concentration"
                score={risk.criticality_factors.knowledge_concentration.score}
              />
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Successor readiness:</span>
                <span className={`font-medium ${
                  risk.successor_readiness >= 75 ? 'text-green-600' :
                  risk.successor_readiness >= 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {risk.successor_readiness}%
                </span>
              </div>
              {risk.flight_risk_level && (
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600">Flight risk:</span>
                  <span className={`font-medium ${
                    risk.flight_risk_level === 'critical' ? 'text-red-600' :
                    risk.flight_risk_level === 'high' ? 'text-orange-600' : 'text-yellow-600'
                  }`}>
                    {risk.flight_risk_level.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskFactor({
  label,
  score,
  detail
}: {
  label: string;
  score: number;
  detail?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">{label}</span>
        <span className="text-xs font-medium text-gray-900">
          {Math.round(score)} {detail && <span className="text-gray-500">({detail})</span>}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full ${
            score >= 75 ? 'bg-red-500' :
            score >= 50 ? 'bg-orange-500' : 'bg-yellow-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
