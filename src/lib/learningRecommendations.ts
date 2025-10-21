/**
 * Learning Recommendations Engine
 *
 * Intelligently recommends courses and learning paths based on:
 * - Employee box placement and performance
 * - Identified skill gaps
 * - Development plan objectives
 * - Career progression goals
 * - Manager feedback
 */

import type { Employee, EmployeePlan } from '../types';
import type {
  LearningResource,
  CourseRecommendation,
  SmartRecommendationContext,
  EmployeeSkill,
  SkillCategory,
  SkillProficiencyLevel
} from '../types/learning';

// Sample learning resource library (would come from database)
export const SAMPLE_LEARNING_LIBRARY: LearningResource[] = [
  // Technical Leadership
  {
    id: 'lr-001',
    title: 'Technical Leadership Fundamentals',
    description: 'Learn to lead engineering teams, drive technical decisions, and influence without authority.',
    resource_type: 'course',
    provider: 'linkedin_learning',
    duration_hours: 12,
    difficulty_level: 'intermediate',
    skills_taught: ['Technical Leadership', 'Decision Making', 'Influence', 'Team Management'],
    categories: ['leadership', 'technical'],
    tags: ['engineering', 'management', 'leadership'],
    target_roles: ['senior engineer', 'staff engineer', 'engineering manager'],
    recommended_for_box: ['2-3', '3-2', '3-3'], // Emerging leaders, performance leaders, stars
    rating: 4.7,
    review_count: 1240,
    completion_rate: 0.78,
    is_free: false,
    cost: 49.99,
    currency: 'USD',
    instructor_name: 'Pat Kua',
    is_active: true,
    is_featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // Communication Skills
  {
    id: 'lr-002',
    title: 'Executive Communication Skills',
    description: 'Master the art of communicating complex ideas to executives and stakeholders.',
    resource_type: 'course',
    provider: 'coursera',
    duration_hours: 8,
    difficulty_level: 'advanced',
    skills_taught: ['Executive Communication', 'Storytelling', 'Presentation Skills', 'Influence'],
    categories: ['communication', 'leadership'],
    tags: ['communication', 'presentation', 'stakeholder management'],
    target_roles: ['director', 'vp', 'manager'],
    recommended_for_box: ['3-2', '3-3', '2-3'],
    rating: 4.8,
    review_count: 892,
    completion_rate: 0.82,
    is_free: false,
    cost: 79.99,
    currency: 'USD',
    instructor_name: 'Matt Abrahams',
    is_active: true,
    is_featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // Performance Improvement
  {
    id: 'lr-003',
    title: 'Time Management and Productivity Mastery',
    description: 'Proven strategies to improve productivity, manage priorities, and deliver results.',
    resource_type: 'course',
    provider: 'udemy',
    duration_hours: 6,
    difficulty_level: 'beginner',
    skills_taught: ['Time Management', 'Productivity', 'Priority Setting', 'Goal Achievement'],
    categories: ['soft_skills', 'business'],
    tags: ['productivity', 'time management', 'efficiency'],
    target_roles: ['all'],
    recommended_for_box: ['1-1', '1-2', '2-2', '1-3'], // Underperformers and those needing support
    rating: 4.5,
    review_count: 2341,
    completion_rate: 0.71,
    is_free: false,
    cost: 29.99,
    currency: 'USD',
    instructor_name: 'Brian Tracy',
    is_active: true,
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // Strategic Thinking
  {
    id: 'lr-004',
    title: 'Strategic Thinking for Leaders',
    description: 'Develop strategic thinking capabilities to drive business outcomes and long-term vision.',
    resource_type: 'course',
    provider: 'linkedin_learning',
    duration_hours: 10,
    difficulty_level: 'advanced',
    skills_taught: ['Strategic Thinking', 'Business Strategy', 'Decision Making', 'Vision Setting'],
    categories: ['leadership', 'business'],
    tags: ['strategy', 'business', 'leadership', 'vision'],
    target_roles: ['director', 'vp', 'manager', 'senior manager'],
    recommended_for_box: ['3-3', '3-2', '2-3'],
    rating: 4.9,
    review_count: 567,
    completion_rate: 0.85,
    is_free: false,
    cost: 59.99,
    currency: 'USD',
    instructor_name: 'Dorie Clark',
    is_active: true,
    is_featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // Coaching & Mentoring
  {
    id: 'lr-005',
    title: 'Coaching and Developing Employees',
    description: 'Learn how to coach team members, provide effective feedback, and accelerate their growth.',
    resource_type: 'course',
    provider: 'linkedin_learning',
    duration_hours: 5,
    difficulty_level: 'intermediate',
    skills_taught: ['Coaching', 'Mentoring', 'Feedback', 'Employee Development'],
    categories: ['leadership', 'soft_skills'],
    tags: ['coaching', 'mentoring', 'feedback', 'development'],
    target_roles: ['manager', 'director', 'team lead'],
    recommended_for_box: ['2-2', '3-2', '2-3', '3-3'],
    rating: 4.6,
    review_count: 1108,
    completion_rate: 0.79,
    is_free: false,
    cost: 39.99,
    currency: 'USD',
    instructor_name: 'Sara Canaday',
    is_active: true,
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // Conflict Resolution
  {
    id: 'lr-006',
    title: 'Conflict Resolution in the Workplace',
    description: 'Handle difficult conversations, resolve conflicts, and build stronger working relationships.',
    resource_type: 'course',
    provider: 'pluralsight',
    duration_hours: 4,
    difficulty_level: 'beginner',
    skills_taught: ['Conflict Resolution', 'Difficult Conversations', 'Negotiation', 'Emotional Intelligence'],
    categories: ['soft_skills', 'communication'],
    tags: ['conflict', 'resolution', 'communication', 'relationships'],
    target_roles: ['all'],
    recommended_for_box: ['all'],
    rating: 4.4,
    review_count: 723,
    completion_rate: 0.73,
    is_free: false,
    cost: 29.99,
    currency: 'USD',
    instructor_name: 'Marlene Chism',
    is_active: true,
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // Project Management
  {
    id: 'lr-007',
    title: 'Agile Project Management Essentials',
    description: 'Master agile methodologies, sprint planning, and iterative delivery for successful projects.',
    resource_type: 'course',
    provider: 'coursera',
    duration_hours: 15,
    difficulty_level: 'intermediate',
    skills_taught: ['Agile', 'Scrum', 'Project Management', 'Team Coordination'],
    categories: ['technical', 'business'],
    tags: ['agile', 'scrum', 'project management', 'delivery'],
    target_roles: ['project manager', 'product manager', 'team lead', 'engineer'],
    recommended_for_box: ['2-2', '2-3', '3-2'],
    rating: 4.7,
    review_count: 1876,
    completion_rate: 0.68,
    is_free: false,
    cost: 49.99,
    currency: 'USD',
    instructor_name: 'Google',
    is_active: true,
    is_featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // Emotional Intelligence
  {
    id: 'lr-008',
    title: 'Emotional Intelligence for Leaders',
    description: 'Develop self-awareness, empathy, and social skills to become a more effective leader.',
    resource_type: 'course',
    provider: 'linkedin_learning',
    duration_hours: 7,
    difficulty_level: 'intermediate',
    skills_taught: ['Emotional Intelligence', 'Self-Awareness', 'Empathy', 'Relationship Building'],
    categories: ['leadership', 'soft_skills'],
    tags: ['EQ', 'emotional intelligence', 'leadership', 'empathy'],
    target_roles: ['manager', 'director', 'team lead'],
    recommended_for_box: ['all'],
    rating: 4.8,
    review_count: 1453,
    completion_rate: 0.81,
    is_free: false,
    cost: 44.99,
    currency: 'USD',
    instructor_name: 'Gemma Leigh Roberts',
    is_active: true,
    is_featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // Data-Driven Decision Making
  {
    id: 'lr-009',
    title: 'Data-Driven Decision Making',
    description: 'Learn to use data and analytics to make better business decisions and drive results.',
    resource_type: 'course',
    provider: 'coursera',
    duration_hours: 12,
    difficulty_level: 'intermediate',
    skills_taught: ['Data Analysis', 'Decision Making', 'Analytics', 'Business Intelligence'],
    categories: ['business', 'technical'],
    tags: ['data', 'analytics', 'decision making', 'business intelligence'],
    target_roles: ['analyst', 'manager', 'director', 'product manager'],
    recommended_for_box: ['2-3', '3-2', '3-3'],
    rating: 4.6,
    review_count: 934,
    completion_rate: 0.74,
    is_free: false,
    cost: 59.99,
    currency: 'USD',
    instructor_name: 'PwC',
    is_active: true,
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // Career Development
  {
    id: 'lr-010',
    title: 'Career Growth Strategies',
    description: 'Navigate your career path, build your personal brand, and accelerate your professional growth.',
    resource_type: 'course',
    provider: 'udemy',
    duration_hours: 5,
    difficulty_level: 'beginner',
    skills_taught: ['Career Planning', 'Personal Branding', 'Networking', 'Professional Growth'],
    categories: ['soft_skills', 'business'],
    tags: ['career', 'growth', 'branding', 'networking'],
    target_roles: ['all'],
    recommended_for_box: ['1-3', '2-3', '3-3'], // High potential employees
    rating: 4.5,
    review_count: 1645,
    completion_rate: 0.77,
    is_free: false,
    cost: 34.99,
    currency: 'USD',
    instructor_name: 'Linda Raynier',
    is_active: true,
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

/**
 * Generate smart course recommendations for an employee
 */
export function generateCourseRecommendations(
  context: SmartRecommendationContext,
  availableResources: LearningResource[] = SAMPLE_LEARNING_LIBRARY
): CourseRecommendation[] {
  const recommendations: CourseRecommendation[] = [];

  const { employee, current_skills, development_plan, box_placement, skill_gaps } = context;

  // Strategy 1: Recommend based on box placement
  if (box_placement) {
    const boxResources = availableResources.filter(r =>
      r.recommended_for_box?.includes(box_placement)
    );

    boxResources.forEach(resource => {
      const relevanceScore = calculateBoxRelevanceScore(resource, box_placement);
      recommendations.push({
        resource,
        relevance_score: relevanceScore,
        reason: getBoxPlacementReason(box_placement, resource),
        recommended_for: 'box_placement',
        priority: relevanceScore >= 80 ? 'high' : relevanceScore >= 60 ? 'medium' : 'low'
      });
    });
  }

  // Strategy 2: Recommend based on skill gaps
  if (skill_gaps && skill_gaps.length > 0) {
    skill_gaps.forEach(skillGap => {
      const skillResources = availableResources.filter(r =>
        r.skills_taught.some(skill =>
          skill.toLowerCase().includes(skillGap.toLowerCase()) ||
          skillGap.toLowerCase().includes(skill.toLowerCase())
        )
      );

      skillResources.forEach(resource => {
        const relevanceScore = calculateSkillRelevanceScore(resource, skillGap, current_skills);

        // Don't duplicate if already recommended
        if (!recommendations.find(rec => rec.resource.id === resource.id)) {
          recommendations.push({
            resource,
            relevance_score: relevanceScore,
            reason: `Addresses skill gap: ${skillGap}`,
            recommended_for: 'skill_gap',
            priority: relevanceScore >= 85 ? 'high' : relevanceScore >= 70 ? 'medium' : 'low'
          });
        }
      });
    });
  }

  // Strategy 3: Recommend based on development plan objectives
  if (development_plan && development_plan.objectives) {
    development_plan.objectives.forEach((objective: string) => {
      const objectiveResources = availableResources.filter(r =>
        matchesObjective(r, objective)
      );

      objectiveResources.forEach(resource => {
        if (!recommendations.find(rec => rec.resource.id === resource.id)) {
          recommendations.push({
            resource,
            relevance_score: 85,
            reason: `Supports development objective: "${objective.slice(0, 50)}..."`,
            recommended_for: 'development_plan',
            priority: 'high'
          });
        }
      });
    });
  }

  // Strategy 4: Recommend based on role and level
  if (employee.title) {
    const roleResources = availableResources.filter(r =>
      r.target_roles?.some(role =>
        employee.title!.toLowerCase().includes(role.toLowerCase()) ||
        role.toLowerCase().includes(employee.title!.toLowerCase())
      ) || r.target_roles?.includes('all')
    );

    roleResources.forEach(resource => {
      if (!recommendations.find(rec => rec.resource.id === resource.id)) {
        recommendations.push({
          resource,
          relevance_score: 65,
          reason: `Recommended for ${employee.title}`,
          recommended_for: 'career_growth',
          priority: 'medium'
        });
      }
    });
  }

  // Strategy 5: Popular and highly-rated courses
  const popularResources = availableResources
    .filter(r => r.is_featured && r.rating && r.rating >= 4.7)
    .slice(0, 3);

  popularResources.forEach(resource => {
    if (!recommendations.find(rec => rec.resource.id === resource.id)) {
      recommendations.push({
        resource,
        relevance_score: 70,
        reason: `Highly rated (${resource.rating}/5) with ${resource.review_count} reviews`,
        recommended_for: 'popular',
        priority: 'low'
      });
    }
  });

  // Sort by relevance score and priority
  return recommendations.sort((a, b) => {
    // First by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Then by relevance score
    return b.relevance_score - a.relevance_score;
  });
}

function calculateBoxRelevanceScore(resource: LearningResource, boxPlacement: string): number {
  let score = 70; // Base score

  // Higher score for exact match
  if (resource.recommended_for_box?.includes(boxPlacement)) {
    score += 20;
  }

  // Bonus for high rating
  if (resource.rating && resource.rating >= 4.7) {
    score += 5;
  }

  // Bonus for high completion rate
  if (resource.completion_rate && resource.completion_rate >= 0.75) {
    score += 5;
  }

  return Math.min(100, score);
}

function calculateSkillRelevanceScore(
  resource: LearningResource,
  skillGap: string,
  currentSkills: EmployeeSkill[]
): number {
  let score = 75; // Base score for skill match

  // Check if employee already has this skill
  const hasSkill = currentSkills.some(s =>
    resource.skills_taught.some(taught =>
      s.skill_name.toLowerCase() === taught.toLowerCase()
    )
  );

  // If they have the skill, recommend advanced courses
  if (hasSkill) {
    if (resource.difficulty_level === 'advanced' || resource.difficulty_level === 'expert') {
      score += 15;
    } else {
      score -= 10; // Too basic
    }
  } else {
    // If they don't have the skill, recommend beginner/intermediate
    if (resource.difficulty_level === 'beginner' || resource.difficulty_level === 'intermediate') {
      score += 15;
    }
  }

  // Exact skill match
  const exactMatch = resource.skills_taught.some(skill =>
    skill.toLowerCase() === skillGap.toLowerCase()
  );
  if (exactMatch) {
    score += 10;
  }

  return Math.min(100, score);
}

function getBoxPlacementReason(boxPlacement: string, resource: LearningResource): string {
  const boxReasons: Record<string, string> = {
    '1-1': 'Helps build fundamental skills to improve performance',
    '1-2': 'Develops core capabilities to meet expectations',
    '1-3': 'Unlocks high potential with targeted skill development',
    '2-1': 'Maintains strong performance in current role',
    '2-2': 'Supports steady growth and skill expansion',
    '2-3': 'Accelerates leadership development for emerging leaders',
    '3-1': 'Deepens expertise and mastery in specialized areas',
    '3-2': 'Prepares performance leaders for next-level advancement',
    '3-3': 'Develops star talent for executive leadership track'
  };

  return boxReasons[boxPlacement] || 'Recommended for your current level';
}

function matchesObjective(resource: LearningResource, objective: string): boolean {
  const objLower = objective.toLowerCase();

  // Check if any taught skill matches objective
  const skillMatch = resource.skills_taught.some(skill =>
    objLower.includes(skill.toLowerCase()) || skill.toLowerCase().includes(objLower)
  );

  // Check if title or description matches
  const titleMatch = resource.title.toLowerCase().includes(objLower) ||
    objLower.includes(resource.title.toLowerCase());

  const descMatch = resource.description.toLowerCase().includes(objLower);

  return skillMatch || titleMatch || descMatch;
}

/**
 * Create a learning path for specific skill development
 */
export function createSkillLearningPath(
  skillName: string,
  startLevel: SkillProficiencyLevel,
  targetLevel: SkillProficiencyLevel,
  availableResources: LearningResource[] = SAMPLE_LEARNING_LIBRARY
): LearningResource[] {
  // Filter resources that teach this skill
  const relevantResources = availableResources.filter(r =>
    r.skills_taught.some(skill =>
      skill.toLowerCase().includes(skillName.toLowerCase()) ||
      skillName.toLowerCase().includes(skill.toLowerCase())
    )
  );

  // Order by difficulty
  const difficultyOrder: SkillProficiencyLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
  const startIndex = difficultyOrder.indexOf(startLevel);
  const targetIndex = difficultyOrder.indexOf(targetLevel);

  // Select resources from start level to target level
  const path = relevantResources.filter(r => {
    const resourceIndex = difficultyOrder.indexOf(r.difficulty_level);
    return resourceIndex >= startIndex && resourceIndex <= targetIndex;
  });

  // Sort by difficulty
  return path.sort((a, b) => {
    return difficultyOrder.indexOf(a.difficulty_level) - difficultyOrder.indexOf(b.difficulty_level);
  });
}

/**
 * Calculate estimated time to achieve skill proficiency
 */
export function estimateTimeToSkillProficiency(
  startLevel: SkillProficiencyLevel,
  targetLevel: SkillProficiencyLevel,
  learningPath: LearningResource[]
): number {
  const totalHours = learningPath.reduce((sum, resource) => sum + resource.duration_hours, 0);

  // Add practice time (typically 2x the learning time for mastery)
  const practiceMultiplier: Record<string, number> = {
    'beginner-intermediate': 1.5,
    'intermediate-advanced': 2,
    'advanced-expert': 2.5
  };

  const key = `${startLevel}-${targetLevel}`;
  const multiplier = practiceMultiplier[key] || 2;

  return Math.round(totalHours * multiplier);
}
