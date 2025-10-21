import { X, Clock, Star, Award, TrendingUp, BookOpen, CheckCircle2, Play } from 'lucide-react';
import type { Employee } from '../types';
import type { LearningResource, CourseRecommendation } from '../types/learning';

interface CourseDetailModalProps {
  course: LearningResource;
  recommendation?: CourseRecommendation;
  employee?: Employee;
  isOpen: boolean;
  onClose: () => void;
  onEnroll?: () => void;
  isEnrolled?: boolean;
}

export default function CourseDetailModal({
  course,
  recommendation,
  employee,
  isOpen,
  onClose,
  onEnroll,
  isEnrolled
}: CourseDetailModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded">
                  {course.provider.replace('_', ' ').toUpperCase()}
                </span>
                {course.is_featured && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    Featured
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{course.title}</h2>
              {course.instructor_name && (
                <p className="text-sm text-gray-600 mt-1">
                  Instructed by {course.instructor_name}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Recommendation banner */}
            {recommendation && employee && (
              <div className={`p-4 rounded-lg border ${
                recommendation.priority === 'high' ? 'bg-red-50 border-red-200' :
                recommendation.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-start gap-3">
                  <TrendingUp className={`w-5 h-5 mt-0.5 ${
                    recommendation.priority === 'high' ? 'text-red-600' :
                    recommendation.priority === 'medium' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`} />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">
                      {recommendation.priority.toUpperCase()} PRIORITY for {employee.name}
                    </div>
                    <div className="text-sm text-gray-700">
                      {recommendation.reason}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Key metrics */}
            <div className="grid grid-cols-4 gap-4">
              <MetricCard
                icon={<Clock className="w-5 h-5" />}
                label="Duration"
                value={`${course.duration_hours} hours`}
                color="blue"
              />
              <MetricCard
                icon={<Star className="w-5 h-5" />}
                label="Rating"
                value={course.rating ? `${course.rating}/5.0` : 'N/A'}
                color="yellow"
                subValue={course.review_count ? `${course.review_count} reviews` : undefined}
              />
              <MetricCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="Difficulty"
                value={course.difficulty_level}
                color="purple"
              />
              <MetricCard
                icon={<CheckCircle2 className="w-5 h-5" />}
                label="Completion"
                value={course.completion_rate ? `${Math.round(course.completion_rate * 100)}%` : 'N/A'}
                color="green"
              />
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">About this course</h3>
              <p className="text-gray-700 leading-relaxed">{course.description}</p>
            </div>

            {/* Skills taught */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">What you'll learn</h3>
              <div className="flex flex-wrap gap-2">
                {course.skills_taught.map(skill => (
                  <span
                    key={skill}
                    className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Target audience */}
            {course.target_roles && course.target_roles.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Best for</h3>
                <div className="flex flex-wrap gap-2">
                  {course.target_roles.map(role => (
                    <span
                      key={role}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm capitalize"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Categories and tags */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {course.categories.map(cat => (
                    <span
                      key={cat}
                      className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs capitalize"
                    >
                      {cat.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {course.tags.slice(0, 6).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Course Price</div>
                  {course.is_free ? (
                    <div className="text-2xl font-bold text-green-600">Free</div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-900">
                      ${course.cost} <span className="text-sm font-normal text-gray-500">{course.currency}</span>
                    </div>
                  )}
                </div>

                {course.url && (
                  <a
                    href={course.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                  >
                    <Play className="w-4 h-4" />
                    View on {course.provider.replace('_', ' ')}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              {employee ? `Enrolling ${employee.name}` : 'Select an employee to enroll'}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              {onEnroll && (
                <button
                  onClick={() => {
                    onEnroll();
                    onClose();
                  }}
                  disabled={isEnrolled}
                  className={`px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                    isEnrolled
                      ? 'bg-green-100 text-green-700 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isEnrolled ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Already Enrolled
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4" />
                      Enroll Now
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  color,
  subValue
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'blue' | 'yellow' | 'purple' | 'green';
  subValue?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600'
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className={`p-2 rounded-lg inline-flex mb-2 ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-lg font-semibold text-gray-900 capitalize">{value}</div>
      {subValue && (
        <div className="text-xs text-gray-500 mt-1">{subValue}</div>
      )}
    </div>
  );
}
