-- ============================================
-- JOB DESCRIPTIONS & ORG HIERARCHY MIGRATION
-- ============================================
-- Adds job description fields and reporting relationships to employees table

-- Add job description fields to employees table
ALTER TABLE employees 
  ADD COLUMN IF NOT EXISTS job_description TEXT,
  ADD COLUMN IF NOT EXISTS key_responsibilities JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS required_skills JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS preferred_qualifications TEXT,
  ADD COLUMN IF NOT EXISTS reports_to_id UUID REFERENCES employees(id) ON DELETE SET NULL;

-- Create index for reporting relationships (for org chart queries)
CREATE INDEX IF NOT EXISTS idx_employees_reports_to ON employees(reports_to_id);

-- Create index for skill searches
CREATE INDEX IF NOT EXISTS idx_employees_skills ON employees USING GIN (required_skills);

-- Add helpful comments
COMMENT ON COLUMN employees.job_description IS 'Full job description text';
COMMENT ON COLUMN employees.key_responsibilities IS 'Array of primary responsibilities as JSON strings';
COMMENT ON COLUMN employees.required_skills IS 'Array of required skills/competencies as JSON strings';
COMMENT ON COLUMN employees.preferred_qualifications IS 'Nice-to-have qualifications or experience';
COMMENT ON COLUMN employees.reports_to_id IS 'Manager employee ID - creates reporting hierarchy for org chart';

-- Create a view for org chart hierarchies
CREATE OR REPLACE VIEW v_employee_hierarchy AS
WITH RECURSIVE emp_hierarchy AS (
  -- Base case: Top-level employees (no manager)
  SELECT 
    e.id,
    e.name,
    e.title,
    e.email,
    e.department_id,
    e.reports_to_id,
    e.organization_id,
    0 as level,
    ARRAY[e.id] as path,
    e.name as path_names
  FROM employees e
  WHERE e.reports_to_id IS NULL
  
  UNION ALL
  
  -- Recursive case: Employees reporting to someone
  SELECT 
    e.id,
    e.name,
    e.title,
    e.email,
    e.department_id,
    e.reports_to_id,
    e.organization_id,
    eh.level + 1,
    eh.path || e.id,
    eh.path_names || ' > ' || e.name
  FROM employees e
  INNER JOIN emp_hierarchy eh ON e.reports_to_id = eh.id
  WHERE NOT (e.id = ANY(eh.path)) -- Prevent infinite loops
)
SELECT 
  eh.*,
  m.name as manager_name,
  m.title as manager_title,
  (SELECT COUNT(*) FROM employees WHERE reports_to_id = eh.id) as direct_report_count
FROM emp_hierarchy eh
LEFT JOIN employees m ON eh.reports_to_id = m.id
ORDER BY eh.level, eh.name;

COMMENT ON VIEW v_employee_hierarchy IS 'Recursive view showing employee reporting hierarchy with levels';

-- Create organization-wide skills library table
CREATE TABLE IF NOT EXISTS skills_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  skill_name VARCHAR(100) NOT NULL,
  category VARCHAR(50), -- 'technical', 'soft_skill', 'domain_knowledge', 'certification', 'language'
  description TEXT,
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id, skill_name)
);

CREATE INDEX IF NOT EXISTS idx_skills_library_org ON skills_library(organization_id);
CREATE INDEX IF NOT EXISTS idx_skills_library_category ON skills_library(category);

COMMENT ON TABLE skills_library IS 'Organization-wide library of skills for autocomplete and standardization';

-- Create job description templates table
CREATE TABLE IF NOT EXISTS job_description_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  title VARCHAR(200) NOT NULL, -- e.g., "Software Engineer", "Product Manager"
  category VARCHAR(50), -- 'engineering', 'product', 'sales', 'marketing', 'operations', 'leadership'
  
  description_template TEXT,
  responsibilities_template JSONB DEFAULT '[]',
  required_skills_template JSONB DEFAULT '[]',
  preferred_qualifications_template TEXT,
  
  is_system_template BOOLEAN DEFAULT false, -- True for built-in templates
  is_active BOOLEAN DEFAULT true,
  
  usage_count INTEGER DEFAULT 0,
  
  created_by VARCHAR(200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_templates_org ON job_description_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_job_templates_active ON job_description_templates(is_active);

COMMENT ON TABLE job_description_templates IS 'Reusable job description templates for common roles';

-- Insert some default skills for the demo
INSERT INTO skills_library (organization_id, skill_name, category, description)
SELECT 
  id,
  skill_name,
  category,
  description
FROM organizations, (VALUES
  ('JavaScript', 'technical', 'Programming language proficiency'),
  ('TypeScript', 'technical', 'TypeScript and type systems'),
  ('React', 'technical', 'React.js framework'),
  ('Python', 'technical', 'Python programming'),
  ('SQL', 'technical', 'Database and SQL queries'),
  ('Leadership', 'soft_skill', 'Team leadership and people management'),
  ('Communication', 'soft_skill', 'Effective verbal and written communication'),
  ('Problem Solving', 'soft_skill', 'Analytical and critical thinking'),
  ('Project Management', 'soft_skill', 'Planning and execution of projects'),
  ('Collaboration', 'soft_skill', 'Cross-functional teamwork'),
  ('Customer Success', 'domain_knowledge', 'Customer relationship management'),
  ('Product Strategy', 'domain_knowledge', 'Product development and strategy'),
  ('Data Analysis', 'domain_knowledge', 'Data interpretation and insights'),
  ('Agile/Scrum', 'domain_knowledge', 'Agile methodologies'),
  ('UI/UX Design', 'domain_knowledge', 'User interface and experience design')
) AS skills(skill_name, category, description)
ON CONFLICT (organization_id, skill_name) DO NOTHING;

-- Insert default job description templates
INSERT INTO job_description_templates (
  organization_id,
  title,
  category,
  description_template,
  responsibilities_template,
  required_skills_template,
  is_system_template
)
SELECT 
  id as organization_id,
  title,
  category,
  description,
  responsibilities::jsonb,
  skills::jsonb,
  true as is_system_template
FROM organizations, (VALUES
  (
    'Software Engineer',
    'engineering',
    'Design, develop, and maintain software applications. Collaborate with cross-functional teams to deliver high-quality solutions.',
    '["Write clean, maintainable code", "Participate in code reviews", "Debug and resolve technical issues", "Collaborate with product and design teams", "Contribute to technical documentation"]',
    '["JavaScript", "TypeScript", "React", "Problem Solving", "Collaboration"]'
  ),
  (
    'Senior Software Engineer',
    'engineering',
    'Lead technical initiatives, mentor junior engineers, and drive architectural decisions. Deliver complex features and improve engineering practices.',
    '["Lead technical design and architecture", "Mentor junior and mid-level engineers", "Drive code quality and best practices", "Collaborate with stakeholders on technical strategy", "Review and improve engineering processes"]',
    '["JavaScript", "TypeScript", "React", "Leadership", "Problem Solving", "Project Management"]'
  ),
  (
    'Product Manager',
    'product',
    'Define product strategy, manage roadmap, and drive execution. Work with engineering, design, and stakeholders to deliver customer value.',
    '["Define product vision and strategy", "Manage product roadmap and backlog", "Gather and prioritize customer requirements", "Collaborate with engineering and design", "Analyze metrics and user feedback", "Present to stakeholders and leadership"]',
    '["Product Strategy", "Communication", "Data Analysis", "Problem Solving", "Agile/Scrum"]'
  ),
  (
    'Engineering Manager',
    'leadership',
    'Build and lead high-performing engineering teams. Balance technical delivery with people development and organizational goals.',
    '["Hire, develop, and retain top engineering talent", "Set team goals and track delivery", "Conduct 1:1s and performance reviews", "Remove blockers and enable team success", "Collaborate with product and other engineering teams", "Drive technical and process improvements"]',
    '["Leadership", "Communication", "Project Management", "JavaScript", "TypeScript", "Problem Solving"]'
  ),
  (
    'Customer Success Manager',
    'sales',
    'Ensure customer satisfaction, drive adoption, and identify growth opportunities. Serve as the voice of the customer internally.',
    '["Onboard new customers", "Drive product adoption and engagement", "Conduct business reviews", "Identify upsell and expansion opportunities", "Resolve customer issues", "Gather and communicate customer feedback"]',
    '["Customer Success", "Communication", "Problem Solving", "Data Analysis", "Collaboration"]'
  )
) AS templates(title, category, description, responsibilities, skills)
ON CONFLICT DO NOTHING;

-- Function to auto-increment skill usage
CREATE OR REPLACE FUNCTION increment_skill_usage(p_organization_id UUID, p_skill_name VARCHAR)
RETURNS void AS $$
BEGIN
  UPDATE skills_library
  SET 
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE organization_id = p_organization_id
    AND skill_name = p_skill_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_skill_usage IS 'Tracks skill usage frequency for better autocomplete suggestions';

