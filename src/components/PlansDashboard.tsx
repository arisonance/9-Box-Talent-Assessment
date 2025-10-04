import { useMemo } from 'react';
import {
  Target, Clock, AlertTriangle, CheckCircle2, TrendingUp,
  Users, DollarSign, Calendar, Award, AlertCircle
} from 'lucide-react';
import type { Employee, Department, EmployeePlan } from '../types';
import { calculatePlanProgress, getOverdueActionItems, getUpcomingActionItems } from '../lib/actionItemGenerator';

interface PlansDashboardProps {
  employees: Employee[];
  departments: Department[];
  employeePlans: Record<string, EmployeePlan>;
  onEmployeeClick?: (employee: Employee) => void;
}

export default function PlansDashboard({
  employees,
  departments,
  employeePlans,
  onEmployeeClick
}: PlansDashboardProps) {
  const stats = useMemo(() => {
    const employeesWithPlans = employees.filter(emp => employeePlans[emp.id]);
    const totalEmployees = employees.filter(emp => emp.assessment).length;
    const totalPlans = employeesWithPlans.length;

    let totalActionItems = 0;
    let completedActions = 0;
    let overdueActions = 0;
    let upcomingActions = 0;
    let totalBudgetAllocated = 0;
    let totalBudgetSpent = 0;

    employeesWithPlans.forEach(emp => {
      const plan = employeePlans[emp.id];
      if (plan) {
        totalActionItems += plan.action_items.length;
        completedActions += plan.action_items.filter(a => a.completed).length;
        overdueActions += getOverdueActionItems(plan.action_items).length;
        upcomingActions += getUpcomingActionItems(plan.action_items).length;
        totalBudgetAllocated += plan.budget_allocated || 0;
        totalBudgetSpent += plan.budget_spent || 0;
      }
    });

    const completionRate = totalActionItems > 0 ? Math.round((completedActions / totalActionItems) * 100) : 0;
    const planCoverage = totalEmployees > 0 ? Math.round((totalPlans / totalEmployees) * 100) : 0;

    return {
      totalEmployees,
      totalPlans,
      planCoverage,
      totalActionItems,
      completedActions,
      completionRate,
      overdueActions,
      upcomingActions,
      totalBudgetAllocated,
      totalBudgetSpent
    };
  }, [employees, employeePlans]);

  // Group employees by plan status
  const employeesByStatus = useMemo(() => {
    const withPlans = employees.filter(emp => emp.assessment && employeePlans[emp.id]);
    const withoutPlans = employees.filter(emp => emp.assessment && !employeePlans[emp.id]);

    // Further categorize those with plans
    const onTrack = withPlans.filter(emp => {
      const plan = employeePlans[emp.id];
      const overdue = getOverdueActionItems(plan.action_items);
      const progress = calculatePlanProgress(plan.action_items);
      return overdue.length === 0 && progress >= 50;
    });

    const atRisk = withPlans.filter(emp => {
      const plan = employeePlans[emp.id];
      const overdue = getOverdueActionItems(plan.action_items);
      const progress = calculatePlanProgress(plan.action_items);
      return overdue.length > 0 || (progress < 50 && overdue.length === 0);
    });

    const completed = withPlans.filter(emp => {
      const plan = employeePlans[emp.id];
      const progress = calculatePlanProgress(plan.action_items);
      return progress === 100;
    });

    return {
      onTrack,
      atRisk,
      completed,
      withoutPlans
    };
  }, [employees, employeePlans]);

  const StatCard = ({ icon: Icon, label, value, subtitle, color, trend }: any) => (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 text-xs font-semibold ${
            trend > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className={`w-4 h-4 ${trend < 0 ? 'rotate-180' : ''}`} />
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );

  const EmployeeList = ({ employees: emps, title, color, emptyMessage }: any) => (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-3">{title}</h3>
      {emps.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-2">
          {emps.map((emp: Employee) => {
            const dept = departments.find(d => d.id === emp.department_id);
            const plan = employeePlans[emp.id];
            const progress = plan ? calculatePlanProgress(plan.action_items) : 0;
            const overdue = plan ? getOverdueActionItems(plan.action_items).length : 0;

            return (
              <button
                key={emp.id}
                onClick={() => onEmployeeClick?.(emp)}
                className="w-full text-left p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: dept?.color || '#6B7280' }}
                    >
                      {emp.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{emp.name}</p>
                      <p className="text-sm text-gray-600">{emp.title || 'Employee'}</p>
                      {dept && (
                        <p className="text-xs text-gray-500">{dept.name}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    {plan && (
                      <>
                        <div className="flex items-center space-x-2 justify-end">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                progress === 100 ? 'bg-green-500' :
                                progress >= 50 ? 'bg-blue-500' :
                                'bg-yellow-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-700">{progress}%</span>
                        </div>
                        {overdue > 0 && (
                          <div className="flex items-center space-x-1 text-xs text-red-600 font-semibold">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{overdue} overdue</span>
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {plan.action_items.filter(a => a.completed).length}/{plan.action_items.length} actions
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Development Plans Dashboard</h1>
        <p className="text-gray-600">Track progress, accountability, and investment across all employee development plans</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Target}
          label="Plan Coverage"
          value={`${stats.planCoverage}%`}
          subtitle={`${stats.totalPlans} of ${stats.totalEmployees} employees have plans`}
          color="bg-blue-600"
        />

        <StatCard
          icon={CheckCircle2}
          label="Action Completion"
          value={`${stats.completionRate}%`}
          subtitle={`${stats.completedActions} of ${stats.totalActionItems} actions completed`}
          color="bg-green-600"
        />

        <StatCard
          icon={AlertTriangle}
          label="Overdue Actions"
          value={stats.overdueActions}
          subtitle={stats.overdueActions > 0 ? 'Require immediate attention' : 'No overdue items'}
          color={stats.overdueActions > 0 ? 'bg-red-600' : 'bg-gray-600'}
        />

        <StatCard
          icon={Clock}
          label="Upcoming (7 days)"
          value={stats.upcomingActions}
          subtitle="Actions due soon"
          color="bg-yellow-600"
        />
      </div>

      {/* Budget Overview (if any budgets are set) */}
      {stats.totalBudgetAllocated > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-600 rounded-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Development Budget</h3>
                <p className="text-sm text-gray-600">Total investment in employee development</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                ${stats.totalBudgetSpent.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                of ${stats.totalBudgetAllocated.toLocaleString()} allocated
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Budget Utilization</span>
              <span className="font-bold text-gray-900">
                {stats.totalBudgetAllocated > 0 ? Math.round((stats.totalBudgetSpent / stats.totalBudgetAllocated) * 100) : 0}%
              </span>
            </div>
            <div className="h-3 bg-white rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{
                  width: `${stats.totalBudgetAllocated > 0 ? Math.min((stats.totalBudgetSpent / stats.totalBudgetAllocated) * 100, 100) : 0}%`
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Alert Banner for Overdue Items */}
      {stats.overdueActions > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-red-900 mb-1">
                {stats.overdueActions} Overdue Action Items Require Attention
              </h3>
              <p className="text-sm text-red-700">
                Review the "At Risk" section below and work with managers to get these items back on track.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Warning for Low Coverage */}
      {stats.planCoverage < 50 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-yellow-900 mb-1">
                Low Development Plan Coverage ({stats.planCoverage}%)
              </h3>
              <p className="text-sm text-yellow-700">
                {employeesByStatus.withoutPlans.length} assessed employees don't have development plans yet. Consider creating plans for all employees in your 9-box grid.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Employee Lists by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* At Risk */}
        <div className="bg-red-50 rounded-xl border-2 border-red-200 p-6">
          <EmployeeList
            employees={employeesByStatus.atRisk}
            title="⚠️ At Risk"
            color="red"
            emptyMessage="✅ No employees at risk - great job!"
          />
        </div>

        {/* Without Plans */}
        <div className="bg-orange-50 rounded-xl border-2 border-orange-200 p-6">
          <EmployeeList
            employees={employeesByStatus.withoutPlans}
            title="📋 Need Development Plans"
            color="orange"
            emptyMessage="✅ All assessed employees have plans!"
          />
        </div>

        {/* On Track */}
        <div className="bg-blue-50 rounded-xl border-2 border-blue-200 p-6">
          <EmployeeList
            employees={employeesByStatus.onTrack}
            title="🎯 On Track"
            color="blue"
            emptyMessage="No employees on track yet"
          />
        </div>

        {/* Completed */}
        <div className="bg-green-50 rounded-xl border-2 border-green-200 p-6">
          <EmployeeList
            employees={employeesByStatus.completed}
            title="✅ Completed"
            color="green"
            emptyMessage="No completed plans yet"
          />
        </div>
      </div>
    </div>
  );
}
