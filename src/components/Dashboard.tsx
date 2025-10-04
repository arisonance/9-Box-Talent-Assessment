import { useState, useEffect, useMemo, useCallback } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { ClipboardList, Grid3X3, GitBranch, TrendingUp, LogOut, Sparkles, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User, Organization, Employee, Department, EmployeePlan, Performance, Potential } from '../types';
import NineBoxGrid from './NineBoxGrid';
import DepartmentSelector from './DepartmentSelector';
import ReviewParserModal from './ReviewParserModal';
import PeopleDashboard from './PeopleDashboard';
import CalibrationDashboard from './CalibrationDashboard';
import DevelopmentDashboard from './DevelopmentDashboard';
import AdminDashboardEnhanced from './admin/AdminDashboardEnhanced';
import Feedback360Dashboard from './Feedback360Dashboard';
import { NavigationTabs, useToast } from './unified';
import type { PerformanceReview } from './PerformanceReviewModal';

interface DashboardProps {
  user: SupabaseUser;
  userProfile: User;
  organization: Organization;
}

type View = 'prepare' | 'evaluate' | 'calibrate' | 'follow' | 'admin';

export default function Dashboard({
  user: _user,
  userProfile,
  organization,
}: DashboardProps) {
  const { notify } = useToast();
  const [currentView, setCurrentView] = useState<View>('evaluate');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [isReviewParserOpen, setIsReviewParserOpen] = useState(false);
  const [employeePlans, setEmployeePlans] = useState<Record<string, EmployeePlan>>({});
  const [performanceReviews, setPerformanceReviews] = useState<Record<string, { self?: PerformanceReview; manager?: PerformanceReview }>>({});

  const totalEmployees = employees.length;
  const assessedEmployees = useMemo(() => employees.filter(emp => Boolean(emp.assessment)), [employees]);
  const unassessedCount = totalEmployees - assessedEmployees.length;

  const reviewMetrics = useMemo(() => {
    let pendingSelf = 0;
    let pendingManager = 0;
    let misaligned = 0;

    const scoreForSummary: Record<string, number> = {
      excellence: 5,
      exceeds: 4,
      meets: 3,
      occasionally_meets: 2,
      not_performing: 1,
    };

    const normalizeSelfScore = (review?: PerformanceReview) => {
      if (!review) return null;
      const avg = (review.humble_score + review.hungry_score + review.smart_score) / 3;
      return Math.round(avg);
    };

    employees.forEach(emp => {
      const record = performanceReviews[emp.id] || {};
      const managerReview = record.manager;
      const selfReview = record.self;

      if (!selfReview || (selfReview.status !== 'submitted' && selfReview.status !== 'completed')) {
        pendingSelf += 1;
      }

      if (!managerReview || managerReview.status !== 'completed') {
        pendingManager += 1;
      }

      if (
        managerReview &&
        managerReview.status === 'completed' &&
        selfReview &&
        (selfReview.status === 'submitted' || selfReview.status === 'completed')
      ) {
        const managerScore = managerReview.manager_performance_summary ? scoreForSummary[managerReview.manager_performance_summary] ?? null : null;
        const selfScore = normalizeSelfScore(selfReview);

        if (managerScore !== null && selfScore !== null && Math.abs(managerScore - selfScore) >= 1) {
          misaligned += 1;
        }
      }
    });

    return {
      pendingSelf,
      pendingManager,
      misaligned,
      totalPending: pendingSelf + pendingManager,
    };
  }, [employees, performanceReviews]);

  const planMetrics = useMemo(() => {
    const assessedIds = new Set(assessedEmployees.map(emp => emp.id));
    let missingPlans = 0;
    let overdueActions = 0;

    employees.forEach(emp => {
      if (!assessedIds.has(emp.id)) return;
      const plan = employeePlans[emp.id];
      if (!plan) {
        missingPlans += 1;
        return;
      }

      const items = plan.action_items || [];
      overdueActions += items.filter(item => item.status === 'overdue').length;
    });

    const pendingAck = employees.reduce((count, emp) => {
      const notes = emp.manager_notes || [];
      return count + notes.filter(note => note.requires_acknowledgment && !note.acknowledged_at).length;
    }, 0);

    return {
      missingPlans,
      overdueActions,
      pendingAck,
      totalFollowThrough: missingPlans + overdueActions + pendingAck,
    };
  }, [employees, assessedEmployees, employeePlans]);

  const handleReviewSave = (review: PerformanceReview) => {
    setPerformanceReviews(prev => {
      const existing = prev[review.employee_id] || {};
      const updatedForEmployee = {
        ...existing,
        [review.review_type]: review,
      };
      return {
        ...prev,
        [review.employee_id]: updatedForEmployee,
      };
    });
  };

  const handleJumpToPrepare = (departmentId?: string) => {
    if (departmentId) {
      setSelectedDepartments([departmentId]);
    } else {
      setSelectedDepartments([]);
    }
    setCurrentView('prepare');
  };

  const handleJumpToEvaluate = (departmentId?: string) => {
    if (departmentId) {
      setSelectedDepartments([departmentId]);
    } else {
      setSelectedDepartments([]);
    }
    setCurrentView('evaluate');
  };

  const handleJumpToFollowThrough = (departmentId?: string) => {
    if (departmentId) {
      setSelectedDepartments([departmentId]);
    } else {
      setSelectedDepartments([]);
    }
    setCurrentView('follow');
  };

  const loadEmployees = useCallback(async (): Promise<void> => {
    if (!organization?.id) return;

    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        department:departments(*),
        assessment:assessments(*)
      `)
      .eq('organization_id', organization.id);

    if (error) {
      console.error('Error loading employees:', error);
      notify({
        title: 'Unable to load team members',
        description: 'Check your connection or Supabase credentials and try again.',
        variant: 'error'
      });
      return;
    }

    setEmployees(data || []);
  }, [organization?.id, notify]);

  const loadDepartments = useCallback(async (): Promise<void> => {
    if (!organization?.id) return;

    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('organization_id', organization.id)
      .order('name');

    if (error) {
      console.error('Error loading departments:', error);
      notify({
        title: 'Unable to load departments',
        description: 'Department data could not be retrieved. Please refresh.',
        variant: 'error'
      });
      return;
    }

    setDepartments(data || []);
  }, [organization?.id, notify]);

  const loadData = useCallback(async (): Promise<void> => {
    if (!organization?.id) return;

    setLoading(true);
    try {
      await Promise.all([loadEmployees(), loadDepartments()]);
    } catch (error) {
      console.error('Error loading data:', error);
      notify({
        title: 'Data refresh failed',
        description: 'We could not load the latest employee information. Please retry.',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [organization?.id, loadEmployees, loadDepartments, notify]);

  useEffect(() => {
    if (!organization?.id) return;
    loadData();
  }, [organization?.id, loadData]);

  const handleSignOut = () => {
    // Reload page to reset to database mode
    window.location.reload();
  };

  const handleEmployeeFromReview = async (
    employeeData: Pick<Employee, 'name' | 'email' | 'department_id' | 'title'>,
    suggestedPlacement: { performance: Performance; potential: Potential },
    plan: EmployeePlan
  ): Promise<void> => {
    // Calculate box_key from performance and potential
    const box_key = `${suggestedPlacement.performance === 'high' ? 3 : suggestedPlacement.performance === 'medium' ? 2 : 1}-${suggestedPlacement.potential === 'high' ? 3 : suggestedPlacement.potential === 'medium' ? 2 : 1}`;

    try {
      // Insert employee
      const { data: insertedEmployee, error: employeeError } = await supabase
        .from('employees')
        .insert({
          organization_id: organization.id,
          employee_id: `E${String(employees.length + 1).padStart(3, '0')}`,
          name: employeeData.name,
          email: employeeData.email || null,
          department_id: employeeData.department_id || null,
          title: employeeData.title || null
        })
        .select()
        .single();

      if (employeeError) throw employeeError;

      // Insert assessment
      const { error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          organization_id: organization.id,
          employee_id: insertedEmployee.id,
          performance: suggestedPlacement.performance,
          potential: suggestedPlacement.potential,
          box_key: box_key
        });

      if (assessmentError) throw assessmentError;

      // Store the AI-generated plan using the real employee ID
      setEmployeePlans(prev => ({
        ...prev,
        [insertedEmployee.id]: {
          ...plan,
          id: `plan-${insertedEmployee.id}`,
          employee_id: insertedEmployee.id,
          created_by: userProfile.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }));

      // Reload employees to get the new one with all relationships
      await loadEmployees();

      // Show success message
      notify({
        title: `${employeeData.name} added to the grid`,
        description: [
          'Personalized ' + plan.plan_type.replace('_', ' ') + ' plan generated.',
          `${plan.objectives.length} objectives · ${plan.action_items.length} actions · ${plan.success_metrics.length} success metrics.`,
          'Open their card to review next steps.'
        ].join('\n'),
        variant: 'success',
      });

    } catch (error) {
      console.error('Error creating employee:', error);
      notify({
        title: 'Employee creation failed',
        description: 'We could not save this employee. Please try again.',
        variant: 'error',
      });
      return;
    }

      setCurrentView('evaluate');
  };

  const employeesInScope = useMemo(() => {
    if (selectedDepartments.length === 0) return employees;
    return employees.filter(emp => emp.department_id && selectedDepartments.includes(emp.department_id));
  }, [employees, selectedDepartments]);

  const scopedDepartments = useMemo(() => {
    if (selectedDepartments.length === 0) return departments;
    return departments.filter(dept => selectedDepartments.includes(dept.id));
  }, [departments, selectedDepartments]);

  const filteredEmployees = selectedDepartments.length > 0 
    ? employees.filter(emp => emp.department_id && selectedDepartments.includes(emp.department_id))
    : employees;


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900">
                {organization.name}
              </h1>
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                Talent Assessment
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Single Primary Action */}
              <button
                onClick={() => setIsReviewParserOpen(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Add Employee</span>
              </button>

              {/* Secondary Actions */}
              <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
                <span className="text-sm text-gray-600">
                  {userProfile.full_name || userProfile.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="btn-icon"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <NavigationTabs
            tabs={[
              {
                id: 'prepare',
                label: 'Prepare',
                icon: ClipboardList,
                count: reviewMetrics.totalPending || undefined,
                badge: (reviewMetrics.pendingSelf + reviewMetrics.pendingManager) > 0 ? (
                  <span className="ml-1 text-[10px] text-amber-600">
                    {reviewMetrics.pendingSelf} self · {reviewMetrics.pendingManager} manager
                  </span>
                ) : undefined,
              },
              {
                id: 'evaluate',
                label: 'Evaluate',
                icon: Grid3X3,
                count: unassessedCount || undefined,
                badge: assessedEmployees.length > 0 ? (
                  <span className="ml-1 text-[10px] text-gray-500">
                    {assessedEmployees.length}/{totalEmployees} assessed
                  </span>
                ) : undefined,
              },
              {
                id: 'calibrate',
                label: 'Calibrate',
                icon: GitBranch,
                count: reviewMetrics.misaligned || undefined,
                badge: reviewMetrics.misaligned > 0 ? (
                  <span className="ml-1 text-[10px] text-rose-600">Alignment needed</span>
                ) : undefined,
              },
              {
                id: 'follow',
                label: 'Follow Through',
                icon: TrendingUp,
                count: planMetrics.totalFollowThrough || undefined,
                badge: planMetrics.totalFollowThrough > 0 ? (
                  <span className="ml-1 text-[10px] text-blue-600">
                    {planMetrics.missingPlans} plans · {planMetrics.pendingAck} acks
                  </span>
                ) : undefined,
              },
              { id: 'admin', label: 'Admin', icon: Settings },
            ]}
            activeTab={currentView}
            onTabChange={(tabId) => setCurrentView(tabId as View)}
          />
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-6 py-8">
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-3 text-sm text-gray-600">Loading...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* Department Selector */}
            {departments.length > 0 && currentView === 'evaluate' && (
              <div className="mb-6">
                <DepartmentSelector
                  departments={departments}
                  employees={employees}
                  selectedDepartments={selectedDepartments}
                  onSelectionChange={setSelectedDepartments}
                />
              </div>
            )}

            {/* Content Views */}
            {currentView === 'evaluate' && (
              <NineBoxGrid
                employees={filteredEmployees}
                departments={departments}
                onEmployeeUpdate={loadEmployees}
                userRole={userProfile.role}
                selectedDepartments={selectedDepartments}
                initialPlans={employeePlans}
                onPlansUpdate={setEmployeePlans}
                organizationId={organization.id}
                performanceReviews={performanceReviews}
                onReviewSave={handleReviewSave}
              />
            )}

            {currentView === 'prepare' && (
              <PeopleDashboard
                employees={employeesInScope}
                departments={scopedDepartments}
                onEmployeeUpdate={loadEmployees}
                userRole={userProfile.role}
                employeePlans={employeePlans}
                onPlansUpdate={setEmployeePlans}
                currentUserName={userProfile.full_name || userProfile.email}
                performanceReviews={performanceReviews}
                onReviewSave={handleReviewSave}
                organizationId={organization.id}
                activeDepartmentIds={selectedDepartments}
              />
            )}

            {currentView === 'calibrate' && (
              <CalibrationDashboard
                employees={employees}
                departments={departments}
                employeePlans={employeePlans}
                performanceReviews={performanceReviews}
                reviewMetrics={reviewMetrics}
                planMetrics={planMetrics}
                unassessedCount={unassessedCount}
                onJumpToPrepare={handleJumpToPrepare}
                onJumpToEvaluate={handleJumpToEvaluate}
                onJumpToFollowThrough={handleJumpToFollowThrough}
              />
            )}

            {currentView === 'follow' && (
              <div className="space-y-6">
                <DevelopmentDashboard
                  employees={employeesInScope}
                  departments={scopedDepartments}
                  employeePlans={employeePlans}
                  onEmployeeClick={(employee) => handleJumpToEvaluate(employee.department_id ?? undefined)}
                  activeDepartmentIds={selectedDepartments}
                />

                <Feedback360Dashboard
                  employees={employeesInScope}
                  departments={scopedDepartments}
                  organizationId={organization.id}
                  currentUserName={userProfile.full_name || userProfile.email}
                />
              </div>
            )}

            {currentView === 'admin' && (
              <AdminDashboardEnhanced
                departments={departments}
                onDepartmentUpdate={loadDepartments}
                userRole={userProfile.role}
                organizationId={organization.id}
                employees={employees}
                employeePlans={employeePlans}
                onPlansUpdate={setEmployeePlans}
                onImportComplete={() => {
                  loadEmployees();
                  handleJumpToPrepare();
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Review Parser Modal */}
      <ReviewParserModal
        isOpen={isReviewParserOpen}
        onClose={() => setIsReviewParserOpen(false)}
        departments={departments}
        onEmployeeCreated={handleEmployeeFromReview}
      />
    </div>
  );
}
