import { useState, useEffect } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { FileText, LogOut, Sparkles, Target, MessageSquare, Users, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User, Organization, Employee, Department } from '../types';
import NineBoxGrid from './NineBoxGrid';
import DepartmentSelector from './DepartmentSelector';
import ReviewParserModal from './ReviewParserModal';
import PeopleDashboard from './PeopleDashboard';
import DevelopmentDashboard from './DevelopmentDashboard';
import AdminDashboard from './AdminDashboard';
import AdminDashboardEnhanced from './admin/AdminDashboardEnhanced';
import Feedback360Dashboard from './Feedback360Dashboard';
import { NavigationTabs } from './unified';
import type { PerformanceReview } from './PerformanceReviewModal';

interface DashboardProps {
  user: SupabaseUser;
  userProfile: User;
  organization: Organization;
}

type View = 'grid' | 'people' | 'development' | 'feedback' | 'admin';

export default function Dashboard({ 
  user, 
  userProfile, 
  organization
}: DashboardProps) {
  const [currentView, setCurrentView] = useState<View>('grid');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [isReviewParserOpen, setIsReviewParserOpen] = useState(false);
  const [employeePlans, setEmployeePlans] = useState<Record<string, any>>({});
  const [performanceReviews, setPerformanceReviews] = useState<Record<string, { self?: PerformanceReview; manager?: PerformanceReview }>>({});

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

  useEffect(() => {
    if (organization) {
      loadData();
    }
  }, [organization]);

  const loadData = async () => {
    if (!organization) return;

    setLoading(true);
    try {
      await Promise.all([loadEmployees(), loadDepartments()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    if (!organization) return;

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
      return;
    }

    setEmployees(data || []);
  };

  const loadDepartments = async () => {
    if (!organization) return;

    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('organization_id', organization.id)
      .order('name');

    if (error) {
      console.error('Error loading departments:', error);
      return;
    }

    setDepartments(data || []);
  };

  const handleSignOut = () => {
    // Reload page to reset to database mode
    window.location.reload();
  };

  const handleEmployeeFromReview = async (
    employeeData: any,
    suggestedPlacement: { performance: any; potential: any },
    plan: any
  ) => {
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
          updated_at: new Date().toISOString()
        }
      }));

      // Reload employees to get the new one with all relationships
      await loadEmployees();

      // Show success message
      setTimeout(() => {
        alert(`✅ Employee "${employeeData.name}" created and placed in the 9-box!\n\n📋 Their personalized ${plan.plan_type.replace('_', ' ')} plan has been generated with:\n• ${plan.objectives.length} specific objectives\n• ${plan.action_items.length} action items\n• ${plan.success_metrics.length} success metrics\n\n💡 Click their card to view the full plan!`);
      }, 500);

    } catch (error) {
      console.error('Error creating employee:', error);
      alert('Failed to create employee. Please try again.');
      return;
    }

    setCurrentView('grid');
  };

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
              { id: 'grid', label: '9-Box Grid', icon: FileText },
              { id: 'people', label: 'People', icon: Users },
              { id: 'development', label: 'Development', icon: Target },
              { id: 'feedback', label: 'Feedback', icon: MessageSquare },
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
            {departments.length > 0 && currentView === 'grid' && (
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
            {currentView === 'grid' && (
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

            {currentView === 'people' && (
              <PeopleDashboard
                employees={employees}
                departments={departments}
                onEmployeeUpdate={loadEmployees}
                userRole={userProfile.role}
                employeePlans={employeePlans}
                onPlansUpdate={setEmployeePlans}
                currentUserName={userProfile.full_name || userProfile.email}
                performanceReviews={performanceReviews}
                onReviewSave={handleReviewSave}
                organizationId={organization.id}
              />
            )}

            {currentView === 'development' && (
              <DevelopmentDashboard
                employees={employees}
                departments={departments}
                employeePlans={employeePlans}
                onEmployeeClick={() => setCurrentView('grid')}
              />
            )}

            {currentView === 'feedback' && (
              <Feedback360Dashboard
                employees={employees}
                departments={departments}
                organizationId={organization.id}
                currentUserName={userProfile.full_name || userProfile.email}
              />
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
                  setCurrentView('people');
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
