import { useState } from 'react';
import { Users, Award, AlertTriangle } from 'lucide-react';
import type { Employee, Department } from '../types';
import type { PerformanceReview } from './PerformanceReviewModal';
import EmployeeList from './EmployeeList';
import IdealTeamPlayerDashboard from './IdealTeamPlayerDashboard';
import FlightRiskDashboard from './FlightRiskDashboard';
import { NavigationTabs } from './unified';

interface PeopleDashboardProps {
  employees: Employee[];
  departments: Department[];
  onEmployeeUpdate: () => void;
  userRole: any;
  employeePlans: Record<string, any>;
  onPlansUpdate: (plans: Record<string, any>) => void;
  currentUserName: string;
  performanceReviews: Record<string, { self?: PerformanceReview; manager?: PerformanceReview }>;
  onReviewSave: (review: PerformanceReview) => void;
  organizationId: string;
}

type PeopleView = 'all' | 'team-player' | 'flight-risk';

export default function PeopleDashboard({
  employees,
  departments,
  onEmployeeUpdate,
  userRole,
  employeePlans,
  onPlansUpdate,
  currentUserName,
  performanceReviews,
  onReviewSave,
  organizationId,
}: PeopleDashboardProps) {
  const [activeView, setActiveView] = useState<PeopleView>('all');

  const tabs = [
    { id: 'all', label: 'All Employees', icon: Users },
    { id: 'team-player', label: 'Ideal Team Player', icon: Award },
    { id: 'flight-risk', label: 'Flight Risk', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <NavigationTabs
          tabs={tabs}
          activeTab={activeView}
          onTabChange={(tabId) => setActiveView(tabId as PeopleView)}
        />

        {/* Content */}
        <div className="p-6">
          {activeView === 'all' && (
            <EmployeeList
              employees={employees}
              departments={departments}
              onEmployeeUpdate={onEmployeeUpdate}
              userRole={userRole}
              employeePlans={employeePlans}
              onPlansUpdate={onPlansUpdate}
              organizationId={organizationId}
              performanceReviews={performanceReviews}
              onReviewSave={onReviewSave}
            />
          )}

          {activeView === 'team-player' && (
            <IdealTeamPlayerDashboard
              employees={employees}
              departments={departments}
              employeePlans={employeePlans}
              onPlansUpdate={onPlansUpdate}
              onEmployeeUpdate={onEmployeeUpdate}
              currentUserName={currentUserName}
              performanceReviews={performanceReviews}
              onReviewSave={onReviewSave}
            />
          )}

          {activeView === 'flight-risk' && (
            <FlightRiskDashboard
              employees={employees}
              departments={departments}
              employeePlans={employeePlans}
              onPlansUpdate={onPlansUpdate}
              onEmployeeUpdate={onEmployeeUpdate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
