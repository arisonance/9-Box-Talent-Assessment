import { ReactNode, MouseEvent } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { MoreVertical, User, MapPin, Mail, FileText, ClipboardList, Users, MessageSquare, Building2, Calendar } from 'lucide-react';
import type { Employee, Department } from '../../types';
import { PerformanceBadge, PotentialBadge, DepartmentBadge, StatusBadge, ProgressBadge } from './BadgeSystem';

interface EmployeeCardUnifiedProps {
  employee: Employee;
  department?: Department;
  variant?: 'grid' | 'list' | 'compact' | 'detailed';
  isDragging?: boolean;
  showMenu?: boolean;
  onEdit?: (employee: Employee) => void;
  onRemove?: (employee: Employee) => void;
  onOpenPlan?: (employee: Employee) => void;
  onCardClick?: (employee: Employee) => void;
  onOpenManagerReview?: (employee: Employee) => void;
  onOpenSelfReview?: (employee: Employee) => void;
  onOpen360?: (employee: Employee) => void;
  employeePlan?: any;
  hasManagerReview?: boolean;
  hasSelfReview?: boolean;
  topRightBadge?: ReactNode;
  bottomBanner?: ReactNode;
  cardClassName?: string;
  enableDrag?: boolean;
}

export default function EmployeeCardUnified({
  employee,
  department,
  variant = 'grid',
  isDragging = false,
  showMenu = true,
  onEdit,
  onRemove,
  onOpenPlan,
  onCardClick,
  onOpenManagerReview,
  onOpenSelfReview,
  onOpen360,
  employeePlan,
  hasManagerReview = false,
  hasSelfReview = false,
  topRightBadge,
  bottomBanner,
  cardClassName = '',
  enableDrag = true,
}: EmployeeCardUnifiedProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isDragActive,
  } = useDraggable({
    id: employee.id,
    data: {
      employee,
      type: 'employee',
    },
    disabled: !enableDrag,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get avatar color based on name hash (consistent across all cards)
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500'
    ];
    const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Calculate plan progress
  const getPlanProgress = () => {
    if (!employeePlan) return null;

    const actionItems = employeePlan.action_items || [];
    if (actionItems.length === 0) return { type: 'no-actions', progress: 0 };

    const completed = actionItems.filter((item: any) => item.completed).length;
    const progress = Math.round((completed / actionItems.length) * 100);

    if (progress === 100) return { type: 'complete', progress };
    if (progress >= 50) return { type: 'in-progress', progress };
    if (progress > 0) return { type: 'started', progress };
    return { type: 'not-started', progress: 0 };
  };

  const planStatus = getPlanProgress();

  const handleCardClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (onCardClick) {
      onCardClick(employee);
    }
  };

  // Variant-specific rendering
  if (variant === 'list') {
    return (
      <div
        ref={enableDrag ? setNodeRef : undefined}
        style={enableDrag ? style : undefined}
        {...(enableDrag ? listeners : {})}
        {...(enableDrag ? attributes : {})}
        onClick={handleCardClick}
        className={`
          group bg-white border-2 border-gray-200 rounded-lg p-4 transition-all cursor-pointer
          hover:border-blue-200 hover:shadow-md
          ${isDragActive ? 'opacity-50 scale-105 z-50 shadow-lg' : ''}
          ${isDragging ? 'opacity-50' : ''}
          ${cardClassName}
        `}
        title="Click to view employee details"
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3 flex-1">
            {/* Avatar */}
            <div className={`w-12 h-12 rounded-full ${getAvatarColor(employee.name)} flex items-center justify-center shadow-md flex-shrink-0`}>
              <span className="text-white text-sm font-bold">
                {getInitials(employee.name)}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center mb-2">
                <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                {employee.employee_id && (
                  <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                    {employee.employee_id}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600">
                {employee.title && (
                  <div className="flex items-center">
                    <Building2 className="w-4 h-4 mr-1.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{employee.title}</span>
                  </div>
                )}
                {employee.email && (
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-1.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{employee.email}</span>
                  </div>
                )}
                {employee.location && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{employee.location}</span>
                  </div>
                )}
                {employee.manager_name && (
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">Manager: {employee.manager_name}</span>
                  </div>
                )}
              </div>

              {/* Assessment badges */}
              {employee.assessment && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {employee.assessment.performance && (
                    <PerformanceBadge performance={employee.assessment.performance} showIcon={false} />
                  )}
                  {employee.assessment.potential && (
                    <PotentialBadge potential={employee.assessment.potential} showIcon={false} />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Department Badge */}
          <div className="flex-shrink-0 ml-4">
            {department && (
              <DepartmentBadge name={department.name} color={department.color} />
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        ref={enableDrag ? setNodeRef : undefined}
        style={enableDrag ? {
          ...style,
          borderLeftColor: department?.color,
          borderLeftWidth: department ? '3px' : undefined,
        } : {
          borderLeftColor: department?.color,
          borderLeftWidth: department ? '3px' : undefined,
        }}
        {...(enableDrag ? listeners : {})}
        {...(enableDrag ? attributes : {})}
        onClick={handleCardClick}
        className={`
          group relative bg-white border border-gray-200 rounded-lg p-3 transition-all duration-200 cursor-pointer
          hover:border-blue-300 hover:shadow-md
          ${isDragActive ? 'opacity-50 scale-105 z-50 shadow-lg' : ''}
          ${isDragging ? 'opacity-50' : ''}
          ${cardClassName}
        `}
        title="Click to view employee details"
      >
        <div className="flex items-start space-x-2">
          {/* Avatar */}
          <div className={`w-8 h-8 rounded-full ${getAvatarColor(employee.name)} flex items-center justify-center shadow-md flex-shrink-0`}>
            <span className="text-white text-[10px] font-bold">
              {getInitials(employee.name)}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {employee.name}
            </p>
            {employee.title && (
              <p className="text-xs text-gray-600 truncate font-medium">
                {employee.title}
              </p>
            )}
            {department && (
              <div className="mt-1">
                <DepartmentBadge name={department.name} color={department.color} size="sm" />
              </div>
            )}
          </div>
        </div>

        {topRightBadge && (
          <div className="absolute top-2 right-2 z-10">
            {topRightBadge}
          </div>
        )}
      </div>
    );
  }

  // Default: grid variant (original EmployeeCard behavior)
  return (
    <div
      ref={enableDrag ? setNodeRef : undefined}
      style={enableDrag ? {
        ...style,
        borderLeftColor: department?.color,
        borderLeftWidth: department ? '3px' : undefined,
      } : {
        borderLeftColor: department?.color,
        borderLeftWidth: department ? '3px' : undefined,
      }}
      {...(enableDrag ? listeners : {})}
      {...(enableDrag ? attributes : {})}
      onClick={handleCardClick}
      className={`
        group relative bg-white border border-gray-200 rounded-lg p-3 transition-all duration-200 cursor-pointer
        hover:border-gray-300 hover:shadow-md hover:border-blue-300
        ${isDragActive ? 'opacity-50 scale-105 z-50 shadow-lg' : ''}
        ${isDragging ? 'opacity-50' : ''}
        ${cardClassName}
      `}
      title="Click to view employee details"
    >
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className={`w-10 h-10 rounded-full ${getAvatarColor(employee.name)} flex items-center justify-center shadow-md`}>
            <span className="text-white text-xs font-bold">
              {getInitials(employee.name)}
            </span>
          </div>
          {/* Plan status indicator badge */}
          {employee.assessment && onOpenPlan && (
            <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-md border-2 border-white ${
              planStatus?.type === 'complete' ? 'bg-green-500' :
              planStatus?.type === 'in-progress' ? 'bg-yellow-500' :
              planStatus?.type === 'started' ? 'bg-blue-500' :
              employeePlan ? 'bg-blue-500' : 'bg-gray-400'
            }`}>
              {planStatus?.type === 'complete' ? (
                <span className="text-white text-xs font-bold">✓</span>
              ) : planStatus?.progress ? (
                <span className="text-white text-[8px] font-bold">{planStatus.progress}%</span>
              ) : (
                <FileText className="w-2.5 h-2.5 text-white" />
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name and Title */}
          <div className="mb-2">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {employee.name}
            </p>
            {employee.title && (
              <p className="text-xs text-gray-600 truncate font-medium">
                {employee.title}
              </p>
            )}
          </div>

          {/* Department and Location */}
          <div className="space-y-1">
            {department && (
              <div className="flex items-center space-x-1">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: department.color }}
                />
                <p className="text-xs text-gray-500 truncate">
                  {department.name}
                </p>
              </div>
            )}

            {employee.location && (
              <div className="flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <p className="text-xs text-gray-500 truncate">
                  {employee.location}
                </p>
              </div>
            )}
          </div>

          {/* Assessment badges */}
          {employee.assessment && (
            <div className="mt-2 flex flex-wrap gap-1">
              {employee.assessment.performance && (
                <PerformanceBadge performance={employee.assessment.performance} size="sm" showIcon={false} />
              )}
              {employee.assessment.potential && (
                <PotentialBadge potential={employee.assessment.potential} size="sm" showIcon={false} />
              )}
            </div>
          )}

          {/* Performance Review Badges */}
          {employee.assessment && (hasManagerReview || hasSelfReview) && (
            <div className="mt-2 flex flex-wrap gap-1">
              {hasManagerReview && (
                <StatusBadge status="completed" size="sm" showIcon={false} />
              )}
              {hasSelfReview && (
                <StatusBadge status="active" size="sm" showIcon={false} />
              )}
            </div>
          )}

          {/* Plan Progress */}
          {planStatus && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600">Plan Progress</span>
                <ProgressBadge progress={planStatus.progress} size="sm" />
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    planStatus.type === 'complete' ? 'bg-green-500' :
                    planStatus.type === 'in-progress' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}
                  style={{ width: `${planStatus.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action buttons - shows for assessed employees */}
        {employee.assessment && (onOpenPlan || onOpenManagerReview || onOpenSelfReview || onOpen360) && (
          <div className="flex-shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onOpen360 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onOpen360(employee);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="flex items-center gap-1 px-2 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded text-xs font-medium transition-all"
                title="Create 360° feedback survey"
              >
                <MessageSquare className="w-3 h-3" />
                <span>360°</span>
              </button>
            )}
            {onOpenManagerReview && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onOpenManagerReview(employee);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                  hasManagerReview
                    ? 'text-purple-700 bg-purple-50 border border-purple-300 hover:bg-purple-100'
                    : 'text-gray-600 bg-gray-50 border border-gray-300 hover:bg-gray-100'
                }`}
                title={hasManagerReview ? "View manager review" : "Create manager review"}
              >
                <ClipboardList className="w-3 h-3" />
                <span>Mgr</span>
              </button>
            )}
            {onOpenSelfReview && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onOpenSelfReview(employee);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                  hasSelfReview
                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100'
                    : 'text-gray-600 bg-gray-50 border border-gray-300 hover:bg-gray-100'
                }`}
                title={hasSelfReview ? "View self review" : "Create self review"}
              >
                <User className="w-3 h-3" />
                <span>Self</span>
              </button>
            )}
            {onOpenPlan && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onOpenPlan(employee);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="flex items-center gap-1 px-2 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded text-xs font-medium transition-all"
                title="Open development plan"
              >
                <FileText className="w-3 h-3" />
                <span>Plan</span>
              </button>
            )}
          </div>
        )}

        {/* Menu button */}
        {showMenu && (onEdit || onRemove) && !employee.assessment && (
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Handle menu options
              }}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Dragging indicator */}
      {isDragActive && (
        <div className="absolute inset-0 bg-blue-50/80 border border-dashed border-blue-400 rounded-lg flex items-center justify-center">
          <div className="text-blue-600 text-xs font-medium bg-white px-2 py-1 rounded shadow-sm">
            Dragging...
          </div>
        </div>
      )}

      {/* Custom top-right badge overlay */}
      {topRightBadge && (
        <div className="absolute top-2 right-2 z-10">
          {topRightBadge}
        </div>
      )}

      {/* Custom bottom banner overlay */}
      {bottomBanner && (
        <div className="absolute bottom-0 left-0 right-0 rounded-b-lg">
          {bottomBanner}
        </div>
      )}
    </div>
  );
}
