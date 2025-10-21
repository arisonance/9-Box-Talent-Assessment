// Learning & Development Platform Types

import type { Employee, ActionItem } from './index';

export type LearningResourceType = 'course' | 'book' | 'certification' | 'video' | 'article' | 'workshop' | 'mentorship' | 'conference';
export type LearningProvider = 'linkedin_learning' | 'coursera' | 'udemy' | 'pluralsight' | 'internal' | 'external' | 'custom';
export type SkillProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type LearningPathStatus = 'not_started' | 'in_progress' | 'completed';
export type EnrollmentStatus = 'enrolled' | 'in_progress' | 'completed' | 'dropped';
export type SkillCategory = 'technical' | 'leadership' | 'communication' | 'business' | 'product' | 'design' | 'soft_skills';

// Learning Resource (Course, Book, etc.)
export interface LearningResource {
  id: string;
  organization_id?: string;

  // Basic info
  title: string;
  description: string;
  resource_type: LearningResourceType;
  provider: LearningProvider;

  // Content details
  duration_hours: number;
  difficulty_level: SkillProficiencyLevel;
  url?: string;
  thumbnail_url?: string;

  // Skills & tags
  skills_taught: string[];
  categories: SkillCategory[];
  tags: string[];

  // Targeting
  target_roles?: string[]; // e.g., ['engineer', 'manager']
  target_levels?: string[]; // e.g., ['senior', 'staff']
  recommended_for_box?: string[]; // e.g., ['1-3', '2-3'] - rising talent, emerging leaders

  // Quality metrics
  rating?: number; // 0-5
  review_count?: number;
  completion_rate?: number; // 0-1

  // Cost
  cost?: number;
  currency?: string;
  is_free: boolean;

  // Provider info
  instructor_name?: string;
  provider_course_id?: string;

  // Metadata
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

// Learning Path (Curated sequence of resources)
export interface LearningPath {
  id: string;
  organization_id: string;

  // Basic info
  path_name: string;
  description: string;
  goal: string; // "Become a technical leader", "Master React", etc.

  // Structure
  resources: LearningPathResource[];
  total_duration_hours: number;

  // Targeting
  target_skill: string;
  start_level: SkillProficiencyLevel;
  end_level: SkillProficiencyLevel;
  target_roles?: string[];
  recommended_for_box?: string[];

  // Metadata
  created_by: string;
  is_template: boolean;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface LearningPathResource {
  id: string;
  resource_id: string;
  resource?: LearningResource;
  sequence_order: number;
  is_required: boolean;
  estimated_weeks: number;
  prerequisites?: string[]; // IDs of other resources in path
}

// Employee Skill (Current proficiency level)
export interface EmployeeSkill {
  id: string;
  employee_id: string;
  organization_id: string;

  // Skill info
  skill_name: string;
  category: SkillCategory;

  // Proficiency
  current_level: SkillProficiencyLevel;
  target_level?: SkillProficiencyLevel;

  // Evidence
  verified_by?: string; // Manager ID or certification ID
  verified_at?: string;
  proof_url?: string; // Certificate, portfolio link

  // Progress tracking
  last_assessed_date: string;
  last_practiced_date?: string;

  // Metadata
  created_at: string;
  updated_at: string;
}

// Enrollment (Employee enrolled in a resource)
export interface LearningEnrollment {
  id: string;
  employee_id: string;
  resource_id: string;
  organization_id: string;

  // Enrollment info
  enrolled_date: string;
  status: EnrollmentStatus;

  // Progress
  progress_percentage: number; // 0-100
  time_spent_hours: number;

  // Completion
  started_date?: string;
  completed_date?: string;
  certificate_url?: string;

  // Linking
  linked_plan_id?: string; // Development plan this supports
  linked_action_item_id?: string;

  // Feedback
  rating?: number; // 0-5
  review?: string;
  would_recommend: boolean;

  // Reminders
  target_completion_date?: string;
  last_reminder_sent?: string;

  created_at: string;
  updated_at: string;
}

// Learning Path Enrollment (Employee enrolled in a path)
export interface LearningPathEnrollment {
  id: string;
  employee_id: string;
  learning_path_id: string;
  organization_id: string;

  // Status
  status: LearningPathStatus;
  enrolled_date: string;

  // Progress
  completed_resources: string[]; // Resource IDs
  current_resource_id?: string;
  progress_percentage: number; // 0-100

  // Completion
  started_date?: string;
  completed_date?: string;

  // Linking
  linked_plan_id?: string;

  // Target
  target_completion_date?: string;

  created_at: string;
  updated_at: string;
}

// Learning Activity Log
export interface LearningActivity {
  id: string;
  employee_id: string;
  organization_id: string;

  // Activity type
  activity_type: 'enrolled' | 'started' | 'progress_update' | 'completed' | 'earned_certificate' | 'skill_leveled_up';

  // Resource
  resource_id?: string;
  resource_title?: string;

  // Details
  description: string;
  progress_before?: number;
  progress_after?: number;

  // Metadata
  activity_date: string;
  created_at: string;
}

// Skill Development Plan (auto-generated or manual)
export interface SkillDevelopmentPlan {
  id: string;
  employee_id: string;
  organization_id: string;

  // Goal
  skill_name: string;
  current_level: SkillProficiencyLevel;
  target_level: SkillProficiencyLevel;
  target_date: string;

  // Resources
  recommended_resources: string[]; // Resource IDs
  enrolled_resources: string[]; // Resource IDs
  completed_resources: string[]; // Resource IDs

  // Learning path
  learning_path_id?: string;

  // Progress
  progress_percentage: number;
  milestones: SkillMilestone[];

  // Status
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';

  // Linking
  linked_employee_plan_id?: string; // Main development plan

  created_at: string;
  updated_at: string;
}

export interface SkillMilestone {
  id: string;
  milestone_name: string;
  target_date: string;
  completed: boolean;
  completed_date?: string;
  evidence?: string; // Project completed, certification earned, etc.
}

// Course Recommendation
export interface CourseRecommendation {
  resource: LearningResource;
  relevance_score: number; // 0-100
  reason: string;
  recommended_for: 'skill_gap' | 'career_growth' | 'box_placement' | 'development_plan' | 'popular';
  priority: 'high' | 'medium' | 'low';
}

// Learning Analytics
export interface EmployeeLearningAnalytics {
  employee_id: string;
  employee_name: string;

  // Overall stats
  total_courses_enrolled: number;
  total_courses_completed: number;
  total_hours_invested: number;
  total_certificates_earned: number;
  completion_rate: number; // 0-1

  // Current activity
  active_enrollments: number;
  in_progress_hours: number;

  // Skills
  skills_gained: string[];
  skills_in_progress: string[];
  current_skill_count: number;
  target_skill_count: number;

  // Engagement
  last_learning_activity?: string;
  avg_hours_per_week: number;
  learning_streak_days: number;

  // Performance correlation
  box_before_learning?: string;
  box_after_learning?: string;
  performance_improvement: boolean;
}

export interface TeamLearningAnalytics {
  team_id: string;
  team_name: string;
  team_size: number;

  // Engagement
  employees_with_active_learning: number;
  engagement_rate: number; // 0-1

  // Progress
  total_team_hours: number;
  avg_hours_per_employee: number;
  total_completions: number;
  team_completion_rate: number; // 0-1

  // Skills
  top_skills_in_development: Array<{ skill: string; employees: number }>;
  skill_coverage_gaps: string[];

  // Resources
  most_popular_courses: Array<{ resource: LearningResource; enrollments: number }>;
  highest_rated_courses: Array<{ resource: LearningResource; rating: number }>;

  // Budget
  total_budget_allocated?: number;
  total_budget_spent?: number;
  budget_remaining?: number;

  // Trends
  learning_trend: 'increasing' | 'stable' | 'decreasing';
  hours_trend_30d: number; // % change
}

export interface OrganizationLearningAnalytics {
  organization_id: string;

  // Overall stats
  total_active_learners: number;
  total_enrollments: number;
  total_completions: number;
  total_hours_invested: number;
  total_certificates: number;

  // Engagement
  org_engagement_rate: number; // 0-1
  avg_completion_rate: number; // 0-1

  // Library
  total_resources: number;
  resources_by_type: Record<LearningResourceType, number>;
  resources_by_provider: Record<LearningProvider, number>;

  // Skills
  most_developed_skills: Array<{ skill: string; learners: number }>;
  emerging_skills: Array<{ skill: string; growth_rate: number }>;

  // Performance impact
  learners_with_promotion: number;
  learners_with_improved_performance: number;
  avg_performance_lift: number; // % in performance score

  // ROI
  total_investment?: number;
  estimated_productivity_gain?: number;
  estimated_retention_value?: number;

  // Trends
  monthly_enrollments: Array<{ month: string; count: number }>;
  monthly_completions: Array<{ month: string; count: number }>;
}

// Course Catalog Filters
export interface CourseCatalogFilters {
  resource_type?: LearningResourceType[];
  provider?: LearningProvider[];
  category?: SkillCategory[];
  difficulty_level?: SkillProficiencyLevel[];
  skills?: string[];
  is_free?: boolean;
  max_duration_hours?: number;
  min_rating?: number;
  target_role?: string;
  recommended_for_box?: string;
  search_query?: string;
}

// Smart Learning Recommendations
export interface SmartRecommendationContext {
  employee: Employee;
  current_skills: EmployeeSkill[];
  development_plan?: any;
  box_placement?: string;
  career_goals?: string[];
  manager_feedback?: string;
  skill_gaps?: string[];
}
