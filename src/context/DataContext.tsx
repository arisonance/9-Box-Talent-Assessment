import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type {
  Employee,
  Department,
  EmployeePlan,
  Assessment,
  OneOnOneMeeting
} from '../types';
import type { PerformanceReview } from '../components/PerformanceReviewModal';
import { useTalentApp } from './TalentAppContext';

// ============================================
// TYPES
// ============================================

export interface Survey360 {
  id: string;
  employee_id: string;
  organization_id: string;
  status: 'draft' | 'sent' | 'completed' | 'cancelled';
  created_at: string;
  completed_at?: string;
  responses?: any[];
  summary?: {
    strengths: string[];
    development_areas: string[];
    themes: string[];
  };
}

export interface ManagerNote {
  id: string;
  employee_id: string;
  organization_id: string;
  note: string;
  category?: string;
  is_private: boolean;
  created_at: string;
  created_by: string;
}

export interface PIP {
  id: string;
  employee_id: string;
  organization_id: string;
  status: 'active' | 'completed' | 'cancelled';
  start_date: string;
  end_date: string;
  goals: any[];
  created_at: string;
}

export interface SuccessionCandidate {
  id: string;
  role_id: string;
  employee_id: string;
  organization_id: string;
  readiness: 'ready_now' | 'ready_1_year' | 'ready_2_years';
  development_focus?: string[];
  created_at: string;
}

interface DataContextValue {
  // Core data
  employees: Employee[];
  departments: Department[];
  employeePlans: Record<string, EmployeePlan>;
  performanceReviews: Record<string, { self?: PerformanceReview; manager?: PerformanceReview }>;
  surveys360: Survey360[];
  managerNotes: Record<string, ManagerNote[]>;
  oneOnOnes: Record<string, OneOnOneMeeting[]>;
  pips: Record<string, PIP>;
  successionCandidates: SuccessionCandidate[];

  // Loading states
  loading: boolean;
  refreshing: boolean;

  // CRUD operations
  refreshAll: () => Promise<void>;
  refreshEmployees: () => Promise<void>;
  refreshPlans: () => Promise<void>;
  refreshReviews: () => Promise<void>;
  refresh360: () => Promise<void>;

  // Employee operations
  updateEmployee: (employeeId: string, updates: Partial<Employee>) => Promise<void>;
  updateAssessment: (employeeId: string, assessment: Partial<Assessment>) => Promise<void>;

  // Plan operations
  createPlan: (employeeId: string, plan: Omit<EmployeePlan, 'id' | 'created_at'>) => Promise<EmployeePlan>;
  updatePlan: (planId: string, updates: Partial<EmployeePlan>) => Promise<void>;
  deletePlan: (planId: string) => Promise<void>;

  // Review operations
  createReview: (employeeId: string, review: Omit<PerformanceReview, 'id' | 'created_at'>) => Promise<void>;
  updateReview: (reviewId: string, updates: Partial<PerformanceReview>) => Promise<void>;

  // 360 operations
  create360Survey: (employeeId: string, survey: Partial<Survey360>) => Promise<Survey360>;
  update360Survey: (surveyId: string, updates: Partial<Survey360>) => Promise<void>;

  // Computed data
  getEmployeeById: (id: string) => Employee | undefined;
  getEmployeesWithoutPlans: () => Employee[];
  getEmployeesWithoutReviews: () => Employee[];
  getEmployeesAtFlightRisk: () => Employee[];
  getHighPerformersWithoutSuccession: () => Employee[];
}

const DataContext = createContext<DataContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

export function DataProvider({
  children,
  organizationId
}: {
  children: ReactNode;
  organizationId: string;
}) {
  const { notify } = useTalentApp();

  // Core state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employeePlans, setEmployeePlans] = useState<Record<string, EmployeePlan>>({});
  const [performanceReviews, setPerformanceReviews] = useState<Record<string, { self?: PerformanceReview; manager?: PerformanceReview }>>({});
  const [surveys360, setSurveys360] = useState<Survey360[]>([]);
  const [managerNotes, setManagerNotes] = useState<Record<string, ManagerNote[]>>({});
  const [oneOnOnes, setOneOnOnes] = useState<Record<string, OneOnOneMeeting[]>>({});
  const [pips, setPips] = useState<Record<string, PIP>>({});
  const [successionCandidates, setSuccessionCandidates] = useState<SuccessionCandidate[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ============================================
  // LOAD FUNCTIONS
  // ============================================

  const loadEmployees = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(*)
        `)
        .eq('organization_id', organizationId)
        .order('name');

      if (error) throw error;

      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      notify({
        variant: 'error',
        title: 'Failed to load employees',
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [organizationId, notify]);

  const loadDepartments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  }, [organizationId]);

  const loadPlans = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('employee_plans')
        .select('*')
        .eq('organization_id', organizationId);

      if (error) throw error;

      const plansMap: Record<string, EmployeePlan> = {};
      (data || []).forEach(plan => {
        plansMap[plan.employee_id] = plan;
      });
      setEmployeePlans(plansMap);
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  }, [organizationId]);

  const loadReviews = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('performance_reviews')
        .select('*')
        .eq('organization_id', organizationId);

      if (error) throw error;

      const reviewsMap: Record<string, { self?: PerformanceReview; manager?: PerformanceReview }> = {};
      (data || []).forEach((review: any) => {
        if (!reviewsMap[review.employee_id]) {
          reviewsMap[review.employee_id] = {};
        }
        if (review.review_type === 'self') {
          reviewsMap[review.employee_id].self = review;
        } else if (review.review_type === 'manager') {
          reviewsMap[review.employee_id].manager = review;
        }
      });
      setPerformanceReviews(reviewsMap);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  }, [organizationId]);

  const load360Surveys = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('surveys_360')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSurveys360(data || []);
    } catch (error) {
      console.error('Error loading 360 surveys:', error);
    }
  }, [organizationId]);

  const loadManagerNotes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('manager_notes')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const notesMap: Record<string, ManagerNote[]> = {};
      (data || []).forEach(note => {
        if (!notesMap[note.employee_id]) {
          notesMap[note.employee_id] = [];
        }
        notesMap[note.employee_id].push(note);
      });
      setManagerNotes(notesMap);
    } catch (error) {
      console.error('Error loading manager notes:', error);
    }
  }, [organizationId]);

  const loadOneOnOnes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('one_on_one_meetings')
        .select('*')
        .eq('organization_id', organizationId)
        .order('meeting_date', { ascending: false });

      if (error) throw error;

      const meetingsMap: Record<string, OneOnOneMeeting[]> = {};
      (data || []).forEach(meeting => {
        if (!meetingsMap[meeting.employee_id]) {
          meetingsMap[meeting.employee_id] = [];
        }
        meetingsMap[meeting.employee_id].push(meeting);
      });
      setOneOnOnes(meetingsMap);
    } catch (error) {
      console.error('Error loading 1-on-1s:', error);
    }
  }, [organizationId]);

  const loadPIPs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('performance_improvement_plans')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'active');

      if (error) throw error;

      const pipsMap: Record<string, PIP> = {};
      (data || []).forEach(pip => {
        pipsMap[pip.employee_id] = pip;
      });
      setPips(pipsMap);
    } catch (error) {
      console.error('Error loading PIPs:', error);
    }
  }, [organizationId]);

  const loadSuccessionCandidates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('succession_candidates')
        .select('*')
        .eq('organization_id', organizationId);

      if (error) throw error;
      setSuccessionCandidates(data || []);
    } catch (error) {
      console.error('Error loading succession candidates:', error);
    }
  }, [organizationId]);

  // ============================================
  // REFRESH FUNCTIONS
  // ============================================

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadEmployees(),
        loadDepartments(),
        loadPlans(),
        loadReviews(),
        load360Surveys(),
        loadManagerNotes(),
        loadOneOnOnes(),
        loadPIPs(),
        loadSuccessionCandidates(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [
    loadEmployees,
    loadDepartments,
    loadPlans,
    loadReviews,
    load360Surveys,
    loadManagerNotes,
    loadOneOnOnes,
    loadPIPs,
    loadSuccessionCandidates,
  ]);

  const refreshEmployees = loadEmployees;
  const refreshPlans = loadPlans;
  const refreshReviews = loadReviews;
  const refresh360 = load360Surveys;

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await refreshAll();
      setLoading(false);
    };
    init();
  }, [refreshAll]);

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  const updateEmployee = useCallback(async (employeeId: string, updates: Partial<Employee>) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', employeeId);

      if (error) throw error;

      // Optimistically update local state
      setEmployees(prev =>
        prev.map(emp => emp.id === employeeId ? { ...emp, ...updates } : emp)
      );

      notify({
        variant: 'success',
        title: 'Employee updated',
        description: 'Changes saved successfully'
      });

      // Refresh to get full data
      await loadEmployees();
    } catch (error) {
      console.error('Error updating employee:', error);
      notify({
        variant: 'error',
        title: 'Failed to update employee',
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }, [loadEmployees, notify]);

  const updateAssessment = useCallback(async (employeeId: string, assessment: Partial<Assessment>) => {
    try {
      const employee = employees.find(e => e.id === employeeId);
      if (!employee) throw new Error('Employee not found');

      const updatedAssessment = { ...employee.assessment, ...assessment };

      const { error } = await supabase
        .from('employees')
        .update({ assessment: updatedAssessment })
        .eq('id', employeeId);

      if (error) throw error;

      // Optimistically update
      setEmployees(prev =>
        prev.map(emp =>
          emp.id === employeeId
            ? { ...emp, assessment: updatedAssessment }
            : emp
        )
      );

      await loadEmployees();
    } catch (error) {
      console.error('Error updating assessment:', error);
      throw error;
    }
  }, [employees, loadEmployees]);

  const createPlan = useCallback(async (
    employeeId: string,
    plan: Omit<EmployeePlan, 'id' | 'created_at'>
  ): Promise<EmployeePlan> => {
    try {
      const { data, error } = await supabase
        .from('employee_plans')
        .insert({
          ...plan,
          employee_id: employeeId,
          organization_id: organizationId,
        })
        .select()
        .single();

      if (error) throw error;

      await loadPlans();

      notify({
        variant: 'success',
        title: 'Development plan created',
        description: `Plan created for ${employees.find(e => e.id === employeeId)?.name}`
      });

      return data;
    } catch (error) {
      console.error('Error creating plan:', error);
      notify({
        variant: 'error',
        title: 'Failed to create plan',
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }, [organizationId, loadPlans, notify, employees]);

  const updatePlan = useCallback(async (planId: string, updates: Partial<EmployeePlan>) => {
    try {
      const { error } = await supabase
        .from('employee_plans')
        .update(updates)
        .eq('id', planId);

      if (error) throw error;

      await loadPlans();

      notify({
        variant: 'success',
        title: 'Plan updated',
        description: 'Changes saved successfully'
      });
    } catch (error) {
      console.error('Error updating plan:', error);
      throw error;
    }
  }, [loadPlans, notify]);

  const deletePlan = useCallback(async (planId: string) => {
    try {
      const { error } = await supabase
        .from('employee_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      await loadPlans();

      notify({
        variant: 'success',
        title: 'Plan deleted'
      });
    } catch (error) {
      console.error('Error deleting plan:', error);
      throw error;
    }
  }, [loadPlans, notify]);

  const createReview = useCallback(async (
    employeeId: string,
    review: Omit<PerformanceReview, 'id' | 'created_at'>
  ) => {
    try {
      const { error } = await supabase
        .from('performance_reviews')
        .insert({
          ...review,
          employee_id: employeeId,
          organization_id: organizationId,
        });

      if (error) throw error;

      await loadReviews();

      notify({
        variant: 'success',
        title: 'Review saved',
        description: `${review.review_type === 'self' ? 'Self' : 'Manager'} review saved`
      });
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  }, [organizationId, loadReviews, notify]);

  const updateReview = useCallback(async (reviewId: string, updates: Partial<PerformanceReview>) => {
    try {
      const { error } = await supabase
        .from('performance_reviews')
        .update(updates)
        .eq('id', reviewId);

      if (error) throw error;

      await loadReviews();

      notify({
        variant: 'success',
        title: 'Review updated'
      });
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  }, [loadReviews, notify]);

  const create360Survey = useCallback(async (
    employeeId: string,
    survey: Partial<Survey360>
  ): Promise<Survey360> => {
    try {
      const { data, error } = await supabase
        .from('surveys_360')
        .insert({
          ...survey,
          employee_id: employeeId,
          organization_id: organizationId,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;

      await load360Surveys();

      notify({
        variant: 'success',
        title: '360 survey created'
      });

      return data;
    } catch (error) {
      console.error('Error creating 360 survey:', error);
      throw error;
    }
  }, [organizationId, load360Surveys, notify]);

  const update360Survey = useCallback(async (surveyId: string, updates: Partial<Survey360>) => {
    try {
      const { error } = await supabase
        .from('surveys_360')
        .update(updates)
        .eq('id', surveyId);

      if (error) throw error;

      await load360Surveys();
    } catch (error) {
      console.error('Error updating 360 survey:', error);
      throw error;
    }
  }, [load360Surveys]);

  // ============================================
  // COMPUTED DATA
  // ============================================

  const getEmployeeById = useCallback((id: string) => {
    return employees.find(emp => emp.id === id);
  }, [employees]);

  const getEmployeesWithoutPlans = useCallback(() => {
    return employees.filter(emp =>
      emp.assessment && !employeePlans[emp.id]
    );
  }, [employees, employeePlans]);

  const getEmployeesWithoutReviews = useCallback(() => {
    return employees.filter(emp =>
      !performanceReviews[emp.id]?.manager
    );
  }, [employees, performanceReviews]);

  const getEmployeesAtFlightRisk = useCallback(() => {
    return employees.filter(emp => {
      // High performer without recent 1-on-1
      const is1on1Overdue = !oneOnOnes[emp.id]?.length ||
        (new Date().getTime() - new Date(oneOnOnes[emp.id][0]?.meeting_date || 0).getTime()) > 45 * 24 * 60 * 60 * 1000;

      const isHighPerformer = emp.assessment?.performance === 'high';

      return isHighPerformer && is1on1Overdue;
    });
  }, [employees, oneOnOnes]);

  const getHighPerformersWithoutSuccession = useCallback(() => {
    const successionEmployeeIds = new Set(successionCandidates.map(c => c.employee_id));

    return employees.filter(emp => {
      const isHighHigh = emp.assessment?.performance === 'high' && emp.assessment?.potential === 'high';
      return isHighHigh && !successionEmployeeIds.has(emp.id);
    });
  }, [employees, successionCandidates]);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value = useMemo<DataContextValue>(() => ({
    // Core data
    employees,
    departments,
    employeePlans,
    performanceReviews,
    surveys360,
    managerNotes,
    oneOnOnes,
    pips,
    successionCandidates,

    // Loading states
    loading,
    refreshing,

    // Refresh
    refreshAll,
    refreshEmployees,
    refreshPlans,
    refreshReviews,
    refresh360,

    // CRUD
    updateEmployee,
    updateAssessment,
    createPlan,
    updatePlan,
    deletePlan,
    createReview,
    updateReview,
    create360Survey,
    update360Survey,

    // Computed
    getEmployeeById,
    getEmployeesWithoutPlans,
    getEmployeesWithoutReviews,
    getEmployeesAtFlightRisk,
    getHighPerformersWithoutSuccession,
  }), [
    employees,
    departments,
    employeePlans,
    performanceReviews,
    surveys360,
    managerNotes,
    oneOnOnes,
    pips,
    successionCandidates,
    loading,
    refreshing,
    refreshAll,
    refreshEmployees,
    refreshPlans,
    refreshReviews,
    refresh360,
    updateEmployee,
    updateAssessment,
    createPlan,
    updatePlan,
    deletePlan,
    createReview,
    updateReview,
    create360Survey,
    update360Survey,
    getEmployeeById,
    getEmployeesWithoutPlans,
    getEmployeesWithoutReviews,
    getEmployeesAtFlightRisk,
    getHighPerformersWithoutSuccession,
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}
