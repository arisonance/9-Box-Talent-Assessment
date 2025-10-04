import { useState, useEffect } from 'react';
import { X, Mail, MapPin, Briefcase, Building2, User, Calendar, FileText, Sparkles, Loader2, CheckCircle, AlertCircle, Users as UsersIcon, Lock, AlertTriangle, TrendingUp, ClipboardList, Award, PenSquare } from 'lucide-react';
import type { Employee, Department, Performance, Potential, ManagerNote } from '../types';
import { analyzePerformanceReview } from '../lib/reviewAnalyzer';
import ManagerNotes from './ManagerNotes';
import OneOnOneModal from './OneOnOneModal';
import PIPModal from './PIPModal';
import SuccessionPlanningModal from './SuccessionPlanningModal';
import EnhancedEmployeePlanModal from './EnhancedEmployeePlanModal';
import PerformanceReviewModal, { type PerformanceReview } from './PerformanceReviewModal';
import Quick360Modal from './Quick360Modal';

interface EmployeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  department?: Department;
  employeePlan?: any;
  onSavePlan?: (plan: any) => void;
  onUpdateEmployee?: (updatedEmployee: Employee) => void;
  initialTab?: 'details' | 'review' | 'plan' | '360' | 'notes' | 'one-on-one' | 'pip' | 'succession' | 'perf-review';
  initialReviewType?: 'manager' | 'self';
  performanceReviewRecord?: { manager?: PerformanceReview; self?: PerformanceReview };
  onReviewSave?: (review: PerformanceReview) => void;
}

export default function EmployeeDetailModal({
  isOpen,
  onClose,
  employee,
  department,
  employeePlan,
  onSavePlan,
  onUpdateEmployee,
  initialTab = 'details',
  initialReviewType = 'manager',
  performanceReviewRecord,
  onReviewSave,
}: EmployeeDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'review' | 'plan' | '360' | 'notes' | 'one-on-one' | 'pip' | 'succession' | 'perf-review' | 'itp-matrix'>(initialTab);
  const [reviewText, setReviewText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [is360ModalOpen, setIs360ModalOpen] = useState(false);
  const [managerNotes, setManagerNotes] = useState<ManagerNote[]>(employee.manager_notes || []);
  const [isOneOnOneModalOpen, setIsOneOnOneModalOpen] = useState(false);
  const [isPIPModalOpen, setIsPIPModalOpen] = useState(false);
  const [isSuccessionModalOpen, setIsSuccessionModalOpen] = useState(false);
  const [isPerformanceReviewModalOpen, setIsPerformanceReviewModalOpen] = useState(false);
  const [performanceReviewType, setPerformanceReviewType] = useState<'self' | 'manager'>(initialReviewType);
  const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>(() => {
    const record = performanceReviewRecord || {};
    return Object.values(record).filter(Boolean) as PerformanceReview[];
  });
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  useEffect(() => {
    if (performanceReviewRecord) {
      const list = Object.values(performanceReviewRecord).filter(Boolean) as PerformanceReview[];
      setPerformanceReviews(list);
    }
  }, [performanceReviewRecord]);

  // Reset and auto-open performance review modal if initialTab is perf-review
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setPerformanceReviewType(initialReviewType);

      if (initialTab === 'perf-review') {
        // Slight delay to ensure modal is rendered
        setTimeout(() => {
          setIsPerformanceReviewModalOpen(true);
        }, 150);
      } else {
        setIsPerformanceReviewModalOpen(false);
      }
    }
  }, [initialTab, initialReviewType, isOpen]);

  if (!isOpen) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500'
    ];
    const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const handleAnalyzeReview = async () => {
    if (!reviewText.trim()) {
      setAnalysisError('Please enter a performance review to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const analysis = await analyzePerformanceReview(reviewText, employee.name);
      setAnalysisResult(analysis);

      // Auto-apply the assessment to the employee
      if (onUpdateEmployee && analysis.performance && analysis.potential) {
        const updatedEmployee = {
          ...employee,
          assessment: {
            ...employee.assessment,
            performance: analysis.performance,
            potential: analysis.potential,
            box_key: `${analysis.performance}-${analysis.potential}`,
          },
        };
        onUpdateEmployee(updatedEmployee);
      }

      // Auto-create development plan if handler exists
      if (onSavePlan && analysis.actionItems && analysis.actionItems.length > 0) {
        const newPlan = {
          id: employeePlan?.id || `plan-${employee.id}`,
          employee_id: employee.id,
          goals: analysis.actionItems.map((item: any) => item.description).join('\n'),
          action_items: analysis.actionItems.map((item: any, index: number) => ({
            id: `action-${Date.now()}-${index}`,
            description: item.description,
            dueDate: item.dueDate,
            completed: false,
            owner: item.owner || 'Manager',
            priority: item.priority || 'medium',
            status: 'not_started',
            skillArea: item.skillArea,
            estimatedHours: item.estimatedHours,
          })),
          strengths: analysis.strengths?.join('\n') || '',
          development_areas: analysis.developmentAreas?.join('\n') || '',
          success_metrics: analysis.successMetrics?.join('\n') || '',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        onSavePlan(newPlan);
      }

      // Switch to plan tab to show results
      setActiveTab('plan');
    } catch (error) {
      console.error('Error analyzing review:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Failed to analyze review. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getPlanProgress = () => {
    if (!employeePlan?.action_items || employeePlan.action_items.length === 0) return 0;
    const completed = employeePlan.action_items.filter((item: any) => item.completed).length;
    return Math.round((completed / employeePlan.action_items.length) * 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              {/* Avatar */}
              <div className={`w-16 h-16 rounded-full ${getAvatarColor(employee.name)} flex items-center justify-center shadow-lg`}>
                <span className="text-white text-xl font-bold">
                  {getInitials(employee.name)}
                </span>
              </div>

              {/* Employee Info */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{employee.name}</h2>
                {employee.title && (
                  <p className="text-sm text-gray-600 font-medium mt-1">{employee.title}</p>
                )}
                <div className="flex items-center space-x-4 mt-2">
                  {department && (
                    <div className="flex items-center space-x-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: department.color }}
                      />
                      <span className="text-sm text-gray-600">{department.name}</span>
                    </div>
                  )}
                  {employee.assessment && (
                    <>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        📊 {employee.assessment.performance?.charAt(0).toUpperCase() + employee.assessment.performance?.slice(1)} Performance
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        🚀 {employee.assessment.potential?.charAt(0).toUpperCase() + employee.assessment.potential?.slice(1)} Potential
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs - Compact Grid Layout */}
        <div className="grid grid-cols-4 lg:grid-cols-10 gap-1 px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('perf-review')}
            className={`px-3 py-2.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'perf-review'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-indigo-50 border border-gray-200'
            }`}
          >
            <ClipboardList className="w-4 h-4 mx-auto mb-1" />
            <span className="block">Review</span>
            {performanceReviews.length > 0 && (
              <span className="inline-block mt-1 px-1.5 py-0.5 bg-green-500 text-white rounded-full text-[10px] font-bold">
                {performanceReviews.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('itp-matrix')}
            className={`px-3 py-2.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap border-2 ${
              activeTab === 'itp-matrix'
                ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg border-yellow-400'
                : 'bg-gradient-to-br from-blue-50 to-purple-50 text-blue-900 hover:from-blue-100 hover:to-purple-100 border-blue-300'
            }`}
          >
            <UsersIcon className="w-5 h-5 mx-auto mb-1" />
            <span className="block">ITP Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('plan')}
            className={`px-3 py-2.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'plan'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-200'
            }`}
          >
            <FileText className="w-4 h-4 mx-auto mb-1" />
            <span className="block">Dev Plan</span>
          </button>

          <button
            onClick={() => setActiveTab('360')}
            className={`px-3 py-2.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === '360'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-purple-50 border border-gray-200'
            }`}
          >
            <UsersIcon className="w-4 h-4 mx-auto mb-1" />
            <span className="block">360</span>
          </button>

          <button
            onClick={() => setActiveTab('one-on-one')}
            className={`px-3 py-2.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'one-on-one'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-green-50 border border-gray-200'
            }`}
          >
            <Calendar className="w-4 h-4 mx-auto mb-1" />
            <span className="block">1-on-1</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`px-3 py-2.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'notes'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-amber-50 border border-gray-200'
            }`}
          >
            <Lock className="w-4 h-4 mx-auto mb-1" />
            <span className="block">Notes</span>
            {managerNotes.length > 0 && (
              <span className="inline-block mt-1 px-1.5 py-0.5 bg-purple-500 text-white rounded-full text-[10px] font-bold">
                {managerNotes.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('pip')}
            className={`px-3 py-2.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'pip'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-red-50 border border-gray-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 mx-auto mb-1" />
            <span className="block">PIP</span>
          </button>

          <button
            onClick={() => setActiveTab('succession')}
            className={`px-3 py-2.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'succession'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-teal-50 border border-gray-200'
            }`}
          >
            <TrendingUp className="w-4 h-4 mx-auto mb-1" />
            <span className="block">Succession</span>
          </button>

          <button
            onClick={() => setActiveTab('review')}
            className={`px-3 py-2.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'review'
                ? 'bg-pink-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-pink-50 border border-gray-200'
            }`}
          >
            <Sparkles className="w-4 h-4 mx-auto mb-1" />
            <span className="block">Ingest</span>
          </button>

          <button
            onClick={() => setActiveTab('details')}
            className={`px-3 py-2.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'details'
                ? 'bg-gray-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <User className="w-4 h-4 mx-auto mb-1" />
            <span className="block">Details</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>

                  {employee.email && (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Email</p>
                        <p className="text-sm text-gray-900">{employee.email}</p>
                      </div>
                    </div>
                  )}

                  {employee.location && (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Location</p>
                        <p className="text-sm text-gray-900">{employee.location}</p>
                      </div>
                    </div>
                  )}

                  {employee.manager_name && (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Manager</p>
                        <p className="text-sm text-gray-900">{employee.manager_name}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Employment Details</h3>

                  {employee.title && (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Title</p>
                        <p className="text-sm text-gray-900">{employee.title}</p>
                      </div>
                    </div>
                  )}

                  {department && (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Department</p>
                        <p className="text-sm text-gray-900">{department.name}</p>
                      </div>
                    </div>
                  )}

                  {employee.created_at && (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Added</p>
                        <p className="text-sm text-gray-900">
                          {new Date(employee.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Assessment Details */}
              {employee.assessment && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Assessment</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 font-medium mb-1">Performance</p>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                          📊 {employee.assessment.performance?.charAt(0).toUpperCase() + employee.assessment.performance?.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium mb-1">Potential</p>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-green-100 text-green-800 border border-green-300">
                          🚀 {employee.assessment.potential?.charAt(0).toUpperCase() + employee.assessment.potential?.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Review Tab */}
          {activeTab === 'review' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-start space-x-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">AI-Powered Review Analysis</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Paste a performance review below and Claude Sonnet 4 will analyze it to determine performance/potential ratings and generate development plans.
                    </p>
                  </div>
                </div>

                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Paste the employee's performance review here..."
                  className="w-full h-64 px-4 py-3 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />

                {analysisError && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Analysis Error</p>
                      <p className="text-sm text-red-700 mt-1">{analysisError}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleAnalyzeReview}
                  disabled={isAnalyzing || !reviewText.trim()}
                  className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Analyzing Review...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Analyze Review with AI</span>
                    </>
                  )}
                </button>
              </div>

              {/* Analysis Results */}
              {analysisResult && (
                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Analysis Complete</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <p className="text-sm text-gray-600 font-medium mb-2">Performance Rating</p>
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-blue-100 text-blue-800">
                          📊 {analysisResult.performance?.charAt(0).toUpperCase() + analysisResult.performance?.slice(1)}
                        </span>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <p className="text-sm text-gray-600 font-medium mb-2">Potential Rating</p>
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-green-100 text-green-800">
                          🚀 {analysisResult.potential?.charAt(0).toUpperCase() + analysisResult.potential?.slice(1)}
                        </span>
                      </div>
                    </div>

                    {analysisResult.reasoning && (
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <p className="text-sm text-gray-600 font-medium mb-2">Reasoning</p>
                        <p className="text-sm text-gray-700">{analysisResult.reasoning}</p>
                      </div>
                    )}

                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <p className="text-sm text-gray-600 font-medium mb-2">✅ Development plan created with {analysisResult.actionItems?.length || 0} action items</p>
                      <p className="text-xs text-gray-500">Switch to the "Development Plan" tab to view and manage the plan.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Plan Tab */}
          {activeTab === 'plan' && (
            <div className="space-y-6">
              {employeePlan ? (
                <>
                  {/* Plan Overview */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Development Plan Overview</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        employeePlan.status === 'active' ? 'bg-green-100 text-green-800' :
                        employeePlan.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {employeePlan.status?.toUpperCase()}
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                        <span className="text-sm font-bold text-blue-600">{getPlanProgress()}%</span>
                      </div>
                      <div className="h-2 bg-white rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                          style={{ width: `${getPlanProgress()}%` }}
                        />
                      </div>
                    </div>

                    {employeePlan.goals && (
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <p className="text-sm text-gray-600 font-medium mb-2">Goals</p>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{employeePlan.goals}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Items */}
                  {employeePlan.action_items && employeePlan.action_items.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Action Items</h3>
                      <div className="space-y-3">
                        {employeePlan.action_items.map((item: any, index: number) => (
                          <div
                            key={item.id || index}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              item.completed
                                ? 'bg-green-50 border-green-200'
                                : 'bg-white border-gray-200 hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className={`text-sm font-medium ${
                                  item.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                                }`}>
                                  {item.description}
                                </p>
                                <div className="flex items-center space-x-4 mt-2">
                                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                    item.priority === 'high' ? 'bg-red-100 text-red-700' :
                                    item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {item.priority?.toUpperCase()}
                                  </span>
                                  {item.owner && (
                                    <span className="text-xs text-gray-600">👤 {item.owner}</span>
                                  )}
                                  {item.dueDate && (
                                    <span className="text-xs text-gray-600">
                                      📅 {new Date(item.dueDate).toLocaleDateString()}
                                    </span>
                                  )}
                                  {item.skillArea && (
                                    <span className="text-xs text-gray-600">🎯 {item.skillArea}</span>
                                  )}
                                </div>
                              </div>
                              <div className="ml-4">
                                {item.completed ? (
                                  <CheckCircle className="w-6 h-6 text-green-500" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strengths and Development Areas */}
                  <div className="grid grid-cols-2 gap-6">
                    {employeePlan.strengths && (
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <p className="text-sm text-gray-600 font-medium mb-2">💪 Strengths</p>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{employeePlan.strengths}</p>
                      </div>
                    )}
                    {employeePlan.development_areas && (
                      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                        <p className="text-sm text-gray-600 font-medium mb-2">🎯 Development Areas</p>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{employeePlan.development_areas}</p>
                      </div>
                    )}
                  </div>

                  {/* Success Metrics */}
              {employeePlan.success_metrics && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-gray-600 font-medium mb-2">📊 Success Metrics</p>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{employeePlan.success_metrics}</p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setIsPlanModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 mt-4 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <PenSquare className="w-4 h-4" />
                  Refresh or Edit Plan
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Development Plan</h3>
              <p className="text-sm text-gray-600 mb-6">
                This employee doesn't have a development plan yet.
              </p>
              <button
                onClick={() => setIsPlanModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
              >
                Create Plan
              </button>
            </div>
          )}
        </div>
      )}

          {/* 360 Feedback Tab */}
          {activeTab === '360' && (
            <div className="space-y-6">
              <div className="text-center py-12">
                <UsersIcon className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">360-Degree Feedback</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Gather multi-perspective insights from managers, peers, and direct reports.
                </p>
                <button
                  onClick={() => setIs360ModalOpen(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
                >
                  <UsersIcon className="w-5 h-5 inline mr-2" />
                  Launch 360 Survey
                </button>
              </div>
            </div>
          )}

          {/* One-on-One Tab */}
          {activeTab === 'one-on-one' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-center mb-6">
                <Calendar className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  One-on-One Meetings
                </h3>
                <p className="text-gray-600 mb-6">
                  Schedule and manage one-on-one meetings with {employee.name}
                </p>
              </div>
              <button
                onClick={() => setIsOneOnOneModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Manage One-on-One Meetings
              </button>
            </div>
          )}

          {/* PIP Tab */}
          {activeTab === 'pip' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-center mb-6">
                <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Performance Improvement Plan
                </h3>
                <p className="text-gray-600 mb-6 max-w-md">
                  Manage formal performance improvement plans with 30/60/90-day milestones, check-ins, and progress tracking
                </p>
              </div>
              <button
                onClick={() => setIsPIPModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
              >
                <AlertTriangle className="w-5 h-5" />
                Manage PIP
              </button>
            </div>
          )}

          {/* Succession Planning Tab */}
          {activeTab === 'succession' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-center mb-6">
                <TrendingUp className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Succession Planning
                </h3>
                <p className="text-gray-600 mb-6 max-w-md">
                  View succession planning analytics, critical roles, and candidate readiness across your organization
                </p>
              </div>
              <button
                onClick={() => setIsSuccessionModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
              >
                <TrendingUp className="w-5 h-5" />
                Open Succession Planning
              </button>
            </div>
          )}

          {/* Manager Notes Tab */}
          {activeTab === 'notes' && (
            <ManagerNotes
              employeeId={employee.id}
              employeeName={employee.name}
              notes={managerNotes}
              currentUserName="Current Manager"
              onAddNote={(note) => {
                // In real implementation, save to Supabase
                const newNote: ManagerNote = {
                  ...note,
                  id: `note-${Date.now()}`,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
                setManagerNotes([...managerNotes, newNote]);

                // Show alert if requires acknowledgment
                if (note.requires_acknowledgment) {
                  setTimeout(() => {
                    alert(`✉️ Formal feedback sent to ${employee.name}\n\n` +
                          `This feedback requires acknowledgment and has been flagged with ${note.severity?.toUpperCase()} severity.\n\n` +
                          `The employee will see this feedback and must formally acknowledge receipt.`);
                  }, 300);
                }

                // Update employee object if needed
                if (onUpdateEmployee) {
                  onUpdateEmployee({
                    ...employee,
                    manager_notes: [...managerNotes, newNote],
                  });
                }
              }}
              onDeleteNote={(noteId) => {
                // In real implementation, delete from Supabase
                const updatedNotes = managerNotes.filter(n => n.id !== noteId);
                setManagerNotes(updatedNotes);

                // Update employee object if needed
                if (onUpdateEmployee) {
                  onUpdateEmployee({
                    ...employee,
                    manager_notes: updatedNotes,
                  });
                }
              }}
              onAcknowledgeNote={(noteId) => {
                // Employee acknowledges the feedback
                const updatedNotes = managerNotes.map(n =>
                  n.id === noteId
                    ? {
                        ...n,
                        acknowledged_at: new Date().toISOString(),
                        acknowledged_by: employee.name,
                      }
                    : n
                );
                setManagerNotes(updatedNotes);

                // Update employee object
                if (onUpdateEmployee) {
                  onUpdateEmployee({
                    ...employee,
                    manager_notes: updatedNotes,
                  });
                }

                // Show confirmation
                alert(`✅ Feedback acknowledged!\n\nThank you for confirming receipt of this feedback from your manager.`);
              }}
            />
          )}

          {/* Performance Review Tab */}
          {activeTab === 'perf-review' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-8 border-4 border-indigo-300 shadow-xl">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <ClipboardList className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">General Performance Review 2025</h3>
                    <p className="text-base text-gray-700 leading-relaxed">
                      Complete comprehensive performance reviews with self-reflection and manager assessments including the <strong>Ideal Team Player</strong> matrix (Humble, Hungry, Smart).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <button
                    onClick={() => {
                      setPerformanceReviewType('self');
                      setIsPerformanceReviewModalOpen(true);
                    }}
                    className="group px-6 py-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 flex flex-col items-center justify-center space-y-2 border-2 border-green-400"
                  >
                    <User className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    <span className="text-lg">Self-Reflection</span>
                    <span className="text-xs opacity-90">Complete self-assessment</span>
                  </button>

                  <button
                    onClick={() => {
                      setPerformanceReviewType('manager');
                      setIsPerformanceReviewModalOpen(true);
                    }}
                    className="group px-6 py-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 flex flex-col items-center justify-center space-y-2 border-2 border-blue-400"
                  >
                    <UsersIcon className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    <span className="text-lg">Manager Review</span>
                    <span className="text-xs opacity-90">Assess team member performance</span>
                  </button>
                </div>

                <div className="mt-6 bg-white/80 rounded-lg p-4 border-2 border-indigo-200">
                  <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                    <Award className="w-4 h-4 mr-2 text-indigo-600" />
                    What's Included:
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                    <li>Accomplishments, Impact & OKRs</li>
                    <li>Growth & Development Areas</li>
                    <li>Support & Feedback Needs</li>
                    <li><strong>Ideal Team Player Matrix</strong> (Humble, Hungry, Smart)</li>
                    <li>Performance Summary & Additional Comments</li>
                  </ul>
                </div>
              </div>

              {/* Existing Reviews */}
              {performanceReviews.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Review History</h3>
                  <div className="space-y-3">
                    {performanceReviews.map((review) => (
                      <div
                        key={review.id}
                        className="bg-white rounded-lg p-5 border-2 border-gray-200 hover:border-indigo-300 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              {review.review_type === 'self' ? (
                                <User className="w-5 h-5 text-green-600" />
                              ) : (
                                <UsersIcon className="w-5 h-5 text-blue-600" />
                              )}
                              <h4 className="font-semibold text-gray-900">
                                {review.review_type === 'self' ? 'Self-Reflection' : 'Manager Review'}
                              </h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                review.status === 'submitted' || review.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {review.status.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {review.review_type === 'manager' && `Reviewed by: ${review.reviewer_name}`}
                              {review.review_type === 'self' && `Completed by: ${review.employee_name}`}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {review.submitted_at
                                ? `Submitted: ${new Date(review.submitted_at).toLocaleDateString()}`
                                : `Last updated: ${new Date(review.updated_at).toLocaleDateString()}`
                              }
                            </p>

                            {/* Ideal Team Player Scores */}
                            <div className="mt-3 flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-600 font-medium">Humble:</span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">{review.humble_score}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-600 font-medium">Hungry:</span>
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">{review.hungry_score}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-600 font-medium">Smart:</span>
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded">{review.smart_score}</span>
                              </div>
                            </div>

                            {review.manager_performance_summary && (
                              <div className="mt-3">
                                <span className="text-xs text-gray-600 font-medium">Performance Summary: </span>
                                <span className="text-xs text-gray-900 font-semibold">
                                  {review.manager_performance_summary.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              // TODO: Open review in view mode
                              alert('View review details coming soon!');
                            }}
                            className="px-4 py-2 text-sm bg-indigo-100 text-indigo-700 font-medium rounded-lg hover:bg-indigo-200 transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {performanceReviews.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Performance Reviews Yet</h3>
                  <p className="text-sm text-gray-600">
                    Start by creating a manager review or requesting a self-reflection.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ITP Matrix Tab */}
          {activeTab === 'itp-matrix' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-8 border-4 border-purple-300 shadow-xl">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <UsersIcon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Ideal Team Player Matrix</h3>
                    <p className="text-base text-gray-700 leading-relaxed">
                      View comprehensive assessments of Humble, Hungry, and People Smart behaviors with detailed 1-10 scoring across 12 core behaviors.
                    </p>
                  </div>
                </div>

                {/* Existing ITP Assessments */}
                {performanceReviews.length > 0 ? (
                  <div className="space-y-4">
                    {performanceReviews.map((review) => (
                      <div
                        key={review.id}
                        className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-purple-300 transition-all"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            {review.review_type === 'self' ? (
                              <User className="w-6 h-6 text-green-600" />
                            ) : (
                              <UsersIcon className="w-6 h-6 text-blue-600" />
                            )}
                            <div>
                              <h4 className="font-bold text-gray-900 text-lg">
                                {review.review_type === 'self' ? 'Self-Assessment' : 'Manager Assessment'}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {review.submitted_at
                                  ? `Submitted: ${new Date(review.submitted_at).toLocaleDateString()}`
                                  : `Last updated: ${new Date(review.updated_at).toLocaleDateString()}`
                                }
                              </p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            review.status === 'submitted' || review.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {review.status.toUpperCase()}
                          </span>
                        </div>

                        {/* Overall ITP Scores */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                            <div className="text-sm font-medium text-blue-700 mb-1">Humble</div>
                            <div className="text-3xl font-bold text-blue-900">{review.humble_score}</div>
                            <div className="text-xs text-blue-600 mt-1">out of 10</div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                            <div className="text-sm font-medium text-green-700 mb-1">Hungry</div>
                            <div className="text-3xl font-bold text-green-900">{review.hungry_score}</div>
                            <div className="text-xs text-green-600 mt-1">out of 10</div>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
                            <div className="text-sm font-medium text-purple-700 mb-1">People Smart</div>
                            <div className="text-3xl font-bold text-purple-900">{review.smart_score}</div>
                            <div className="text-xs text-purple-600 mt-1">out of 10</div>
                          </div>
                        </div>

                        {/* Detailed Behavior Scores */}
                        {(review.humble_scores || review.hungry_scores || review.smart_scores) && (
                          <div className="space-y-4">
                            {/* Humble Behaviors */}
                            {review.humble_scores && (
                              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <h5 className="font-bold text-blue-900 mb-3 flex items-center">
                                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                                  Humble Behaviors
                                </h5>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-700">Recognition</span>
                                    <span className="px-2 py-1 bg-blue-100 text-blue-900 text-xs font-bold rounded">{review.humble_scores.recognition}/10</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-700">Collaboration</span>
                                    <span className="px-2 py-1 bg-blue-100 text-blue-900 text-xs font-bold rounded">{review.humble_scores.collaboration}/10</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-700">Handling Mistakes</span>
                                    <span className="px-2 py-1 bg-blue-100 text-blue-900 text-xs font-bold rounded">{review.humble_scores.handling_mistakes}/10</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-700">Communication</span>
                                    <span className="px-2 py-1 bg-blue-100 text-blue-900 text-xs font-bold rounded">{review.humble_scores.communication}/10</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Hungry Behaviors */}
                            {review.hungry_scores && (
                              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                <h5 className="font-bold text-green-900 mb-3 flex items-center">
                                  <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                                  Hungry Behaviors
                                </h5>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-700">Initiative</span>
                                    <span className="px-2 py-1 bg-green-100 text-green-900 text-xs font-bold rounded">{review.hungry_scores.initiative}/10</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-700">Commitment</span>
                                    <span className="px-2 py-1 bg-green-100 text-green-900 text-xs font-bold rounded">{review.hungry_scores.commitment}/10</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-700">Discretionary Effort</span>
                                    <span className="px-2 py-1 bg-green-100 text-green-900 text-xs font-bold rounded">{review.hungry_scores.discretionary_effort}/10</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-700">Growth Mindset</span>
                                    <span className="px-2 py-1 bg-green-100 text-green-900 text-xs font-bold rounded">{review.hungry_scores.growth_mindset}/10</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* People Smart Behaviors */}
                            {review.smart_scores && (
                              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                                <h5 className="font-bold text-purple-900 mb-3 flex items-center">
                                  <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                                  People Smart Behaviors
                                </h5>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-700">Situational Awareness</span>
                                    <span className="px-2 py-1 bg-purple-100 text-purple-900 text-xs font-bold rounded">{review.smart_scores.situational_awareness}/10</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-700">Empathy</span>
                                    <span className="px-2 py-1 bg-purple-100 text-purple-900 text-xs font-bold rounded">{review.smart_scores.empathy}/10</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-700">Relationship Building</span>
                                    <span className="px-2 py-1 bg-purple-100 text-purple-900 text-xs font-bold rounded">{review.smart_scores.relationship_building}/10</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-700">Influence</span>
                                    <span className="px-2 py-1 bg-purple-100 text-purple-900 text-xs font-bold rounded">{review.smart_scores.influence}/10</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-purple-300">
                    <UsersIcon className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No ITP Assessments Yet</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Complete a performance review to assess Ideal Team Player behaviors.
                    </p>
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => {
                          setActiveTab('perf-review');
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                      >
                        Start Assessment
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* One-on-One Modal */}
      <OneOnOneModal
        isOpen={isOneOnOneModalOpen}
        onClose={() => setIsOneOnOneModalOpen(false)}
        employee={employee}
        organizationId={employee.organization_id}
        currentUserName="Current Manager"
        currentUserId="mock-manager-123"
      />

      {/* PIP Modal */}
      <PIPModal
        isOpen={isPIPModalOpen}
        onClose={() => setIsPIPModalOpen(false)}
        employee={employee}
        organizationId={employee.organization_id}
        currentUserName="Current Manager"
        currentUserId="mock-manager-123"
        performanceReviews={performanceReviews}
      />

      <EnhancedEmployeePlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        employee={employee}
        department={department}
        onSave={(plan) => {
          onSavePlan?.(plan);
        }}
        existingPlan={employeePlan}
        performanceReviews={performanceReviews}
      />

      <Quick360Modal
        isOpen={is360ModalOpen}
        onClose={() => setIs360ModalOpen(false)}
        employee={employee}
        organizationId={employee.organization_id}
        onSurveyCreated={() => setIs360ModalOpen(false)}
      />

      {/* Succession Planning Modal */}
      <SuccessionPlanningModal
        isOpen={isSuccessionModalOpen}
        onClose={() => setIsSuccessionModalOpen(false)}
        organizationId={employee.organization_id}
        currentUserName="Current Manager"
      />

      {/* Performance Review Modal */}
      <PerformanceReviewModal
        isOpen={isPerformanceReviewModalOpen}
        onClose={() => setIsPerformanceReviewModalOpen(false)}
        employee={employee}
        reviewType={performanceReviewType}
        currentUserName="Current Manager"
        existingReview={performanceReviews.find(r => r.review_type === performanceReviewType)}
        onSave={(review) => {
          setPerformanceReviews(prev => {
            const next = [...prev];
            const existingIndex = next.findIndex(r => r.id === review.id);
            if (existingIndex >= 0) {
              next[existingIndex] = review;
            } else {
              next.push(review);
            }
            return next;
          });
          onReviewSave?.(review);
        }}
      />
    </div>
  );
}
