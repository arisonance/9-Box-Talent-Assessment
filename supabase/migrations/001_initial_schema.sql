-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Departments table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, name)
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) CHECK (role IN ('org_admin', 'department_manager', 'viewer')) DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Employees table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    manager_name VARCHAR(255),
    title VARCHAR(255),
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, employee_id),
    UNIQUE(organization_id, email)
);

-- Box definitions table
CREATE TABLE box_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    key VARCHAR(50) NOT NULL,
    label VARCHAR(100) NOT NULL,
    description TEXT,
    action_hint TEXT,
    color VARCHAR(7) DEFAULT '#6B7280',
    grid_x INTEGER NOT NULL CHECK (grid_x BETWEEN 0 AND 2),
    grid_y INTEGER NOT NULL CHECK (grid_y BETWEEN 0 AND 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, key),
    UNIQUE(organization_id, grid_x, grid_y)
);

-- Assessments table
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    performance VARCHAR(10) CHECK (performance IN ('low', 'medium', 'high')),
    potential VARCHAR(10) CHECK (potential IN ('low', 'medium', 'high')),
    box_key VARCHAR(50),
    note TEXT,
    assessed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id)
);

-- Indexes for better performance
CREATE INDEX idx_departments_org ON departments(organization_id);
CREATE INDEX idx_employees_org ON employees(organization_id);
CREATE INDEX idx_employees_dept ON employees(department_id);
CREATE INDEX idx_assessments_org ON assessments(organization_id);
CREATE INDEX idx_assessments_employee ON assessments(employee_id);
CREATE INDEX idx_box_definitions_org ON box_definitions(organization_id);

-- Row Level Security (RLS) Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE box_definitions ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view their own organization" ON organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM users WHERE users.id = auth.uid())
    );

CREATE POLICY "Org admins can update their organization" ON organizations
    FOR UPDATE USING (
        id IN (SELECT organization_id FROM users WHERE users.id = auth.uid() AND role = 'org_admin')
    );

-- Departments policies
CREATE POLICY "Users can view departments in their organization" ON departments
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM users WHERE users.id = auth.uid())
    );

CREATE POLICY "Org admins can manage departments" ON departments
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM users WHERE users.id = auth.uid() AND role = 'org_admin')
    );

-- Employees policies
CREATE POLICY "Users can view employees in their organization" ON employees
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM users WHERE users.id = auth.uid())
    );

CREATE POLICY "Managers and admins can manage employees" ON employees
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE users.id = auth.uid() 
            AND role IN ('org_admin', 'department_manager')
        )
    );

-- Assessments policies
CREATE POLICY "Users can view assessments in their organization" ON assessments
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM users WHERE users.id = auth.uid())
    );

CREATE POLICY "Managers and admins can manage assessments" ON assessments
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE users.id = auth.uid() 
            AND role IN ('org_admin', 'department_manager')
        )
    );

-- Box definitions policies
CREATE POLICY "Users can view box definitions" ON box_definitions
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM users WHERE users.id = auth.uid())
        OR organization_id IS NULL
    );

CREATE POLICY "Org admins can manage box definitions" ON box_definitions
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM users WHERE users.id = auth.uid() AND role = 'org_admin')
        OR (organization_id IS NULL AND EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND role = 'org_admin'))
    );

-- Function to insert default box definitions
CREATE OR REPLACE FUNCTION insert_default_box_definitions(org_id UUID DEFAULT NULL)
RETURNS void AS $$
BEGIN
    INSERT INTO box_definitions (organization_id, key, label, description, action_hint, color, grid_x, grid_y) VALUES
    (org_id, 'realign_redirect', 'Realign & Redirect', 'Not delivering; can''t adapt', 'Realign or exit 3–6 mo', '#EF4444', 0, 0),
    (org_id, 'core_foundation', 'Core Foundation', 'Solid; limited potential', 'Focus, motivate, retain', '#F59E0B', 1, 0),
    (org_id, 'master_craftsperson', 'Master Craftsperson', 'Expert; right level', 'Retain; mentor others', '#10B981', 2, 0),
    (org_id, 'evaluate_further', 'Evaluate Further', 'Potential present; not meeting', 'Improve or move 6 mo', '#F59E0B', 0, 1),
    (org_id, 'steady_contributor', 'Steady Contributor', 'Reliable; meets', 'Engage & retain', '#3B82F6', 1, 1),
    (org_id, 'performance_leader', 'Performance Leader', 'Exceptional results', 'Challenge; promote ≤24 mo', '#10B981', 2, 1),
    (org_id, 'rising_talent', 'Rising Talent', 'Underperforming; high potential', 'Coach to performance ≤6 mo', '#A78BFA', 0, 2),
    (org_id, 'emerging_leader', 'Emerging Leader', 'Meets; ready for more', 'Develop; promote ≤24 mo', '#8B5CF6', 1, 2),
    (org_id, 'star_top_talent', 'Star / Top Talent', 'Exceeds; fast learner', 'Challenge; promote ≤12 mo', '#10B981', 2, 2);
END;
$$ LANGUAGE plpgsql;

-- Insert global default box definitions
SELECT insert_default_box_definitions(NULL);

-- Function to compute box_key from performance and potential
CREATE OR REPLACE FUNCTION get_box_key(perf VARCHAR, pot VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    box_keys VARCHAR[][] := ARRAY[
        ['realign_redirect', 'evaluate_further', 'rising_talent'],
        ['core_foundation', 'steady_contributor', 'emerging_leader'],
        ['master_craftsperson', 'performance_leader', 'star_top_talent']
    ];
    x_idx INTEGER;
    y_idx INTEGER;
BEGIN
    -- Map performance to x index
    CASE perf
        WHEN 'low' THEN x_idx := 1;
        WHEN 'medium' THEN x_idx := 2;
        WHEN 'high' THEN x_idx := 3;
        ELSE RETURN NULL;
    END CASE;
    
    -- Map potential to y index
    CASE pot
        WHEN 'low' THEN y_idx := 1;
        WHEN 'medium' THEN y_idx := 2;
        WHEN 'high' THEN y_idx := 3;
        ELSE RETURN NULL;
    END CASE;
    
    RETURN box_keys[x_idx][y_idx];
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-compute box_key
CREATE OR REPLACE FUNCTION update_box_key()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.performance IS NOT NULL AND NEW.potential IS NOT NULL THEN
        NEW.box_key := get_box_key(NEW.performance, NEW.potential);
    END IF;
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assessment_box_key_trigger
    BEFORE INSERT OR UPDATE ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_box_key();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_box_definitions_updated_at BEFORE UPDATE ON box_definitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();