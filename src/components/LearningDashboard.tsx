import { useState, useMemo } from 'react';
import {
  BookOpen,
  Play,
  Award,
  TrendingUp,
  Clock,
  Star,
  Search,
  Filter,
  CheckCircle2,
  Target,
  Zap,
  BarChart3
} from 'lucide-react';
import type { Employee, EmployeePlan } from '../types';
import type {
  LearningResource,
  CourseRecommendation,
  LearningEnrollment,
  EmployeeSkill
} from '../types/learning';
import {
  generateCourseRecommendations,
  SAMPLE_LEARNING_LIBRARY
} from '../lib/learningRecommendations';
import SkillsMatrix from './SkillsMatrix';
import CourseDetailModal from './CourseDetailModal';

interface LearningDashboardProps {
  employees: Employee[];
  employeePlans: Record<string, EmployeePlan>;
  onEnroll?: (employeeId: string, resourceId: string) => void;
  onViewCourse?: (resource: LearningResource) => void;
}

export default function LearningDashboard({
  employees,
  employeePlans,
  onEnroll,
  onViewCourse
}: LearningDashboardProps) {
  const [selectedView, setSelectedView] = useState<'recommended' | 'catalog' | 'my-learning' | 'team' | 'skills'>('recommended');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    employees.find(e => e.assessment) || employees[0] || null
  );

  // Course detail modal
  const [selectedCourse, setSelectedCourse] = useState<LearningResource | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<CourseRecommendation | undefined>();
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);

  // Enrollment state (in real app, this would come from database)
  const [enrollments, setEnrollments] = useState<LearningEnrollment[]>([]);

  // Handle enrollment
  const handleEnroll = (employeeId: string, resourceId: string) => {
    // Check if already enrolled
    const existing = enrollments.find(e =>
      e.employee_id === employeeId && e.resource_id === resourceId
    );

    if (existing) {
      return; // Already enrolled
    }

    // Create new enrollment
    const newEnrollment: LearningEnrollment = {
      id: `enrollment-${Date.now()}-${Math.random()}`,
      employee_id: employeeId,
      resource_id: resourceId,
      organization_id: 'org-1', // Would come from context
      enrolled_date: new Date().toISOString(),
      status: 'enrolled',
      progress_percentage: 0,
      time_spent_hours: 0,
      would_recommend: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setEnrollments(prev => [...prev, newEnrollment]);
    onEnroll?.(employeeId, resourceId);
  };

  // Open course detail
  const handleViewCourse = (resource: LearningResource, recommendation?: CourseRecommendation) => {
    setSelectedCourse(resource);
    setSelectedRecommendation(recommendation);
    setIsCourseModalOpen(true);
  };

  // Generate recommendations for selected employee
  const recommendations = useMemo(() => {
    if (!selectedEmployee) return [];

    const plan = employeePlans[selectedEmployee.id];
    const boxPlacement = selectedEmployee.assessment?.box_key;

    // Extract skill gaps from plan objectives
    const skillGaps: string[] = [];
    if (plan?.objectives) {
      plan.objectives.forEach(obj => {
        if (obj.toLowerCase().includes('leadership')) skillGaps.push('Leadership');
        if (obj.toLowerCase().includes('communication')) skillGaps.push('Communication');
        if (obj.toLowerCase().includes('technical')) skillGaps.push('Technical Skills');
        if (obj.toLowerCase().includes('strategic')) skillGaps.push('Strategic Thinking');
        if (obj.toLowerCase().includes('management')) skillGaps.push('Management');
      });
    }

    return generateCourseRecommendations({
      employee: selectedEmployee,
      current_skills: [],
      development_plan: plan,
      box_placement: boxPlacement,
      skill_gaps: skillGaps.length > 0 ? skillGaps : ['Leadership', 'Communication']
    });
  }, [selectedEmployee, employeePlans]);

  // Filter catalog
  const filteredCatalog = useMemo(() => {
    if (!searchQuery) return SAMPLE_LEARNING_LIBRARY;

    const query = searchQuery.toLowerCase();
    return SAMPLE_LEARNING_LIBRARY.filter(resource =>
      resource.title.toLowerCase().includes(query) ||
      resource.description.toLowerCase().includes(query) ||
      resource.skills_taught.some(skill => skill.toLowerCase().includes(query)) ||
      resource.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const stats = useMemo(() => {
    const totalEnrollments = enrollments.length;
    const completedCourses = enrollments.filter(e => e.status === 'completed').length;
    const inProgressCourses = enrollments.filter(e => e.status === 'in_progress').length;
    const totalHours = enrollments.reduce((sum, e) => sum + e.time_spent_hours, 0);

    return {
      totalEnrollments,
      completedCourses,
      inProgressCourses,
      totalHours
    };
  }, [enrollments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Learning & Development</h1>
            <p className="text-sm text-gray-500 mt-1">
              Accelerate growth with personalized learning paths
            </p>
          </div>

          {/* Employee selector */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Learning for:</label>
            <select
              value={selectedEmployee?.id || ''}
              onChange={(e) => {
                const emp = employees.find(emp => emp.id === e.target.value);
                setSelectedEmployee(emp || null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {employees.filter(e => e.assessment).map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} - {emp.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            icon={<BookOpen className="w-5 h-5" />}
            label="Enrollments"
            value={stats.totalEnrollments}
            color="blue"
          />
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            label="Completed"
            value={stats.completedCourses}
            color="green"
          />
          <StatCard
            icon={<Play className="w-5 h-5" />}
            label="In Progress"
            value={stats.inProgressCourses}
            color="purple"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Hours Invested"
            value={Math.round(stats.totalHours)}
            color="orange"
          />
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="bg-white border border-gray-200 rounded-lg p-2 flex gap-2">
        {[
          { key: 'recommended', label: 'Recommended', icon: Zap },
          { key: 'skills', label: 'Skills Matrix', icon: TrendingUp },
          { key: 'catalog', label: 'Course Catalog', icon: BookOpen },
          { key: 'my-learning', label: 'My Learning', icon: Target },
          { key: 'team', label: 'Team Progress', icon: BarChart3 }
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
      {selectedView === 'recommended' && (
        <RecommendedView
          employee={selectedEmployee}
          recommendations={recommendations}
          onViewCourse={(resource, recommendation) => handleViewCourse(resource, recommendation)}
          onEnroll={selectedEmployee ? (resourceId) => handleEnroll(selectedEmployee.id, resourceId) : undefined}
          enrollments={enrollments}
        />
      )}

      {selectedView === 'skills' && selectedEmployee && (
        <SkillsMatrix
          employee={selectedEmployee}
          onSkillClick={(skillName) => {
            // When clicking a skill, filter catalog to show relevant courses
            setSearchQuery(skillName);
            setSelectedView('catalog');
          }}
        />
      )}

      {selectedView === 'catalog' && (
        <CatalogView
          resources={filteredCatalog}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onViewCourse={(resource) => handleViewCourse(resource)}
          onEnroll={selectedEmployee ? (resourceId) => handleEnroll(selectedEmployee.id, resourceId) : undefined}
          selectedEmployee={selectedEmployee}
          enrollments={enrollments}
        />
      )}

      {selectedView === 'my-learning' && (
        <MyLearningView
          employee={selectedEmployee}
          enrollments={enrollments}
          onViewCourse={(resource) => handleViewCourse(resource)}
        />
      )}

      {selectedView === 'team' && (
        <TeamProgressView
          employees={employees}
          enrollments={enrollments}
        />
      )}

      {/* Course Detail Modal */}
      {selectedCourse && (
        <CourseDetailModal
          course={selectedCourse}
          recommendation={selectedRecommendation}
          employee={selectedEmployee || undefined}
          isOpen={isCourseModalOpen}
          onClose={() => {
            setIsCourseModalOpen(false);
            setSelectedCourse(null);
            setSelectedRecommendation(undefined);
          }}
          onEnroll={selectedEmployee ? () => handleEnroll(selectedEmployee.id, selectedCourse.id) : undefined}
          isEnrolled={enrollments.some(e =>
            e.employee_id === selectedEmployee?.id && e.resource_id === selectedCourse.id
          )}
        />
      )}
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

function StatCard({
  icon,
  label,
  value,
  color
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
      <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}

function RecommendedView({
  employee,
  recommendations,
  onViewCourse,
  onEnroll,
  enrollments
}: {
  employee: Employee | null;
  recommendations: CourseRecommendation[];
  onViewCourse?: (resource: LearningResource, recommendation?: CourseRecommendation) => void;
  onEnroll?: (resourceId: string) => void;
  enrollments: LearningEnrollment[];
}) {
  if (!employee) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <p className="text-gray-500">Select an employee to see personalized recommendations</p>
      </div>
    );
  }

  const highPriority = recommendations.filter(r => r.priority === 'high');
  const mediumPriority = recommendations.filter(r => r.priority === 'medium');
  const lowPriority = recommendations.filter(r => r.priority === 'low');

  return (
    <div className="space-y-6">
      {/* Personalization message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Zap className="w-6 h-6 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">
              Personalized recommendations for {employee.name}
            </h3>
            <p className="text-sm text-blue-700">
              Based on {employee.assessment?.box_key} box placement, development plan objectives, and career goals.
            </p>
          </div>
        </div>
      </div>

      {/* High priority recommendations */}
      {highPriority.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-500" />
            High Priority ({highPriority.length})
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {highPriority.map(rec => (
              <CourseCard
                key={rec.resource.id}
                resource={rec.resource}
                recommendation={rec}
                onViewCourse={() => onViewCourse?.(rec.resource, rec)}
                onEnroll={() => onEnroll?.(rec.resource.id)}
                isEnrolled={enrollments.some(e => e.resource_id === rec.resource.id && e.employee_id === employee.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Medium priority */}
      {mediumPriority.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-yellow-500" />
            Recommended ({mediumPriority.length})
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {mediumPriority.slice(0, 4).map(rec => (
              <CourseCard
                key={rec.resource.id}
                resource={rec.resource}
                recommendation={rec}
                onViewCourse={() => onViewCourse?.(rec.resource, rec)}
                onEnroll={() => onEnroll?.(rec.resource.id)}
                isEnrolled={enrollments.some(e => e.resource_id === rec.resource.id && e.employee_id === employee.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Low priority / popular */}
      {lowPriority.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Popular Courses
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {lowPriority.slice(0, 3).map(rec => (
              <CourseCard
                key={rec.resource.id}
                resource={rec.resource}
                recommendation={rec}
                compact
                onViewCourse={() => onViewCourse?.(rec.resource, rec)}
                onEnroll={() => onEnroll?.(rec.resource.id)}
                isEnrolled={enrollments.some(e => e.resource_id === rec.resource.id && e.employee_id === employee.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CatalogView({
  resources,
  searchQuery,
  onSearchChange,
  onViewCourse,
  onEnroll,
  selectedEmployee,
  enrollments
}: {
  resources: LearningResource[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onViewCourse?: (resource: LearningResource) => void;
  onEnroll?: (resourceId: string) => void;
  selectedEmployee: Employee | null;
  enrollments: LearningEnrollment[];
}) {
  return (
    <div className="space-y-6">
      {/* Search & filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search courses, skills, topics..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Course grid */}
      <div className="grid grid-cols-3 gap-4">
        {resources.map(resource => (
          <CourseCard
            key={resource.id}
            resource={resource}
            onViewCourse={() => onViewCourse?.(resource)}
            onEnroll={() => onEnroll?.(resource.id)}
            isEnrolled={selectedEmployee ? enrollments.some(e =>
              e.employee_id === selectedEmployee.id && e.resource_id === resource.id
            ) : false}
          />
        ))}
      </div>

      {resources.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500">No courses found matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
}

function CourseCard({
  resource,
  recommendation,
  compact,
  onViewCourse,
  onEnroll,
  isEnrolled
}: {
  resource: LearningResource;
  recommendation?: CourseRecommendation;
  compact?: boolean;
  onViewCourse?: (resource: LearningResource) => void;
  onEnroll?: () => void;
  isEnrolled?: boolean;
}) {
  const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-blue-100 text-blue-700 border-blue-200'
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
      {/* Provider badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
          {resource.provider.replace('_', ' ').toUpperCase()}
        </span>
        {resource.rating && (
          <div className="flex items-center gap-1 text-sm">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-gray-900">{resource.rating}</span>
            <span className="text-gray-500 text-xs">({resource.review_count})</span>
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
        {resource.title}
      </h3>

      {/* Description */}
      {!compact && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {resource.description}
        </p>
      )}

      {/* Meta info */}
      <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {resource.duration_hours}h
        </div>
        <div className="capitalize">{resource.difficulty_level}</div>
        {!resource.is_free && (
          <div className="font-medium text-gray-900">
            ${resource.cost}
          </div>
        )}
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-1 mb-3">
        {resource.skills_taught.slice(0, 3).map(skill => (
          <span
            key={skill}
            className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded"
          >
            {skill}
          </span>
        ))}
        {resource.skills_taught.length > 3 && (
          <span className="px-2 py-0.5 bg-gray-50 text-gray-600 text-xs rounded">
            +{resource.skills_taught.length - 3}
          </span>
        )}
      </div>

      {/* Recommendation reason */}
      {recommendation && (
        <div className={`px-3 py-2 rounded-lg mb-3 text-xs border ${
          priorityColors[recommendation.priority]
        }`}>
          <div className="font-medium mb-1">{recommendation.priority.toUpperCase()} PRIORITY</div>
          <div>{recommendation.reason}</div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onViewCourse?.(resource)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Details
        </button>
        {onEnroll && (
          <button
            onClick={onEnroll}
            disabled={isEnrolled}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${
              isEnrolled
                ? 'bg-green-100 text-green-700 border border-green-300 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isEnrolled ? (
              <span className="flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Enrolled
              </span>
            ) : (
              'Enroll'
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function MyLearningView({
  employee,
  enrollments,
  onViewCourse
}: {
  employee: Employee | null;
  enrollments: LearningEnrollment[];
  onViewCourse?: (resource: LearningResource) => void;
}) {
  if (!employee) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <p className="text-gray-500">Select an employee to see their learning progress</p>
      </div>
    );
  }

  const employeeEnrollments = enrollments.filter(e => e.employee_id === employee.id);

  if (employeeEnrollments.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-900 font-medium mb-2">No learning activity yet</p>
        <p className="text-gray-500 text-sm">
          Enroll in recommended courses to start your learning journey
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Learning Progress</h2>
        <div className="space-y-4">
          {employeeEnrollments.map(enrollment => {
            // Find the course details from library
            const course = SAMPLE_LEARNING_LIBRARY.find(r => r.id === enrollment.resource_id);

            return (
              <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => course && onViewCourse?.(course)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{course?.title || 'Unknown Course'}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="px-2 py-0.5 bg-gray-100 rounded">
                        {course?.provider.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {course?.duration_hours}h
                      </span>
                      <span>Enrolled {new Date(enrollment.enrolled_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    enrollment.status === 'completed' ? 'bg-green-100 text-green-700' :
                    enrollment.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {enrollment.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-medium text-gray-900">
                      {enrollment.progress_percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${enrollment.progress_percentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{enrollment.time_spent_hours} hours invested</span>
                  {enrollment.completed_date && (
                    <span className="flex items-center gap-1 text-green-600">
                      <Award className="w-4 h-4" />
                      Completed {new Date(enrollment.completed_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TeamProgressView({
  employees,
  enrollments
}: {
  employees: Employee[];
  enrollments: LearningEnrollment[];
}) {
  const teamStats = useMemo(() => {
    const activeEmployees = employees.filter(e => e.assessment).length;
    const employeesWithLearning = new Set(enrollments.map(e => e.employee_id)).size;
    const engagementRate = activeEmployees > 0 ? (employeesWithLearning / activeEmployees) * 100 : 0;
    const totalHours = enrollments.reduce((sum, e) => sum + e.time_spent_hours, 0);
    const avgHoursPerEmployee = employeesWithLearning > 0 ? totalHours / employeesWithLearning : 0;
    const completedCourses = enrollments.filter(e => e.status === 'completed').length;
    const completionRate = enrollments.length > 0 ? (completedCourses / enrollments.length) * 100 : 0;

    return {
      activeEmployees,
      employeesWithLearning,
      engagementRate,
      totalHours,
      avgHoursPerEmployee,
      completedCourses,
      completionRate
    };
  }, [employees, enrollments]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Team Learning Metrics</h2>

        <div className="grid grid-cols-4 gap-6">
          <div>
            <div className="text-3xl font-bold text-blue-600">
              {Math.round(teamStats.engagementRate)}%
            </div>
            <div className="text-sm text-gray-600 mt-1">Engagement Rate</div>
            <div className="text-xs text-gray-500 mt-1">
              {teamStats.employeesWithLearning} of {teamStats.activeEmployees} employees
            </div>
          </div>

          <div>
            <div className="text-3xl font-bold text-green-600">
              {Math.round(teamStats.totalHours)}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Hours</div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.round(teamStats.avgHoursPerEmployee)} avg per employee
            </div>
          </div>

          <div>
            <div className="text-3xl font-bold text-purple-600">
              {teamStats.completedCourses}
            </div>
            <div className="text-sm text-gray-600 mt-1">Completed Courses</div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.round(teamStats.completionRate)}% completion rate
            </div>
          </div>

          <div>
            <div className="text-3xl font-bold text-orange-600">
              {enrollments.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Enrollments</div>
            <div className="text-xs text-gray-500 mt-1">
              Across all team members
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
