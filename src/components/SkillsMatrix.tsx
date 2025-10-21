import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Target, Award } from 'lucide-react';
import type { Employee } from '../types';
import type { EmployeeSkill, SkillProficiencyLevel } from '../types/learning';

interface SkillsMatrixProps {
  employee: Employee;
  currentSkills?: EmployeeSkill[];
  targetSkills?: string[];
  onSkillClick?: (skillName: string) => void;
}

export default function SkillsMatrix({
  employee,
  currentSkills = [],
  targetSkills = [],
  onSkillClick
}: SkillsMatrixProps) {
  // Generate skills from employee data and development plan
  const skillsData = useMemo(() => {
    const skills: Array<{
      name: string;
      current: number;
      target: number;
      gap: number;
      category: string;
    }> = [];

    // Extract skills from job requirements
    if (employee.required_skills && employee.required_skills.length > 0) {
      employee.required_skills.forEach(skillName => {
        const existing = currentSkills.find(s => s.skill_name === skillName);
        const currentLevel = existing ? proficiencyToNumber(existing.current_level) : 1;
        const targetLevel = existing?.target_level ? proficiencyToNumber(existing.target_level) : 4;

        skills.push({
          name: skillName,
          current: currentLevel,
          target: targetLevel,
          gap: targetLevel - currentLevel,
          category: existing?.category || 'technical'
        });
      });
    }

    // Add target skills that aren't in current skills
    targetSkills.forEach(skillName => {
      if (!skills.find(s => s.name === skillName)) {
        skills.push({
          name: skillName,
          current: 1,
          target: 3,
          gap: 2,
          category: 'soft_skills'
        });
      }
    });

    // If no skills, add some defaults based on box placement
    if (skills.length === 0) {
      const boxKey = employee.assessment?.box_key;
      const defaultSkills = getDefaultSkillsForBox(boxKey || '2-2');
      skills.push(...defaultSkills);
    }

    return skills.sort((a, b) => b.gap - a.gap); // Sort by gap descending
  }, [employee, currentSkills, targetSkills]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Skills Matrix</h2>
          <p className="text-sm text-gray-500 mt-1">
            Current proficiency vs. target goals for {employee.name}
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-600">Current</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600">Target</span>
          </div>
        </div>
      </div>

      {skillsData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Target className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>No skills defined yet</p>
          <p className="text-sm mt-1">Add skills to the employee profile or development plan</p>
        </div>
      ) : (
        <div className="space-y-4">
          {skillsData.map((skill, idx) => (
            <SkillRow
              key={`${skill.name}-${idx}`}
              skill={skill}
              onClick={() => onSkillClick?.(skill.name)}
            />
          ))}
        </div>
      )}

      {/* Skills summary */}
      {skillsData.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {skillsData.filter(s => s.gap === 0).length}
              </div>
              <div className="text-xs text-gray-500 mt-1">At Target Level</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {skillsData.filter(s => s.gap > 0 && s.gap <= 1).length}
              </div>
              <div className="text-xs text-gray-500 mt-1">Close to Target</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {skillsData.filter(s => s.gap > 1).length}
              </div>
              <div className="text-xs text-gray-500 mt-1">Needs Development</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SkillRow({
  skill,
  onClick
}: {
  skill: {
    name: string;
    current: number;
    target: number;
    gap: number;
    category: string;
  };
  onClick?: () => void;
}) {
  const gapStatus = skill.gap === 0 ? 'on-track' : skill.gap <= 1 ? 'close' : 'needs-work';

  return (
    <div
      className={`p-4 rounded-lg border transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : ''
      } ${
        gapStatus === 'on-track' ? 'bg-green-50 border-green-200' :
        gapStatus === 'close' ? 'bg-yellow-50 border-yellow-200' :
        'bg-red-50 border-red-200'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900">{skill.name}</h3>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded capitalize">
              {skill.category.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <div className="text-gray-600">
              Current: <span className="font-medium text-blue-600">{numberToProficiency(skill.current)}</span>
            </div>
            <div className="text-gray-600">
              Target: <span className="font-medium text-green-600">{numberToProficiency(skill.target)}</span>
            </div>
          </div>
        </div>

        {/* Gap indicator */}
        <div className="flex items-center gap-2">
          {skill.gap > 0 ? (
            <>
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium text-orange-600">
                +{skill.gap} {skill.gap === 1 ? 'level' : 'levels'} to go
              </span>
            </>
          ) : skill.gap < 0 ? (
            <>
              <TrendingDown className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium text-red-600">
                Exceeded target
              </span>
            </>
          ) : (
            <>
              <Award className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-green-600">
                At target level
              </span>
            </>
          )}
        </div>
      </div>

      {/* Visual bar */}
      <div className="relative">
        <div className="flex items-center gap-2">
          {/* Current level bar */}
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all"
                style={{ width: `${(skill.current / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Target marker */}
          <div className="relative" style={{ marginLeft: '-2px' }}>
            <div
              className="absolute bottom-0 w-1 bg-green-500 rounded"
              style={{
                height: '20px',
                left: `${(skill.target / 5) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Level labels */}
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Beginner</span>
          <span>Intermediate</span>
          <span>Advanced</span>
          <span>Expert</span>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function proficiencyToNumber(level: SkillProficiencyLevel): number {
  const map: Record<SkillProficiencyLevel, number> = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
    expert: 4
  };
  return map[level] || 1;
}

function numberToProficiency(num: number): string {
  const map: Record<number, string> = {
    1: 'Beginner',
    2: 'Intermediate',
    3: 'Advanced',
    4: 'Expert',
    5: 'Master'
  };
  return map[num] || 'Beginner';
}

function getDefaultSkillsForBox(boxKey: string): Array<{
  name: string;
  current: number;
  target: number;
  gap: number;
  category: string;
}> {
  // Default skills based on box placement
  const skillsByBox: Record<string, Array<{ name: string; current: number; target: number }>> = {
    '3-3': [
      { name: 'Strategic Thinking', current: 3, target: 4 },
      { name: 'Executive Communication', current: 3, target: 4 },
      { name: 'People Leadership', current: 3, target: 4 }
    ],
    '3-2': [
      { name: 'Technical Leadership', current: 3, target: 4 },
      { name: 'Project Management', current: 3, target: 3 },
      { name: 'Mentoring', current: 2, target: 3 }
    ],
    '2-3': [
      { name: 'Leadership Skills', current: 2, target: 3 },
      { name: 'Influence', current: 2, target: 3 },
      { name: 'Decision Making', current: 2, target: 3 }
    ],
    '1-3': [
      { name: 'Time Management', current: 1, target: 2 },
      { name: 'Communication', current: 2, target: 3 },
      { name: 'Technical Skills', current: 1, target: 3 }
    ],
    '2-2': [
      { name: 'Core Competencies', current: 2, target: 3 },
      { name: 'Collaboration', current: 2, target: 3 },
      { name: 'Problem Solving', current: 2, target: 3 }
    ]
  };

  const skills = skillsByBox[boxKey] || skillsByBox['2-2'];

  return skills.map(s => ({
    ...s,
    gap: s.target - s.current,
    category: 'soft_skills'
  }));
}
