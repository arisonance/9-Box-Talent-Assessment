import { useState, useEffect } from 'react';
import { X, FileText, Sparkles, TrendingUp, Target, AlertCircle, CheckCircle2, Zap, Key, Brain, Plus, Trash2 } from 'lucide-react';
import { parsePerformanceReview, type ParsedReview } from '../lib/reviewParser';
import { analyzeReviewWithAI, initializeAnthropic, isAnthropicConfigured, type AIAnalysisResult } from '../lib/anthropicService';
import type { Department, Performance, Potential } from '../types';

interface ReviewParserModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  onEmployeeCreated: (employeeData: any, suggestedPlacement: { performance: Performance; potential: Potential }, plan: any) => void;
}

export default function ReviewParserModal({
  isOpen,
  onClose,
  departments,
  onEmployeeCreated
}: ReviewParserModalProps) {
  const [reviewText, setReviewText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedReview | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [useAI, setUseAI] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  
  // Editable fields
  const [editedName, setEditedName] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDepartment, setEditedDepartment] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [editedPerformance, setEditedPerformance] = useState<Performance>('medium');
  const [editedPotential, setEditedPotential] = useState<Potential>('medium');
  
  // Editable plan fields
  const [editedObjectives, setEditedObjectives] = useState<string[]>([]);
  const [editedActionItems, setEditedActionItems] = useState<any[]>([]);
  const [editedSuccessMetrics, setEditedSuccessMetrics] = useState<string[]>([]);
  const [editedTimeline, setEditedTimeline] = useState('90 days');
  
  useEffect(() => {
    if (isOpen) {
      const configured = isAnthropicConfigured();
      setShowApiKeyInput(!configured);
      setUseAI(configured);
    }
  }, [isOpen]);

  const handleAnalyze = async () => {
    if (!reviewText.trim()) return;
    
    setIsAnalyzing(true);
    setAnalysisError('');
    
    try {
      if (useAI) {
        // Use real AI analysis with Claude
        if (apiKey && !isAnthropicConfigured()) {
          initializeAnthropic(apiKey);
        }
        
        const aiResult = await analyzeReviewWithAI(reviewText);
        setAiAnalysis(aiResult);
        setEditedName(aiResult.employeeName);
        setEditedTitle(aiResult.title);
        setEditedDepartment(aiResult.department);
        setEditedEmail(aiResult.email);
        setEditedPerformance(aiResult.suggestedPerformance);
        setEditedPotential(aiResult.suggestedPotential);
        setEditedObjectives(aiResult.objectives);
        setEditedActionItems(aiResult.actionItems);
        setEditedSuccessMetrics(aiResult.successMetrics);
        setEditedTimeline(aiResult.recommendedTimeline);
      } else {
        // Fallback to pattern matching
        const parsed = parsePerformanceReview(reviewText);
        setParsedData(parsed);
        setEditedName(parsed.employeeName);
        setEditedTitle(parsed.title || '');
        setEditedDepartment(parsed.department || '');
        setEditedEmail(parsed.email || '');
        setEditedPerformance(parsed.suggestedPerformance);
        setEditedPotential(parsed.suggestedPotential);
        setEditedObjectives(parsed.objectives);
        setEditedActionItems(parsed.actionItems);
        setEditedSuccessMetrics(parsed.successMetrics);
        setEditedTimeline(parsed.suggestedPerformance === 'low' ? '60 days' : '90 days');
      }
      
      setStep('review');
    } catch (error: any) {
      setAnalysisError(error.message || 'Analysis failed. Please try again.');
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = () => {
    const data = aiAnalysis || parsedData;
    if (!data) return;
    
    const employeeData = {
      name: editedName,
      title: editedTitle,
      email: editedEmail,
      department_id: departments.find(d => 
        d.name.toLowerCase() === editedDepartment.toLowerCase()
      )?.id || null,
    };
    
    const suggestedPlacement = {
      performance: editedPerformance,
      potential: editedPotential
    };
    
    let plan;
    if (aiAnalysis) {
      // Use edited AI-generated plan (allows customization)
      plan = {
        plan_type: editedPerformance === 'low' ? 'performance_improvement' : 
                   editedPotential === 'high' ? 'development' : 'retention',
        title: `${editedName}'s Personalized Development Plan`,
        objectives: editedObjectives.filter(o => o.trim()),
        action_items: editedActionItems.filter(item => {
          const desc = typeof item === 'string' ? item : item.description;
          return desc && desc.trim();
        }).map((item, i) => ({
          id: `action-${i}`,
          description: typeof item === 'string' ? item : item.description,
          dueDate: typeof item === 'string' ? '90 days' : item.dueDate,
          completed: false,
          owner: editedName,
          priority: typeof item === 'string' ? 'medium' : item.priority
        })),
        timeline: editedTimeline,
        success_metrics: editedSuccessMetrics.filter(m => m.trim()),
        notes: `AI-Analyzed Performance Review for Sonance\n\n` +
               `Reasoning: ${aiAnalysis.reasoning}\n\n` +
               `Key Strengths:\n${aiAnalysis.keyStrengths.map(s => '• ' + s).join('\n')}\n\n` +
               `Development Areas:\n${aiAnalysis.developmentAreas.map(d => '• ' + d).join('\n')}\n\n` +
               `Sonance-Specific Insights:\n${aiAnalysis.sonanceSpecificInsights.map(i => '• ' + i).join('\n')}`
      };
    } else if (parsedData) {
      // Use pattern-matched plan
      plan = {
        plan_type: parsedData.planType,
        title: parsedData.planType === 'development' ? 'Development Plan' : 'Performance Improvement Plan',
        objectives: parsedData.objectives,
        action_items: parsedData.actionItems.map((desc, i) => ({
          id: `action-${i}`,
          description: desc,
          completed: false
        })),
        timeline: parsedData.suggestedPerformance === 'low' ? '60 days' : '90 days',
        success_metrics: parsedData.successMetrics,
        notes: `Extracted from performance review\n\nKey Insights:\n${parsedData.keyInsights.join('\n')}`
      };
    }
    
    onEmployeeCreated(employeeData, suggestedPlacement, plan);
    handleClose();
  };

  const handleClose = () => {
    setReviewText('');
    setParsedData(null);
    setAiAnalysis(null);
    setStep('input');
    setAnalysisError('');
    setEditedObjectives([]);
    setEditedActionItems([]);
    setEditedSuccessMetrics([]);
    setEditedTimeline('90 days');
    onClose();
  };

  const getBoxLabel = (perf: Performance, pot: Potential) => {
    if (perf === 'high' && pot === 'high') return 'Star / Top Talent';
    if (perf === 'high' && pot === 'medium') return 'Performance Leader';
    if (perf === 'high' && pot === 'low') return 'Master Craftsperson';
    if (perf === 'medium' && pot === 'high') return 'Emerging Leader';
    if (perf === 'medium' && pot === 'medium') return 'Steady Contributor';
    if (perf === 'medium' && pot === 'low') return 'Core Foundation';
    if (perf === 'low' && pot === 'high') return 'Rising Talent';
    if (perf === 'low' && pot === 'medium') return 'Evaluate Further';
    return 'Realign & Redirect';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 border-b border-gray-200 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">AI Performance Review Parser</h2>
                <p className="text-purple-100 text-sm">
                  Paste a performance review to automatically extract employee data, suggest 9-box placement, and generate a development plan
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'input' && (
            <div className="space-y-6">
              {/* AI Status & API Key */}
              {showApiKeyInput && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                  <div className="flex items-start space-x-3">
                    <Key className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-bold text-purple-900 mb-2">Anthropic API Key Required</h3>
                      <p className="text-sm text-purple-800 mb-3">
                        Enter your Anthropic API key to use AI-powered analysis with Claude. This will provide Sonance-specific insights and personalized development plans.
                      </p>
                      <div className="flex space-x-2">
                        <input
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="sk-ant-..."
                          className="flex-1 px-3 py-2 border border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          onClick={() => {
                            if (apiKey) {
                              const success = initializeAnthropic(apiKey);
                              if (success) {
                                setUseAI(true);
                                setShowApiKeyInput(false);
                              }
                            }
                          }}
                          disabled={!apiKey}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium"
                        >
                          Save
                        </button>
                      </div>
                      <p className="text-xs text-purple-600 mt-2">
                        Get your API key from <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="underline">console.anthropic.com</a>
                      </p>
                      <button
                        onClick={() => {
                          setUseAI(false);
                          setShowApiKeyInput(false);
                        }}
                        className="mt-2 text-xs text-purple-700 hover:text-purple-900 underline"
                      >
                        Continue without AI (use basic pattern matching)
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* AI Mode Indicator */}
              {!showApiKeyInput && (
                <div className={`rounded-xl p-3 border-2 flex items-center justify-between ${
                  useAI ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <Brain className={`w-5 h-5 ${useAI ? 'text-green-600' : 'text-gray-500'}`} />
                    <span className={`font-semibold text-sm ${useAI ? 'text-green-900' : 'text-gray-700'}`}>
                      {useAI ? '✨ AI-Powered Analysis (Claude)' : '📝 Pattern Matching'}
                    </span>
                  </div>
                  {!useAI && (
                    <button
                      onClick={() => setShowApiKeyInput(true)}
                      className="text-xs text-blue-600 hover:text-blue-700 underline font-medium"
                    >
                      Enable AI
                    </button>
                  )}
                </div>
              )}
              
              {/* Error Display */}
              {analysisError && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-red-900">Analysis Error</h3>
                      <p className="text-sm text-red-800 mt-1">{analysisError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                <div className="flex items-start space-x-3">
                  <Zap className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-bold text-blue-900 mb-2">How it works:</h3>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Paste the complete performance review text below</li>
                      <li>Click "Analyze Review" to extract information</li>
                      <li>Review the {useAI ? 'AI' : ''} suggestions and make any adjustments</li>
                      <li>Confirm to create the employee and auto-generate their plan</li>
                    </ol>
                    <p className="text-xs text-blue-700 mt-3 italic">
                      💡 Tip: {useAI ? 'Claude AI will extract Sonance-specific insights and create personalized plans' : 'Include employee name, achievements, challenges, and performance indicators'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Text Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Performance Review Text
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Paste the performance review here...

Example:
Employee: Sarah Johnson
Title: Senior Software Engineer
Department: Engineering

Sarah has been an exceptional performer this year. She consistently exceeded expectations on all major projects, delivering high-quality code ahead of schedule. Her technical leadership and mentoring of junior developers demonstrates strong potential for advancement.

Strengths:
- Exceptional technical skills and problem-solving
- Strong leadership and mentorship abilities
- Takes initiative on challenging projects

Areas for Development:
- Expand cross-functional collaboration
- Develop strategic planning skills..."
                  rows={12}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                />
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {reviewText.length} characters • {reviewText.split(/\s+/).filter(w => w).length} words
                  </span>
                  {reviewText.length > 100 && (
                    <span className="text-xs text-green-600 font-medium">
                      ✓ Sufficient content for analysis
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 'review' && (aiAnalysis || parsedData) && (
            <div className="space-y-6">
              {/* Confidence Banner */}
              <div className={`rounded-xl p-4 border-2 ${
                (aiAnalysis?.confidence || parsedData?.confidence || 70) >= 80 ? 'bg-green-50 border-green-200' :
                (aiAnalysis?.confidence || parsedData?.confidence || 70) >= 60 ? 'bg-yellow-50 border-yellow-200' :
                'bg-orange-50 border-orange-200'
              }`}>
                <div className="flex items-center space-x-3">
                  {aiAnalysis ? <Brain className="w-6 h-6 text-green-600" /> : <CheckCircle2 className={`w-6 h-6 ${getConfidenceColor(parsedData?.confidence || 70)}`} />}
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">
                      {aiAnalysis ? '🧠 AI Analysis Complete' : `Analysis Complete - ${parsedData?.confidence}% Confidence`}
                    </h3>
                    <p className="text-sm text-gray-700">
                      {aiAnalysis ? aiAnalysis.reasoning : 'Review the extracted information below and make any necessary adjustments'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Sonance-Specific Insights (AI Only) */}
              {aiAnalysis && aiAnalysis.sonanceSpecificInsights.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5 border-2 border-purple-200">
                  <h3 className="font-bold text-purple-900 mb-3 flex items-center">
                    <Sparkles className="w-5 h-5 text-purple-600 mr-2" />
                    Sonance-Specific Insights
                  </h3>
                  <div className="space-y-2">
                    {aiAnalysis.sonanceSpecificInsights.map((insight, i) => (
                      <div key={i} className="flex items-start space-x-3 bg-white/60 p-3 rounded-lg">
                        <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-sm text-purple-900 flex-1">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Employee Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Employee Name *
                  </label>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Department
                  </label>
                  <select
                    value={editedDepartment}
                    onChange={(e) => setEditedDepartment(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select department...</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editedEmail}
                    onChange={(e) => setEditedEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* 9-Box Placement Suggestion */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                  <Target className="w-5 h-5 text-indigo-600 mr-2" />
                  Suggested 9-Box Placement
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Performance Level
                    </label>
                    <select
                      value={editedPerformance}
                      onChange={(e) => setEditedPerformance(e.target.value as Performance)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Potential Level
                    </label>
                    <select
                      value={editedPotential}
                      onChange={(e) => setEditedPotential(e.target.value as Potential)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-white rounded-lg border border-indigo-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Will be placed in:</span>
                    <span className="font-bold text-indigo-600 text-lg">
                      {getBoxLabel(editedPerformance, editedPotential)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Insights */}
              {aiAnalysis ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
                      Key Strengths
                    </h3>
                    <div className="bg-green-50 rounded-lg p-4 space-y-2">
                      {aiAnalysis.keyStrengths.map((strength, i) => (
                        <div key={i} className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{strength}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                      <Target className="w-5 h-5 text-orange-600 mr-2" />
                      Development Areas
                    </h3>
                    <div className="bg-orange-50 rounded-lg p-4 space-y-2">
                      {aiAnalysis.developmentAreas.map((area, i) => (
                        <div key={i} className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{area}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : parsedData && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                    <Sparkles className="w-5 h-5 text-purple-600 mr-2" />
                    Key Insights Extracted
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {parsedData.keyInsights.map((insight, i) => (
                      <div key={i} className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Editable Plan */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                  <FileText className="w-5 h-5 text-blue-600 mr-2" />
                  {aiAnalysis ? 'Edit AI-Generated Plan' : 'Edit Plan'}
                </h3>
                
                {/* Timeline */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Timeline
                  </label>
                  <select
                    value={editedTimeline}
                    onChange={(e) => setEditedTimeline(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="30 days">30 days</option>
                    <option value="60 days">60 days</option>
                    <option value="90 days">90 days</option>
                    <option value="6 months">6 months</option>
                    <option value="12 months">12 months</option>
                  </select>
                </div>

                <div className="space-y-4">
                  {/* Editable Objectives */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm text-blue-900">Key Objectives</h4>
                      <button
                        onClick={() => setEditedObjectives([...editedObjectives, ''])}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {editedObjectives.map((obj, i) => (
                        <div key={i} className="flex items-start space-x-2">
                          <input
                            type="text"
                            value={obj}
                            onChange={(e) => {
                              const updated = [...editedObjectives];
                              updated[i] = e.target.value;
                              setEditedObjectives(updated);
                            }}
                            className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter objective..."
                          />
                          <button
                            onClick={() => setEditedObjectives(editedObjectives.filter((_, idx) => idx !== i))}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Editable Action Items */}
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm text-green-900">Action Items</h4>
                      <button
                        onClick={() => setEditedActionItems([...editedActionItems, { description: '', dueDate: '90 days', priority: 'medium' }])}
                        className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </button>
                    </div>
                    <div className="space-y-3">
                      {editedActionItems.map((item, i) => (
                        <div key={i} className="bg-white rounded-lg p-3 border border-green-300">
                          <div className="flex items-start space-x-2 mb-2">
                            <input
                              type="text"
                              value={typeof item === 'string' ? item : item.description}
                              onChange={(e) => {
                                const updated = [...editedActionItems];
                                if (typeof updated[i] === 'string') {
                                  updated[i] = { description: e.target.value, dueDate: '90 days', priority: 'medium' };
                                } else {
                                  updated[i] = { ...updated[i], description: e.target.value };
                                }
                                setEditedActionItems(updated);
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                              placeholder="Action description..."
                            />
                            <button
                              onClick={() => setEditedActionItems(editedActionItems.filter((_, idx) => idx !== i))}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {typeof item !== 'string' && (
                            <div className="flex space-x-2">
                              <select
                                value={item.dueDate}
                                onChange={(e) => {
                                  const updated = [...editedActionItems];
                                  updated[i] = { ...updated[i], dueDate: e.target.value };
                                  setEditedActionItems(updated);
                                }}
                                className="px-2 py-1 border border-gray-300 rounded text-xs"
                              >
                                <option value="30 days">30 days</option>
                                <option value="60 days">60 days</option>
                                <option value="90 days">90 days</option>
                              </select>
                              <select
                                value={item.priority}
                                onChange={(e) => {
                                  const updated = [...editedActionItems];
                                  updated[i] = { ...updated[i], priority: e.target.value };
                                  setEditedActionItems(updated);
                                }}
                                className="px-2 py-1 border border-gray-300 rounded text-xs"
                              >
                                <option value="high">High Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="low">Low Priority</option>
                              </select>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Editable Success Metrics */}
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm text-purple-900">Success Metrics</h4>
                      <button
                        onClick={() => setEditedSuccessMetrics([...editedSuccessMetrics, ''])}
                        className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {editedSuccessMetrics.map((metric, i) => (
                        <div key={i} className="flex items-start space-x-2">
                          <input
                            type="text"
                            value={metric}
                            onChange={(e) => {
                              const updated = [...editedSuccessMetrics];
                              updated[i] = e.target.value;
                              setEditedSuccessMetrics(updated);
                            }}
                            className="flex-1 px-3 py-2 border border-purple-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter success metric..."
                          />
                          <button
                            onClick={() => setEditedSuccessMetrics(editedSuccessMetrics.filter((_, idx) => idx !== i))}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-between items-center">
          <button
            onClick={step === 'review' ? () => setStep('input') : handleClose}
            className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            {step === 'review' ? '← Back' : 'Cancel'}
          </button>
          
          {step === 'input' ? (
            <button
              onClick={handleAnalyze}
              disabled={reviewText.length < 100 || isAnalyzing}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Analyze Review</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={!editedName.trim()}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Create Employee & Generate Plan</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
