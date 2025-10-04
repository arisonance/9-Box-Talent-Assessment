import { useState } from 'react';
import { Target, UserPlus } from 'lucide-react';
import type { Employee, Department } from '../types';
import PlansDashboard from './PlansDashboard';
import { NavigationTabs } from './unified';

interface DevelopmentDashboardProps {
  employees: Employee[];
  departments: Department[];
  employeePlans: Record<string, any>;
  onEmployeeClick: (employee: Employee) => void;
}

type DevelopmentView = 'plans' | 'onboarding';

export default function DevelopmentDashboard({
  employees,
  departments,
  employeePlans,
  onEmployeeClick,
}: DevelopmentDashboardProps) {
  const [activeView, setActiveView] = useState<DevelopmentView>('plans');

  const tabs = [
    { id: 'plans', label: 'Development Plans', icon: Target },
    { id: 'onboarding', label: 'Onboarding', icon: UserPlus },
  ];

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <NavigationTabs
          tabs={tabs}
          activeTab={activeView}
          onTabChange={(tabId) => setActiveView(tabId as DevelopmentView)}
        />

        {/* Content */}
        <div className="p-6">
          {activeView === 'plans' && (
            <PlansDashboard
              employees={employees}
              departments={departments}
              employeePlans={employeePlans}
              onEmployeeClick={onEmployeeClick}
            />
          )}

          {activeView === 'onboarding' && (
            <div className="text-center py-12">
              <UserPlus className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Onboarding Excellence
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Manage 90-day systematic onboarding plans with multi-stakeholder accountability and milestone tracking
              </p>
              <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all">
                Coming Soon
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
