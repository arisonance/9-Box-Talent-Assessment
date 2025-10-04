import { useState } from 'react';
import { Award, Users as UsersIcon, TrendingUp, AlertCircle, CheckCircle, Info } from 'lucide-react';
import type { Employee, Department } from '../types';
import EmployeeCard from './EmployeeCard';
import EmployeeDetailModal from './EmployeeDetailModal';
import PerformanceReviewModal, { type PerformanceReview } from './PerformanceReviewModal';

interface IdealTeamPlayerDashboardProps {
  employees: Employee[];
  departments: Department[];
  employeePlans?: Record<string, any>;
  onPlansUpdate?: (plans: Record<string, any>) => void;
  onEmployeeUpdate?: () => void;
  currentUserName: string;
  performanceReviews?: Record<string, { self?: PerformanceReview; manager?: PerformanceReview }>;
  onReviewSave?: (review: PerformanceReview) => void;
}

export default function IdealTeamPlayerDashboard({
  employees,
  departments,
  employeePlans = {},
  onPlansUpdate,
  onEmployeeUpdate,
  currentUserName,
  performanceReviews = {},
  onReviewSave,
}: IdealTeamPlayerDashboardProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewType, setReviewType] = useState<'self' | 'manager'>('manager');
  const [filterCategory, setFilterCategory] = useState<'all' | 'assessed' | 'not-assessed'>('all');

  // Calculate ITP scores for employees with reviews
  const employeesWithScores = employees.map((employee) => {
    const reviews = performanceReviews[employee.id];
    const managerReview = reviews?.manager;
    const selfReview = reviews?.self;

    return {
      employee,
      hasManagerReview: !!managerReview,
      hasSelfReview: !!selfReview,
      managerScores: managerReview
        ? {
            humble: managerReview.humble_score,
            hungry: managerReview.hungry_score,
            smart: managerReview.smart_score,
            overall: Math.round(
              (managerReview.humble_score + managerReview.hungry_score + managerReview.smart_score) / 3
            ),
          }
        : null,
      selfScores: selfReview
        ? {
            humble: selfReview.humble_score,
            hungry: selfReview.hungry_score,
            smart: selfReview.smart_score,
            overall: Math.round((selfReview.humble_score + selfReview.hungry_score + selfReview.smart_score) / 3),
          }
        : null,
    };
  });

  // Filter employees
  const filteredEmployees =
    filterCategory === 'assessed'
      ? employeesWithScores.filter((e) => e.hasManagerReview || e.hasSelfReview)
      : filterCategory === 'not-assessed'
      ? employeesWithScores.filter((e) => !e.hasManagerReview && !e.hasSelfReview)
      : employeesWithScores;

  // Group by score ranges
  const exceptional = filteredEmployees.filter((e) => e.managerScores && e.managerScores.overall >= 9);
  const strong = filteredEmployees.filter(
    (e) => e.managerScores && e.managerScores.overall >= 7 && e.managerScores.overall < 9
  );
  const developing = filteredEmployees.filter(
    (e) => e.managerScores && e.managerScores.overall >= 5 && e.managerScores.overall < 7
  );
  const needsImprovement = filteredEmployees.filter((e) => e.managerScores && e.managerScores.overall < 5);
  const notAssessed = filteredEmployees.filter((e) => !e.managerScores);

  const handleEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDetailModalOpen(true);
  };

  const handleOpenReview = (employee: Employee, type: 'self' | 'manager') => {
    setSelectedEmployee(employee);
    setReviewType(type);
    setIsReviewModalOpen(true);
  };

  const handleSavePlan = (plan: any) => {
    if (selectedEmployee && onPlansUpdate) {
      const updatedPlans = {
        ...employeePlans,
        [selectedEmployee.id]: plan,
      };
      onPlansUpdate(updatedPlans);
    }
  };

  const handleSaveReview = (review: PerformanceReview) => {
    if (onReviewSave) {
      onReviewSave(review);
    }
    setIsReviewModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Award className="w-8 h-8 mr-3 text-purple-600" />
              Ideal Team Player Assessment
            </h2>
            <p className="text-gray-600 mt-1">Track Humble, Hungry, and People Smart attributes across your team</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <button
            onClick={() => setFilterCategory('all')}
            className={`p-4 rounded-lg border-2 transition-all ${
              filterCategory === 'all' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <UsersIcon className="w-5 h-5 text-purple-600" />
              <span className="text-2xl font-bold text-gray-900">{employees.length}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Total Employees</div>
          </button>

          <button
            onClick={() => setFilterCategory('assessed')}
            className={`p-4 rounded-lg border-2 transition-all ${
              filterCategory === 'assessed'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                {employeesWithScores.filter((e) => e.hasManagerReview || e.hasSelfReview).length}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-700">Assessed</div>
          </button>

          <div className="p-4 rounded-lg border-2 border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-5 h-5 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">{exceptional.length}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Exceptional (9-10)</div>
          </div>

          <div className="p-4 rounded-lg border-2 border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{strong.length}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Strong (7-8)</div>
          </div>

          <button
            onClick={() => setFilterCategory('not-assessed')}
            className={`p-4 rounded-lg border-2 transition-all ${
              filterCategory === 'not-assessed'
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">{notAssessed.length}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Not Assessed</div>
          </button>
        </div>
      </div>

      {/* Info Guide */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg shadow border-2 border-purple-200 p-6">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-purple-600 mt-1 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-purple-900 mb-2">Ideal Team Player Matrix</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-purple-800">
              <div>
                <div className="font-bold text-blue-700 mb-1">🙏 HUMBLE</div>
                <p className="text-xs">Lacks excessive ego, quick to point out contributions of others</p>
              </div>
              <div>
                <div className="font-bold text-green-700 mb-1">🔥 HUNGRY</div>
                <p className="text-xs">Always looking for more to do, thinks about next step</p>
              </div>
              <div>
                <div className="font-bold text-purple-700 mb-1">🧠 PEOPLE SMART</div>
                <p className="text-xs">Has common sense about people, understands group dynamics</p>
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-4 text-xs">
              <span className="font-semibold">Click any employee card to:</span>
              <span>• View detailed scores</span>
              <span>• Complete ITP assessment</span>
              <span>• Access performance reviews</span>
            </div>
          </div>
        </div>
      </div>

      {/* Not Assessed Employees - Prominent */}
      {notAssessed.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-b-2 border-orange-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-orange-900">Needs Assessment</h3>
                  <p className="text-sm text-gray-600">
                    {notAssessed.length} {notAssessed.length === 1 ? 'employee' : 'employees'} without ITP scores
                  </p>
                </div>
              </div>
              <button
                onClick={() => notAssessed[0] && handleOpenReview(notAssessed[0].employee, 'manager')}
                className="px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
              >
                Start Assessment
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {notAssessed.map((item) => {
                const department = departments.find((d) => d.id === item.employee.department_id);
                return (
                  <div key={item.employee.id} className="relative">
                    <EmployeeCard
                      employee={item.employee}
                      department={department}
                      showMenu={false}
                      onCardClick={handleEmployeeClick}
                      employeePlan={employeePlans[item.employee.id]}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenReview(item.employee, 'manager');
                      }}
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full hover:bg-orange-600 shadow-lg"
                    >
                      Assess Now
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Exceptional Performers */}
      {exceptional.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-200 px-6 py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center mr-3">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-purple-900">Exceptional Team Players (9-10)</h3>
                <p className="text-sm text-gray-600">
                  {exceptional.length} {exceptional.length === 1 ? 'employee' : 'employees'} role modeling ideal
                  behaviors
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {exceptional.map((item) => {
                const department = departments.find((d) => d.id === item.employee.department_id);
                return (
                  <div key={item.employee.id} className="relative">
                    <EmployeeCard
                      employee={item.employee}
                      department={department}
                      showMenu={false}
                      onCardClick={handleEmployeeClick}
                      employeePlan={employeePlans[item.employee.id]}
                    />
                    {item.managerScores && (
                      <div className="mt-2 grid grid-cols-3 gap-1 text-xs">
                        <div className="text-center p-1 bg-blue-100 rounded">
                          <div className="font-bold text-blue-700">{item.managerScores.humble}</div>
                          <div className="text-blue-600">Humble</div>
                        </div>
                        <div className="text-center p-1 bg-green-100 rounded">
                          <div className="font-bold text-green-700">{item.managerScores.hungry}</div>
                          <div className="text-green-600">Hungry</div>
                        </div>
                        <div className="text-center p-1 bg-purple-100 rounded">
                          <div className="font-bold text-purple-700">{item.managerScores.smart}</div>
                          <div className="text-purple-600">Smart</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Strong Performers */}
      {strong.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b-2 border-blue-200 px-6 py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-blue-900">Strong Team Players (7-8)</h3>
                <p className="text-sm text-gray-600">
                  {strong.length} {strong.length === 1 ? 'employee' : 'employees'} consistently living ideal behaviors
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {strong.map((item) => {
                const department = departments.find((d) => d.id === item.employee.department_id);
                return (
                  <div key={item.employee.id} className="relative">
                    <EmployeeCard
                      employee={item.employee}
                      department={department}
                      showMenu={false}
                      onCardClick={handleEmployeeClick}
                      employeePlan={employeePlans[item.employee.id]}
                    />
                    {item.managerScores && (
                      <div className="mt-2 grid grid-cols-3 gap-1 text-xs">
                        <div className="text-center p-1 bg-blue-100 rounded">
                          <div className="font-bold text-blue-700">{item.managerScores.humble}</div>
                          <div className="text-blue-600">Humble</div>
                        </div>
                        <div className="text-center p-1 bg-green-100 rounded">
                          <div className="font-bold text-green-700">{item.managerScores.hungry}</div>
                          <div className="text-green-600">Hungry</div>
                        </div>
                        <div className="text-center p-1 bg-purple-100 rounded">
                          <div className="font-bold text-purple-700">{item.managerScores.smart}</div>
                          <div className="text-purple-600">Smart</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <EmployeeDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedEmployee(null);
          }}
          employee={selectedEmployee}
          department={departments.find((d) => d.id === selectedEmployee.department_id)}
          employeePlan={employeePlans[selectedEmployee.id]}
          initialTab="perf-review"
          initialReviewType="manager"
          performanceReviewRecord={performanceReviews[selectedEmployee.id]}
          onReviewSave={onReviewSave}
          onSavePlan={handleSavePlan}
          onUpdateEmployee={() => {
            if (onEmployeeUpdate) onEmployeeUpdate();
          }}
        />
      )}

      {/* Performance Review Modal */}
      {selectedEmployee && isReviewModalOpen && (
        <PerformanceReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedEmployee(null);
          }}
          employee={selectedEmployee}
          reviewType={reviewType}
          currentUserName={currentUserName}
          onSave={handleSaveReview}
          existingReview={
            reviewType === 'manager'
              ? performanceReviews[selectedEmployee.id]?.manager
              : performanceReviews[selectedEmployee.id]?.self
          }
        />
      )}
    </div>
  );
}
