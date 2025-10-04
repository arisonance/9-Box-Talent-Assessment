import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Download, RotateCcw, Users, Target, FileText, Filter, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getPerformancePotentialFromPosition, getBoxKey } from '../lib/utils';
import type { Employee, Department, UserRole } from '../types';
import type { PerformanceReview } from './PerformanceReviewModal';
import { useBoxDefinitions } from '../hooks/useBoxDefinitions';
import BoxCell from './BoxCell';
import EmployeeCard from './EmployeeCard';
import UnassignedEmployees from './UnassignedEmployees';
import CellDetailModal from './CellDetailModal';
import EnhancedEmployeePlanModal from './EnhancedEmployeePlanModal';
import AddEmployeeWithReviewModal from './AddEmployeeWithReviewModal';
import EmployeeDetailModal from './EmployeeDetailModal';
import Quick360Modal from './Quick360Modal';

interface NineBoxGridProps {
  employees: Employee[];
  departments: Department[];
  onEmployeeUpdate: (updatedEmployee?: any) => void;
  userRole: UserRole;
  selectedDepartments?: string[];
  initialPlans?: Record<string, any>;
  onPlansUpdate?: (plans: Record<string, any>) => void;
  organizationId: string;
  performanceReviews?: Record<string, { self?: PerformanceReview; manager?: PerformanceReview }>;
  onReviewSave?: (review: PerformanceReview) => void;
}

export default function NineBoxGrid({
  employees,
  departments,
  onEmployeeUpdate,
  userRole,
  selectedDepartments = [],
  initialPlans = {},
  onPlansUpdate,
  organizationId,
  performanceReviews = {},
  onReviewSave,
}: NineBoxGridProps) {
  const [draggedEmployee, setDraggedEmployee] = useState<Employee | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBoxDefinition, setSelectedBoxDefinition] = useState<any>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeePlans, setEmployeePlans] = useState<Record<string, any>>(initialPlans);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [isEmployeeDetailModalOpen, setIsEmployeeDetailModalOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<'details' | 'perf-review'>('details');
  const [initialReviewType, setInitialReviewType] = useState<'manager' | 'self'>('manager');
  const [activeDepartmentFilter, setActiveDepartmentFilter] = useState<string | null>(null);
  const [is360ModalOpen, setIs360ModalOpen] = useState(false);
  const [selected360Employee, setSelected360Employee] = useState<Employee | null>(null);

  const { boxDefinitions, loading: boxLoading} = useBoxDefinitions(organizationId);

  // Sync employee plans when initialPlans change
  useEffect(() => {
    setEmployeePlans(initialPlans);
  }, [initialPlans]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Filter employees by active department filter
  const filteredEmployees = activeDepartmentFilter
    ? employees.filter(emp => emp.department_id === activeDepartmentFilter)
    : employees;

  const getReviewsForEmployee = (employeeId: string): PerformanceReview[] => {
    const record = performanceReviews[employeeId];
    if (!record) return [];
    return Object.values(record).filter(Boolean) as PerformanceReview[];
  };

  const handleReviewSave = (review: PerformanceReview) => {
    onReviewSave?.(review);
  };

  // Group employees by box
  const employeesByBox = filteredEmployees.reduce((acc, employee) => {
    const boxKey = employee.assessment?.box_key || 'unassigned';
    if (!acc[boxKey]) {
      acc[boxKey] = [];
    }
    acc[boxKey].push(employee);
    return acc;
  }, {} as Record<string, Employee[]>);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'employee') {
      setDraggedEmployee(active.data.current.employee);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedEmployee(null);

    if (!over || active.id === over.id) return;

    const employee = active.data.current?.employee as Employee;
    const targetBox = over.data.current?.boxDefinition;

    if (!employee || !targetBox || userRole === 'viewer') return;

    setIsUpdating(true);

    try {
      // Get performance and potential from grid position
      const [performance, potential] = getPerformancePotentialFromPosition(
        targetBox.grid_x,
        targetBox.grid_y
      );

      // Update or create assessment in database
      if (employee.assessment) {
        // Update existing assessment
        const { error } = await supabase
          .from('assessments')
          .update({
            performance,
            potential,
            box_key: targetBox.key,
            updated_at: new Date().toISOString()
          })
          .eq('employee_id', employee.id)
          .eq('organization_id', organizationId);

        if (error) throw error;
      } else {
        // Create new assessment
        const { error } = await supabase
          .from('assessments')
          .insert({
            organization_id: organizationId,
            employee_id: employee.id,
            performance,
            potential,
            box_key: targetBox.key
          });

        if (error) throw error;
      }

      // Create updated employee with new assessment for local state
      const updatedEmployee = {
        ...employee,
        assessment: {
          performance,
          potential,
          box_key: targetBox.key,
        }
      };

      // Pass the updated employee to parent
      onEmployeeUpdate(updatedEmployee);
    } catch (error) {
      console.error('Error updating assessment:', error);
      alert('Failed to update employee assessment. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportData = async () => {
    try {
      const { exportToCSV, exportToHTML, exportToPNG } = await import('../lib/export');
      
      const action = await new Promise<string>((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50';
        modal.innerHTML = `
          <div class="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
            <h3 class="text-lg font-medium mb-4">Export Options</h3>
            <div class="space-y-3">
              <button class="export-csv w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <div class="font-medium">CSV Data</div>
                <div class="text-sm text-gray-500">Export employee data and assessments</div>
              </button>
              <button class="export-html w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <div class="font-medium">HTML Report</div>
                <div class="text-sm text-gray-500">Formatted visual report</div>
              </button>
              <button class="export-png w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <div class="font-medium">PNG Image</div>
                <div class="text-sm text-gray-500">Screenshot of current grid</div>
              </button>
            </div>
            <div class="mt-6 flex justify-end">
              <button class="cancel px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
            </div>
          </div>
        `;

        const handleClick = (e: Event) => {
          const target = e.target as HTMLElement;
          if (target.closest('.export-csv')) resolve('csv');
          else if (target.closest('.export-html')) resolve('html');
          else if (target.closest('.export-png')) resolve('png');
          else if (target.closest('.cancel')) resolve('cancel');
        };

        modal.addEventListener('click', (e) => {
          if (e.target === modal) resolve('cancel');
          else handleClick(e);
        });

        document.body.appendChild(modal);
        
        // Cleanup function
        const cleanup = () => document.body.removeChild(modal);
        setTimeout(() => {
          if (modal.parentNode) cleanup();
          resolve('cancel');
        }, 30000); // Auto-close after 30 seconds
        
        // Add cleanup to resolve
        const originalResolve = resolve;
        resolve = (value: string) => {
          cleanup();
          originalResolve(value);
        };
      });

      if (action === 'cancel') return;

      const exportData = {
        employees,
        departments,
        boxDefinitions,
      };

      switch (action) {
        case 'csv':
          exportToCSV(exportData);
          break;
        case 'html':
          exportToHTML(exportData);
          break;
        case 'png':
          await exportToPNG('nine-box-grid-container');
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all assessments? This action cannot be undone.')) {
      return;
    }

    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('organization_id', organizationId);

      if (error) throw error;

      onEmployeeUpdate();
    } catch (error) {
      console.error('Reset failed:', error);
      alert('Reset failed. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Modal handlers
  const handleCellClick = (boxDefinition: any, cellEmployees: Employee[]) => {
    setSelectedBoxDefinition(boxDefinition);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedBoxDefinition(null);
  };

  const handleModalNavigate = (direction: 'prev' | 'next') => {
    if (!selectedBoxDefinition) return;

    const currentIndex = boxDefinitions.findIndex(box => box.key === selectedBoxDefinition.key);
    let newIndex;

    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : boxDefinitions.length - 1;
    } else {
      newIndex = currentIndex < boxDefinitions.length - 1 ? currentIndex + 1 : 0;
    }

    setSelectedBoxDefinition(boxDefinitions[newIndex]);
  };

  const handleOpenPlan = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsPlanModalOpen(true);
  };

  const handleCardClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setInitialTab('details');
    setIsEmployeeDetailModalOpen(true);
  };

  const handleOpenManagerReview = (employee: Employee) => {
    setSelectedEmployee(employee);
    setInitialTab('perf-review');
    setInitialReviewType('manager');
    setIsEmployeeDetailModalOpen(true);
  };

  const handleOpenSelfReview = (employee: Employee) => {
    setSelectedEmployee(employee);
    setInitialTab('perf-review');
    setInitialReviewType('self');
    setIsEmployeeDetailModalOpen(true);
  };

  const handleOpen360 = (employee: Employee) => {
    setSelected360Employee(employee);
    setIs360ModalOpen(true);
  };

  const handleSavePlan = (plan: any) => {
    if (selectedEmployee) {
      const updatedPlans = {
        ...employeePlans,
        [selectedEmployee.id]: plan
      };
      setEmployeePlans(updatedPlans);

      // Update parent component
      if (onPlansUpdate) {
        onPlansUpdate(updatedPlans);
      }

      console.log('Saved plan for', selectedEmployee.name, plan);
    }
  };

  const handleEmployeeCreated = (
    employeeData: Partial<Employee>,
    assessment: any,
    developmentPlan: any
  ) => {
    const newEmployeeId = `emp-${Date.now()}`;
    const newEmployee = {
      ...employeeData,
      id: newEmployeeId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      assessment: assessment ? {
        performance: assessment.performance,
        potential: assessment.potential,
        box_key: assessment.boxKey
      } : undefined
    };

    // If there's a development plan, save it
    if (developmentPlan) {
      const updatedPlans = {
        ...employeePlans,
        [newEmployeeId]: {
          ...developmentPlan,
          id: `plan-${newEmployeeId}`,
          employee_id: newEmployeeId
        }
      };
      setEmployeePlans(updatedPlans);

      if (onPlansUpdate) {
        onPlansUpdate(updatedPlans);
      }
    }

    // Notify parent to add employee
    onEmployeeUpdate(newEmployee as any);
  };

  if (boxLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  const unassignedEmployees = employeesByBox['unassigned'] || [];
  const assessedCount = filteredEmployees.length - unassignedEmployees.length;

  // Count employees with and without plans
  const assessedEmployees = filteredEmployees.filter(emp => emp.assessment);
  const employeesWithoutPlans = assessedEmployees.filter(emp => !employeePlans[emp.id]);
  const shouldShowGuidance = assessedCount > 0 && employeesWithoutPlans.length > 0;

  // Get active department name
  const activeDepartment = activeDepartmentFilter
    ? departments.find(d => d.id === activeDepartmentFilter)
    : null;

  // Department distribution - only show when no active filter
  const isCompanyView = selectedDepartments.length === 0;
  const isMultiDept = selectedDepartments.length > 1;
  const activeDepartments = isCompanyView
    ? departments
    : departments.filter(d => selectedDepartments.includes(d.id));

  const departmentDistribution = activeDepartments.map(dept => {
    const deptEmployees = filteredEmployees.filter(emp => emp.department_id === dept.id);
    const assessed = deptEmployees.filter(emp => emp.assessment);
    return {
      ...dept,
      count: deptEmployees.length,
      assessed: assessed.length
    };
  });

  return (
    <div className="space-y-6">
      {/* Header with stats and actions */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">9-Box Talent Grid</h2>

            {/* Department Filter Dropdown */}
            {departments.length > 1 && (
              <div className="relative">
                <select
                  value={activeDepartmentFilter || ''}
                  onChange={(e) => setActiveDepartmentFilter(e.target.value || null)}
                  className="pl-9 pr-9 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-400 transition-colors cursor-pointer"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                {activeDepartmentFilter && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDepartmentFilter(null);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Active Filter Badge */}
            {activeDepartment && (
              <span
                className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium text-white"
                style={{ backgroundColor: activeDepartment.color }}
              >
                {activeDepartment.name}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExportData}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>

            {userRole !== 'viewer' && (
              <button
                onClick={handleReset}
                className="btn-tertiary flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-gray-600">Total</span>
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {filteredEmployees.length}
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 bg-green-600 rounded-full" />
              <span className="text-xs font-medium text-gray-600">Assessed</span>
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {assessedCount}
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-gray-600">With Plans</span>
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {Object.keys(employeePlans).length}
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 bg-amber-500 rounded-full" />
              <span className="text-xs font-medium text-gray-600">Unassigned</span>
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {unassignedEmployees.length}
            </div>
          </div>
        </div>
      </div>

      {/* Department Legend & Distribution */}
      {!activeDepartmentFilter && (isCompanyView || isMultiDept) && departmentDistribution.length > 1 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {isCompanyView ? 'Department Distribution' : 'Selected Departments'}
            </h3>
            <span className="text-sm text-gray-600">
              {departmentDistribution.length} departments • {filteredEmployees.length} total employees
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {departmentDistribution.map(dept => (
              <div 
                key={dept.id}
                className="relative p-4 rounded-xl border-2 hover:shadow-md transition-all"
                style={{ borderColor: dept.color }}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <div 
                    className="w-4 h-4 rounded-full shadow-md"
                    style={{ backgroundColor: dept.color }}
                  />
                  <span className="font-semibold text-sm">{dept.name}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-bold text-gray-900">{dept.count}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Assessed:</span>
                    <span className="font-bold" style={{ color: dept.color }}>
                      {dept.assessed} ({dept.count > 0 ? Math.round((dept.assessed / dept.count) * 100) : 0}%)
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all"
                    style={{ 
                      width: `${dept.count > 0 ? (dept.assessed / dept.count) * 100 : 0}%`,
                      backgroundColor: dept.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guidance Banner for Plans */}
      {shouldShowGuidance && userRole !== 'viewer' && (
        <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <Target className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="font-semibold text-blue-900">Next: Create Development Plans</h3>
              </div>
              <p className="text-sm text-blue-800 mb-2">
                {employeesWithoutPlans.length} assessed employees need development plans. Hover over employee cards and click "Plan" to get started.
              </p>
            </div>
            <button
              onClick={() => {
                const nextEmployee = employeesWithoutPlans[0];
                if (nextEmployee) {
                  handleOpenPlan(nextEmployee);
                }
              }}
              className="ml-4 px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors flex items-center space-x-1.5 text-sm whitespace-nowrap"
            >
              <Target className="w-4 h-4" />
              <span>Create First Plan</span>
            </button>
          </div>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Main Grid - Full Width */}
        <div className="mb-6">
          <div id="nine-box-grid-container" className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            {/* Grid labels */}
            <div className="mb-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Performance vs Potential Matrix</h3>
                <p className="text-sm text-gray-600 mb-4">Drag employees to assess their performance and potential levels</p>
              </div>
            </div>

            {/* Axis Labels and Grid Container */}
            <div className="relative">
              {/* Performance axis label (horizontal) */}
              <div className="flex justify-between items-center mb-4 px-20">
                <span className="text-sm font-medium text-gray-500">Low</span>
                <span className="text-lg font-bold text-gray-700">← PERFORMANCE →</span>
                <span className="text-sm font-medium text-gray-500">High</span>
              </div>

              <div className="flex">
                {/* Potential axis label (vertical) */}
                <div className="flex flex-col justify-between items-center mr-6 py-8">
                  <span className="text-sm font-medium text-gray-500">High</span>
                  <div className="-rotate-90 whitespace-nowrap">
                    <span className="text-lg font-bold text-gray-700">POTENTIAL</span>
                  </div>
                  <span className="text-sm font-medium text-gray-500">Low</span>
                </div>

                {/* 3x3 Grid - Much Larger */}
                <div className="flex-1">
                    <div className="grid grid-cols-3 grid-rows-3 gap-6 min-h-[1200px] bg-white/50 rounded-xl p-6 border-2 border-gray-200">
                      {boxDefinitions.map((boxDef) => (
                        <BoxCell
                          key={boxDef.key}
                          boxDefinition={boxDef}
                          employees={employeesByBox[boxDef.key] || []}
                          departments={departments}
                          onClick={handleCellClick}
                          onOpenPlan={handleOpenPlan}
                          onCardClick={handleCardClick}
                          onOpenManagerReview={handleOpenManagerReview}
                          onOpenSelfReview={handleOpenSelfReview}
                          onOpen360={handleOpen360}
                          employeePlans={employeePlans}
                        />
                      ))}
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Unassigned Employees - Full Width Below */}
        <div>
          <UnassignedEmployees
            employees={unassignedEmployees}
            departments={departments}
            userRole={userRole}
            isUpdating={isUpdating}
            onOpenPlan={handleOpenPlan}
            onCardClick={handleCardClick}
            employeePlans={employeePlans}
            onAddEmployee={() => setIsAddEmployeeModalOpen(true)}
          />
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {draggedEmployee && (
            <EmployeeCard
              employee={draggedEmployee}
              department={departments.find(d => d.id === draggedEmployee.department_id)}
              isDragging
              showMenu={false}
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Cell Detail Modal */}
      <CellDetailModal
        isOpen={isModalOpen}
        boxDefinition={selectedBoxDefinition}
        employees={selectedBoxDefinition ? (employeesByBox[selectedBoxDefinition.key] || []) : []}
        departments={departments}
        allBoxDefinitions={boxDefinitions}
        onClose={handleModalClose}
        onNavigate={handleModalNavigate}
        onEmployeeUpdate={onEmployeeUpdate}
      />

      {/* Enhanced Employee Plan Modal */}
      {selectedEmployee && (
        <EnhancedEmployeePlanModal
          isOpen={isPlanModalOpen}
          employee={selectedEmployee}
          department={departments.find(d => d.id === selectedEmployee.department_id)}
          onClose={() => {
            setIsPlanModalOpen(false);
            setSelectedEmployee(null);
          }}
          onSave={handleSavePlan}
          existingPlan={employeePlans[selectedEmployee.id]}
          performanceReviews={getReviewsForEmployee(selectedEmployee.id)}
        />
      )}

      {/* Add Employee with Review Modal */}
      <AddEmployeeWithReviewModal
        isOpen={isAddEmployeeModalOpen}
        onClose={() => setIsAddEmployeeModalOpen(false)}
        departments={departments}
        organizationId={organizationId}
        onEmployeeCreated={handleEmployeeCreated}
      />

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <EmployeeDetailModal
          isOpen={isEmployeeDetailModalOpen}
          onClose={() => {
            setIsEmployeeDetailModalOpen(false);
            setSelectedEmployee(null);
            setInitialTab('details');
          }}
          employee={selectedEmployee}
          department={departments.find(d => d.id === selectedEmployee.department_id)}
          employeePlan={employeePlans[selectedEmployee.id]}
          initialTab={initialTab}
          initialReviewType={initialReviewType}
          performanceReviewRecord={performanceReviews[selectedEmployee.id]}
          onReviewSave={handleReviewSave}
          onSavePlan={(plan) => {
            const updatedPlans = {
              ...employeePlans,
              [selectedEmployee.id]: plan
            };
            setEmployeePlans(updatedPlans);
            if (onPlansUpdate) onPlansUpdate(updatedPlans);
          }}
          onUpdateEmployee={(updatedEmployee) => {
            onEmployeeUpdate(updatedEmployee);
          }}
        />
      )}

      {/* Quick 360 Modal */}
      {selected360Employee && (
        <Quick360Modal
          isOpen={is360ModalOpen}
          onClose={() => {
            setIs360ModalOpen(false);
            setSelected360Employee(null);
          }}
          employee={selected360Employee}
          organizationId={organizationId}
          onSurveyCreated={() => {
            setIs360ModalOpen(false);
            setSelected360Employee(null);
          }}
        />
      )}
    </div>
  );
}
