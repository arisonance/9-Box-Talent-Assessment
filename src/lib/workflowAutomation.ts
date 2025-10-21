import type { Employee, EmployeePlan, Assessment } from '../types';
import type { PerformanceReview } from '../components/PerformanceReviewModal';
import type { Survey360, PIP, SuccessionCandidate, ManagerNote } from '../context/DataContext';
import type { AICoachSuggestion } from '../context/TalentAppContext';

// ============================================
// WORKFLOW TRIGGER TYPES
// ============================================

export type TriggerEvent =
  | 'employee_assessed'
  | 'review_completed'
  | 'plan_created'
  | 'plan_overdue'
  | '360_completed'
  | 'flight_risk_detected'
  | 'high_performer_identified'
  | 'pip_started'
  | 'succession_candidate_ready';

export interface WorkflowTrigger {
  event: TriggerEvent;
  condition: (context: WorkflowContext) => boolean;
  suggestions: (context: WorkflowContext) => AICoachSuggestion[];
  priority: 'high' | 'medium' | 'low';
}

export interface WorkflowContext {
  employee: Employee;
  plan?: EmployeePlan;
  reviews?: { self?: PerformanceReview; manager?: PerformanceReview };
  survey360?: Survey360;
  pip?: PIP;
  successionCandidate?: SuccessionCandidate;
  managerNotes?: ManagerNote[];
  oneOnOnes?: any[];
  allEmployees?: Employee[];
  allPlans?: Record<string, EmployeePlan>;
}

// ============================================
// WORKFLOW TRIGGERS CONFIGURATION
// ============================================

export const WORKFLOW_TRIGGERS: WorkflowTrigger[] = [
  // ========================================
  // 1. EMPLOYEE ASSESSED → SUGGEST REVIEW
  // ========================================
  {
    event: 'employee_assessed',
    priority: 'high',
    condition: (ctx) => {
      return Boolean(
        ctx.employee.assessment &&
        !ctx.reviews?.manager
      );
    },
    suggestions: (ctx) => [{
      id: `workflow-review-${ctx.employee.id}`,
      priority: 'high',
      type: 'action',
      title: `${ctx.employee.name} needs a performance review`,
      description: `You've assessed ${ctx.employee.name} on the 9-box grid (${ctx.employee.assessment?.performance}/${ctx.employee.assessment?.potential}). Complete a performance review to document the reasoning.`,
      actions: [
        {
          label: 'Draft review',
          actionType: 'create-review',
          payload: { employeeId: ctx.employee.id }
        }
      ],
      dismissable: true,
      context: { employeeIds: [ctx.employee.id] },
      createdAt: Date.now()
    }]
  },

  // ========================================
  // 2. REVIEW COMPLETE → SUGGEST DEV PLAN
  // ========================================
  {
    event: 'review_completed',
    priority: 'high',
    condition: (ctx) => {
      return Boolean(
        ctx.reviews?.manager &&
        !ctx.plan
      );
    },
    suggestions: (ctx) => [{
      id: `workflow-plan-${ctx.employee.id}`,
      priority: 'high',
      type: 'action',
      title: `Turn ${ctx.employee.name}'s review into a development plan`,
      description: 'Performance review is complete. Create a development plan with action items to drive growth.',
      actions: [
        {
          label: 'AI draft plan',
          actionType: 'create-plan',
          payload: { employeeId: ctx.employee.id }
        }
      ],
      dismissable: true,
      context: { employeeIds: [ctx.employee.id] },
      createdAt: Date.now()
    }]
  },

  // ========================================
  // 3. 360 COMPLETE → UPDATE ASSESSMENT
  // ========================================
  {
    event: '360_completed',
    priority: 'medium',
    condition: (ctx) => {
      return Boolean(
        ctx.survey360?.status === 'completed' &&
        ctx.survey360.summary
      );
    },
    suggestions: (ctx) => {
      const summary = ctx.survey360?.summary;
      const themes = summary?.development_areas?.join(', ') || '';

      return [{
        id: `workflow-360-update-${ctx.employee.id}`,
        priority: 'medium',
        type: 'insight',
        title: `360 feedback complete for ${ctx.employee.name}`,
        description: `Key development areas from 360: ${themes}. Review feedback and update their development plan.`,
        actions: [
          {
            label: 'View 360 results',
            actionType: 'open-employee-detail',
            payload: { employeeId: ctx.employee.id, initialTab: '360' }
          },
          {
            label: 'Update plan',
            actionType: 'create-plan',
            payload: { employeeId: ctx.employee.id }
          }
        ],
        dismissable: true,
        context: { employeeIds: [ctx.employee.id] },
        createdAt: Date.now()
      }];
    }
  },

  // ========================================
  // 4. HIGH-HIGH → SUCCESSION PLANNING
  // ========================================
  {
    event: 'high_performer_identified',
    priority: 'medium',
    condition: (ctx) => {
      const isHighHigh = ctx.employee.assessment?.performance === 'high' &&
        ctx.employee.assessment?.potential === 'high';

      const inSuccession = Boolean(ctx.successionCandidate);

      return isHighHigh && !inSuccession;
    },
    suggestions: (ctx) => [{
      id: `workflow-succession-${ctx.employee.id}`,
      priority: 'medium',
      type: 'action',
      title: `${ctx.employee.name} is high-potential - add to succession pipeline?`,
      description: `${ctx.employee.name} is in the top-right box (high performance, high potential). Consider adding them to the succession pipeline.`,
      actions: [
        {
          label: 'Add to succession',
          actionType: 'add-to-succession',
          payload: { employeeId: ctx.employee.id }
        },
        {
          label: 'View profile',
          actionType: 'open-employee-detail',
          payload: { employeeId: ctx.employee.id }
        }
      ],
      dismissable: true,
      context: { employeeIds: [ctx.employee.id] },
      createdAt: Date.now()
    }]
  },

  // ========================================
  // 5. FLIGHT RISK → RETENTION PLAN
  // ========================================
  {
    event: 'flight_risk_detected',
    priority: 'high',
    condition: (ctx) => {
      const isHighPerformer = ctx.employee.assessment?.performance === 'high';

      const last1on1 = ctx.oneOnOnes?.[0];
      const daysSinceLast1on1 = last1on1
        ? (Date.now() - new Date(last1on1.meeting_date).getTime()) / (1000 * 60 * 60 * 24)
        : 999;

      const no1on1Recently = daysSinceLast1on1 > 45;

      return isHighPerformer && no1on1Recently;
    },
    suggestions: (ctx) => [{
      id: `workflow-flight-risk-${ctx.employee.id}`,
      priority: 'high',
      type: 'warning',
      title: `⚠️ Flight risk: ${ctx.employee.name}`,
      description: `${ctx.employee.name} is a high performer but hasn't had a 1-on-1 in 45+ days. This is a retention risk.`,
      actions: [
        {
          label: 'Schedule 1-on-1',
          actionType: 'schedule-1on1',
          payload: { employeeId: ctx.employee.id }
        },
        {
          label: 'Create retention plan',
          actionType: 'create-plan',
          payload: {
            employeeId: ctx.employee.id,
            planType: 'retention'
          }
        }
      ],
      dismissable: true,
      context: { employeeIds: [ctx.employee.id] },
      createdAt: Date.now()
    }]
  },

  // ========================================
  // 6. PLAN OVERDUE → NUDGE
  // ========================================
  {
    event: 'plan_overdue',
    priority: 'medium',
    condition: (ctx) => {
      if (!ctx.plan?.action_items) return false;

      const hasOverdueItems = ctx.plan.action_items.some(item => {
        if (item.status === 'completed') return false;
        if (!item.due_date) return false;
        return new Date(item.due_date) < new Date();
      });

      return hasOverdueItems;
    },
    suggestions: (ctx) => {
      const overdueCount = ctx.plan?.action_items?.filter(item => {
        if (item.status === 'completed') return false;
        if (!item.due_date) return false;
        return new Date(item.due_date) < new Date();
      }).length || 0;

      return [{
        id: `workflow-plan-overdue-${ctx.employee.id}`,
        priority: 'medium',
        type: 'warning',
        title: `${ctx.employee.name} has ${overdueCount} overdue action item${overdueCount !== 1 ? 's' : ''}`,
        description: `Development plan has overdue items. Check in with ${ctx.employee.name} to unblock progress.`,
        actions: [
          {
            label: 'View plan',
            actionType: 'open-employee-detail',
            payload: { employeeId: ctx.employee.id, initialTab: 'plan' }
          },
          {
            label: 'Schedule check-in',
            actionType: 'schedule-1on1',
            payload: { employeeId: ctx.employee.id }
          }
        ],
        dismissable: true,
        context: { employeeIds: [ctx.employee.id] },
        createdAt: Date.now()
      }];
    }
  },

  // ========================================
  // 7. LOW-LOW → PIP SUGGESTION
  // ========================================
  {
    event: 'pip_started',
    priority: 'high',
    condition: (ctx) => {
      const isLowLow = ctx.employee.assessment?.performance === 'low' &&
        ctx.employee.assessment?.potential === 'low';

      const noPip = !ctx.pip || ctx.pip.status !== 'active';

      return isLowLow && noPip;
    },
    suggestions: (ctx) => [{
      id: `workflow-pip-${ctx.employee.id}`,
      priority: 'high',
      type: 'warning',
      title: `${ctx.employee.name} is in the "Realign & Redirect" box`,
      description: 'Consider starting a Performance Improvement Plan (PIP) or transitioning this employee out.',
      actions: [
        {
          label: 'Start PIP',
          actionType: 'start-pip',
          payload: { employeeId: ctx.employee.id }
        },
        {
          label: 'View profile',
          actionType: 'open-employee-detail',
          payload: { employeeId: ctx.employee.id }
        }
      ],
      dismissable: true,
      context: { employeeIds: [ctx.employee.id] },
      createdAt: Date.now()
    }]
  },
];

// ============================================
// WORKFLOW ENGINE
// ============================================

export class WorkflowEngine {
  private triggers: WorkflowTrigger[];

  constructor(triggers: WorkflowTrigger[] = WORKFLOW_TRIGGERS) {
    this.triggers = triggers;
  }

  /**
   * Evaluate all triggers for a single employee
   */
  evaluateEmployee(context: WorkflowContext): AICoachSuggestion[] {
    const suggestions: AICoachSuggestion[] = [];

    for (const trigger of this.triggers) {
      try {
        if (trigger.condition(context)) {
          const triggerSuggestions = trigger.suggestions(context);
          suggestions.push(...triggerSuggestions);
        }
      } catch (error) {
        console.error(`Error evaluating trigger ${trigger.event}:`, error);
      }
    }

    return suggestions;
  }

  /**
   * Evaluate all employees and generate suggestions
   */
  evaluateAll(data: {
    employees: Employee[];
    employeePlans: Record<string, EmployeePlan>;
    performanceReviews: Record<string, { self?: PerformanceReview; manager?: PerformanceReview }>;
    surveys360: Survey360[];
    pips: Record<string, PIP>;
    successionCandidates: SuccessionCandidate[];
    managerNotes: Record<string, ManagerNote[]>;
    oneOnOnes: Record<string, any[]>;
  }): AICoachSuggestion[] {
    const allSuggestions: AICoachSuggestion[] = [];

    for (const employee of data.employees) {
      const context: WorkflowContext = {
        employee,
        plan: data.employeePlans[employee.id],
        reviews: data.performanceReviews[employee.id],
        survey360: data.surveys360.find(s => s.employee_id === employee.id),
        pip: data.pips[employee.id],
        successionCandidate: data.successionCandidates.find(c => c.employee_id === employee.id),
        managerNotes: data.managerNotes[employee.id],
        oneOnOnes: data.oneOnOnes[employee.id],
        allEmployees: data.employees,
        allPlans: data.employeePlans,
      };

      const suggestions = this.evaluateEmployee(context);
      allSuggestions.push(...suggestions);
    }

    // Sort by priority
    return allSuggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Add a custom trigger
   */
  addTrigger(trigger: WorkflowTrigger) {
    this.triggers.push(trigger);
  }

  /**
   * Remove a trigger by event type
   */
  removeTrigger(event: TriggerEvent) {
    this.triggers = this.triggers.filter(t => t.event !== event);
  }
}

// ============================================
// CROSS-FEATURE INSIGHTS
// ============================================

/**
 * Generate insights that connect multiple features
 */
export function generateCrossFeatureInsights(data: {
  employees: Employee[];
  employeePlans: Record<string, EmployeePlan>;
  performanceReviews: Record<string, { self?: PerformanceReview; manager?: PerformanceReview }>;
  surveys360: Survey360[];
  successionCandidates: SuccessionCandidate[];
}): AICoachSuggestion[] {
  const insights: AICoachSuggestion[] = [];

  // ========================================
  // INSIGHT 1: 360 → Development Plan Gap
  // ========================================
  const completed360s = data.surveys360.filter(s => s.status === 'completed' && s.summary);

  for (const survey of completed360s) {
    const employee = data.employees.find(e => e.id === survey.employee_id);
    if (!employee) continue;

    const plan = data.employeePlans[employee.id];
    const developmentAreas = survey.summary?.development_areas || [];

    // Check if plan addresses 360 themes
    const planAddresses360 = plan?.action_items?.some(item =>
      developmentAreas.some(area =>
        item.description.toLowerCase().includes(area.toLowerCase())
      )
    );

    if (developmentAreas.length > 0 && !planAddresses360) {
      insights.push({
        id: `insight-360-plan-${employee.id}`,
        priority: 'high',
        type: 'insight',
        title: `${employee.name}'s 360 reveals gaps not in development plan`,
        description: `360 feedback identified: ${developmentAreas.slice(0, 2).join(', ')}. ${plan ? 'Update their plan' : 'Create a plan'} to address this feedback.`,
        actions: [
          {
            label: plan ? 'Update plan' : 'Create plan',
            actionType: 'create-plan',
            payload: { employeeId: employee.id }
          },
          {
            label: 'View 360 results',
            actionType: 'open-employee-detail',
            payload: { employeeId: employee.id, initialTab: '360' }
          }
        ],
        dismissable: true,
        context: { employeeIds: [employee.id] },
        createdAt: Date.now()
      });
    }
  }

  // ========================================
  // INSIGHT 2: High-High Without Succession
  // ========================================
  const successionEmployeeIds = new Set(data.successionCandidates.map(c => c.employee_id));
  const highHighWithoutSuccession = data.employees.filter(emp => {
    const isHighHigh = emp.assessment?.performance === 'high' && emp.assessment?.potential === 'high';
    return isHighHigh && !successionEmployeeIds.has(emp.id);
  });

  if (highHighWithoutSuccession.length > 0) {
    const names = highHighWithoutSuccession.slice(0, 3).map(e => e.name).join(', ');
    const more = highHighWithoutSuccession.length > 3 ? ` and ${highHighWithoutSuccession.length - 3} more` : '';

    insights.push({
      id: 'insight-succession-gap',
      priority: 'medium',
      type: 'insight',
      title: `${highHighWithoutSuccession.length} top performer${highHighWithoutSuccession.length !== 1 ? 's' : ''} not in succession pipeline`,
      description: `${names}${more} are high-high but not identified as succession candidates. Add them to the pipeline.`,
      actions: [
        {
          label: 'View succession planning',
          actionType: 'navigate',
          payload: { view: 'succession' }
        }
      ],
      dismissable: true,
      context: { employeeIds: highHighWithoutSuccession.map(e => e.id) },
      createdAt: Date.now()
    });
  }

  // ========================================
  // INSIGHT 3: Review → Job Description Mismatch
  // ========================================
  for (const employee of data.employees) {
    const review = data.performanceReviews[employee.id]?.manager;
    if (!review) continue;

    // If job description doesn't exist or is outdated
    if (!employee.job_description) {
      insights.push({
        id: `insight-jd-missing-${employee.id}`,
        priority: 'low',
        type: 'tip',
        title: `${employee.name} doesn't have a job description`,
        description: 'Complete job descriptions help with performance reviews, hiring, and succession planning.',
        actions: [
          {
            label: 'Add job description',
            actionType: 'open-employee-detail',
            payload: { employeeId: employee.id, initialTab: 'job-description' }
          }
        ],
        dismissable: true,
        context: { employeeIds: [employee.id] },
        createdAt: Date.now()
      });
    }
  }

  return insights;
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const workflowEngine = new WorkflowEngine();
