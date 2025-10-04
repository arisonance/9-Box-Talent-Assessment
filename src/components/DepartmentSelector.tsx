import { useState } from 'react';
import { Building2, Users, TrendingUp, Award, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { Department, Employee } from '../types';

interface DepartmentSelectorProps {
  departments: Department[];
  employees: Employee[];
  selectedDepartments: string[];
  onSelectionChange: (departmentIds: string[]) => void;
}

export default function DepartmentSelector({
  departments,
  employees,
  selectedDepartments,
  onSelectionChange
}: DepartmentSelectorProps) {
  const [showStats, setShowStats] = useState(false);

  // Calculate stats for each department
  const getDepartmentStats = (deptId: string) => {
    const deptEmployees = employees.filter(emp => emp.department_id === deptId);
    const assessed = deptEmployees.filter(emp => emp.assessment);
    const highPotential = assessed.filter(emp => emp.assessment?.potential === 'high');
    const highPerformers = assessed.filter(emp => emp.assessment?.performance === 'high');
    const stars = assessed.filter(emp => 
      emp.assessment?.performance === 'high' && emp.assessment?.potential === 'high'
    );
    const atRisk = assessed.filter(emp => 
      emp.assessment?.performance === 'low' || 
      (emp.assessment?.performance === 'low' && emp.assessment?.potential === 'low')
    );

    return {
      total: deptEmployees.length,
      assessed: assessed.length,
      highPotential: highPotential.length,
      highPerformers: highPerformers.length,
      stars: stars.length,
      atRisk: atRisk.length,
      assessmentRate: deptEmployees.length > 0 ? (assessed.length / deptEmployees.length) * 100 : 0
    };
  };

  const companyStats = {
    total: employees.length,
    assessed: employees.filter(emp => emp.assessment).length,
    highPotential: employees.filter(emp => emp.assessment?.potential === 'high').length,
    highPerformers: employees.filter(emp => emp.assessment?.performance === 'high').length,
    stars: employees.filter(emp => 
      emp.assessment?.performance === 'high' && emp.assessment?.potential === 'high'
    ).length,
    atRisk: employees.filter(emp => 
      emp.assessment?.performance === 'low'
    ).length,
    assessmentRate: employees.length > 0 
      ? (employees.filter(emp => emp.assessment).length / employees.length) * 100 
      : 0
  };

  const isCompanyView = selectedDepartments.length === 0;
  const isSingleDept = selectedDepartments.length === 1;
  const isMultiDept = selectedDepartments.length > 1;

  const handleSelectAll = () => {
    onSelectionChange([]);
  };

  const handleSelectDepartment = (deptId: string) => {
    if (selectedDepartments.includes(deptId)) {
      onSelectionChange(selectedDepartments.filter(id => id !== deptId));
    } else {
      onSelectionChange([...selectedDepartments, deptId]);
    }
  };

  const handleSelectOnly = (deptId: string) => {
    onSelectionChange([deptId]);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Department View</h3>
              <p className="text-sm text-gray-600">
                {isCompanyView ? 'Viewing entire company' : 
                 isSingleDept ? '1 department selected' : 
                 `${selectedDepartments.length} departments selected`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowStats(!showStats)}
            className="flex items-center space-x-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <span>{showStats ? 'Hide' : 'Show'} Stats</span>
            {showStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Department Selector */}
      <div className="p-6">
        <div className="flex flex-wrap gap-3 mb-4">
          {/* Company-wide button */}
          <button
            onClick={handleSelectAll}
            className={`group relative px-4 py-3 rounded-xl border-2 transition-all hover:scale-105 ${
              isCompanyView
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 border-indigo-500 text-white shadow-lg'
                : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5" />
              <div className="text-left">
                <div className="font-bold">Company-Wide</div>
                <div className={`text-xs ${isCompanyView ? 'text-indigo-100' : 'text-gray-500'}`}>
                  {employees.length} employees
                </div>
              </div>
            </div>
          </button>

          {/* Individual departments */}
          {departments.map((dept) => {
            const stats = getDepartmentStats(dept.id);
            const isSelected = selectedDepartments.includes(dept.id);
            
            return (
              <div key={dept.id} className="relative group">
                <button
                  onClick={() => handleSelectDepartment(dept.id)}
                  className={`relative px-4 py-3 rounded-xl border-2 transition-all hover:scale-105 ${
                    isSelected
                      ? 'text-white shadow-lg'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-md'
                  }`}
                  style={{
                    backgroundColor: isSelected ? dept.color : undefined,
                    borderColor: isSelected ? dept.color : undefined,
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full shadow-md"
                      style={{ backgroundColor: dept.color }}
                    />
                    <div className="text-left">
                      <div className="font-bold">{dept.name}</div>
                      <div className={`text-xs ${isSelected ? 'opacity-90' : 'text-gray-500'}`}>
                        {stats.total} employees
                      </div>
                    </div>
                    {isSelected && (
                      <div className="ml-2 bg-white/20 rounded-full w-5 h-5 flex items-center justify-center">
                        <span className="text-xs font-bold">✓</span>
                      </div>
                    )}
                  </div>
                </button>
                
                {/* Quick select only button */}
                {!isSelected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectOnly(dept.id);
                    }}
                    className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg hover:bg-indigo-600"
                    title="View only this department"
                  >
                    1
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {isCompanyView ? (
              <span>Showing all {employees.length} employees across {departments.length} departments</span>
            ) : isSingleDept ? (
              <span>Focused on {departments.find(d => d.id === selectedDepartments[0])?.name}</span>
            ) : (
              <span>Comparing {selectedDepartments.length} departments</span>
            )}
          </div>
          {!isCompanyView && (
            <button
              onClick={handleSelectAll}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Reset to Company View
            </button>
          )}
        </div>
      </div>

      {/* Statistics Panel */}
      {showStats && (
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          {isCompanyView ? (
            /* Company-wide stats */
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-4">Company Overview</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard
                  icon={Users}
                  label="Total"
                  value={companyStats.total}
                  color="text-gray-600"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Assessed"
                  value={`${companyStats.assessed} (${Math.round(companyStats.assessmentRate)}%)`}
                  color="text-blue-600"
                />
                <StatCard
                  icon={Award}
                  label="Stars"
                  value={companyStats.stars}
                  color="text-emerald-600"
                />
                <StatCard
                  icon={TrendingUp}
                  label="High Potential"
                  value={companyStats.highPotential}
                  color="text-purple-600"
                />
                <StatCard
                  icon={Award}
                  label="High Performers"
                  value={companyStats.highPerformers}
                  color="text-cyan-600"
                />
                <StatCard
                  icon={AlertCircle}
                  label="At Risk"
                  value={companyStats.atRisk}
                  color="text-orange-600"
                />
              </div>

              {/* Department breakdown */}
              <div className="mt-6">
                <h5 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Department Breakdown</h5>
                <div className="space-y-2">
                  {departments.map(dept => {
                    const stats = getDepartmentStats(dept.id);
                    return (
                      <div key={dept.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: dept.color }}
                          />
                          <span className="font-medium text-sm">{dept.name}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs">
                          <span className="text-gray-600">{stats.total} total</span>
                          <span className="text-emerald-600 font-semibold">{stats.stars} ⭐</span>
                          <span className="text-purple-600 font-semibold">{stats.highPotential} 🚀</span>
                          <span className="text-orange-600 font-semibold">{stats.atRisk} ⚠️</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Selected department(s) stats */
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-4">Selected Department Stats</h4>
              <div className="space-y-4">
                {selectedDepartments.map(deptId => {
                  const dept = departments.find(d => d.id === deptId);
                  if (!dept) return null;
                  const stats = getDepartmentStats(deptId);
                  
                  return (
                    <div key={deptId} className="p-4 bg-white rounded-lg border-l-4" style={{ borderColor: dept.color }}>
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-bold text-lg" style={{ color: dept.color }}>{dept.name}</h5>
                        <button
                          onClick={() => handleSelectOnly(deptId)}
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          View Only
                        </button>
                      </div>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                        <StatCard icon={Users} label="Total" value={stats.total} color="text-gray-600" compact />
                        <StatCard icon={TrendingUp} label="Assessed" value={`${Math.round(stats.assessmentRate)}%`} color="text-blue-600" compact />
                        <StatCard icon={Award} label="Stars" value={stats.stars} color="text-emerald-600" compact />
                        <StatCard icon={TrendingUp} label="Hi-Po" value={stats.highPotential} color="text-purple-600" compact />
                        <StatCard icon={Award} label="Hi-Perf" value={stats.highPerformers} color="text-cyan-600" compact />
                        <StatCard icon={AlertCircle} label="At Risk" value={stats.atRisk} color="text-orange-600" compact />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: any;
  label: string;
  value: string | number;
  color: string;
  compact?: boolean;
}

function StatCard({ icon: Icon, label, value, color, compact }: StatCardProps) {
  if (compact) {
    return (
      <div className="text-center">
        <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
        <div className="text-xs text-gray-600">{label}</div>
        <div className={`text-sm font-bold ${color}`}>{value}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex items-center space-x-2 mb-2">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
