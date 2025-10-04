-- Matrix Organization Schema
-- Adds support for brands, sales channels, and matrix reporting relationships

-- ============================================================================
-- BRANDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#8b5cf6',
  description text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- ============================================================================
-- SALES CHANNELS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sales_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3b82f6',
  description text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- ============================================================================
-- MATRIX RELATIONSHIPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS matrix_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  manager_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  relationship_type text NOT NULL CHECK (relationship_type IN ('primary', 'brand', 'channel', 'functional')),
  entity_id uuid, -- References brand_id or channel_id depending on relationship_type
  entity_type text CHECK (entity_type IN ('brand', 'channel', 'department')),
  allocation_percentage integer DEFAULT 0 CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),
  notes text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  UNIQUE(employee_id, manager_id, relationship_type, entity_id)
);

-- ============================================================================
-- EMPLOYEE BRAND AFFILIATIONS (Many-to-Many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS employee_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT NOW(),
  UNIQUE(employee_id, brand_id)
);

-- ============================================================================
-- EMPLOYEE CHANNEL AFFILIATIONS (Many-to-Many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS employee_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES sales_channels(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT NOW(),
  UNIQUE(employee_id, channel_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_brands_org ON brands(organization_id);
CREATE INDEX IF NOT EXISTS idx_channels_org ON sales_channels(organization_id);
CREATE INDEX IF NOT EXISTS idx_matrix_rel_employee ON matrix_relationships(employee_id);
CREATE INDEX IF NOT EXISTS idx_matrix_rel_manager ON matrix_relationships(manager_id);
CREATE INDEX IF NOT EXISTS idx_matrix_rel_type ON matrix_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_employee_brands_employee ON employee_brands(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_brands_brand ON employee_brands(brand_id);
CREATE INDEX IF NOT EXISTS idx_employee_channels_employee ON employee_channels(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_channels_channel ON employee_channels(channel_id);

-- ============================================================================
-- ADD PRIMARY MANAGER TO EMPLOYEES (if not exists)
-- ============================================================================
-- Add primary_manager_id column to employees if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'employees'
                 AND column_name = 'primary_manager_id') THEN
    ALTER TABLE employees ADD COLUMN primary_manager_id uuid REFERENCES employees(id) ON DELETE SET NULL;
    CREATE INDEX idx_employees_primary_manager ON employees(primary_manager_id);
  END IF;
END $$;

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View: Employee with all matrix relationships
CREATE OR REPLACE VIEW employee_matrix_view AS
SELECT
  e.id,
  e.name,
  e.title,
  e.email,
  e.location,
  e.department_id,
  e.primary_manager_id,
  d.name as department_name,
  d.color as department_color,
  pm.name as primary_manager_name,

  -- Aggregate brands
  COALESCE(
    json_agg(DISTINCT jsonb_build_object(
      'id', b.id,
      'name', b.name,
      'color', b.color,
      'is_primary', eb.is_primary
    )) FILTER (WHERE b.id IS NOT NULL),
    '[]'::json
  ) as brands,

  -- Aggregate channels
  COALESCE(
    json_agg(DISTINCT jsonb_build_object(
      'id', sc.id,
      'name', sc.name,
      'color', sc.color,
      'is_primary', ec.is_primary
    )) FILTER (WHERE sc.id IS NOT NULL),
    '[]'::json
  ) as channels,

  -- Aggregate matrix managers
  COALESCE(
    json_agg(DISTINCT jsonb_build_object(
      'manager_id', mr.manager_id,
      'manager_name', m.name,
      'relationship_type', mr.relationship_type,
      'entity_id', mr.entity_id,
      'entity_type', mr.entity_type,
      'allocation_percentage', mr.allocation_percentage
    )) FILTER (WHERE mr.id IS NOT NULL),
    '[]'::json
  ) as matrix_managers

FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN employees pm ON e.primary_manager_id = pm.id
LEFT JOIN employee_brands eb ON e.id = eb.employee_id
LEFT JOIN brands b ON eb.brand_id = b.id
LEFT JOIN employee_channels ec ON e.id = ec.employee_id
LEFT JOIN sales_channels sc ON ec.channel_id = sc.id
LEFT JOIN matrix_relationships mr ON e.id = mr.employee_id
LEFT JOIN employees m ON mr.manager_id = m.id

GROUP BY
  e.id, e.name, e.title, e.email, e.location,
  e.department_id, e.primary_manager_id,
  d.name, d.color, pm.name;

-- ============================================================================
-- VALIDATION FUNCTIONS
-- ============================================================================

-- Function to check for circular reporting relationships
CREATE OR REPLACE FUNCTION check_circular_reporting(
  p_employee_id uuid,
  p_manager_id uuid
) RETURNS boolean AS $$
DECLARE
  v_current_manager uuid;
  v_depth integer := 0;
  v_max_depth integer := 20;
BEGIN
  v_current_manager := p_manager_id;

  WHILE v_current_manager IS NOT NULL AND v_depth < v_max_depth LOOP
    -- If we find the employee in the chain, it's circular
    IF v_current_manager = p_employee_id THEN
      RETURN false;
    END IF;

    -- Move up the chain
    SELECT primary_manager_id INTO v_current_manager
    FROM employees
    WHERE id = v_current_manager;

    v_depth := v_depth + 1;
  END LOOP;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate total allocation percentage for an employee
CREATE OR REPLACE FUNCTION calculate_total_allocation(p_employee_id uuid)
RETURNS integer AS $$
DECLARE
  v_total integer;
BEGIN
  SELECT COALESCE(SUM(allocation_percentage), 0) INTO v_total
  FROM matrix_relationships
  WHERE employee_id = p_employee_id;

  RETURN v_total;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to prevent circular reporting
CREATE OR REPLACE FUNCTION prevent_circular_reporting()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.relationship_type = 'primary' THEN
    IF NOT check_circular_reporting(NEW.employee_id, NEW.manager_id) THEN
      RAISE EXCEPTION 'Circular reporting relationship detected';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_circular_reporting
  BEFORE INSERT OR UPDATE ON matrix_relationships
  FOR EACH ROW
  EXECUTE FUNCTION prevent_circular_reporting();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_channels_updated_at
  BEFORE UPDATE ON sales_channels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_matrix_rel_updated_at
  BEFORE UPDATE ON matrix_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE brands IS 'Product brands in the organization (iPort, Sonance, James, Blaze, Truefig)';
COMMENT ON TABLE sales_channels IS 'Sales channels (Bugry Residential, Retail, Commercial Audio, iPort Enterprise)';
COMMENT ON TABLE matrix_relationships IS 'Matrix reporting relationships between employees (primary, functional, brand, channel)';
COMMENT ON TABLE employee_brands IS 'Many-to-many relationship between employees and brands they work with';
COMMENT ON TABLE employee_channels IS 'Many-to-many relationship between employees and sales channels they serve';
COMMENT ON VIEW employee_matrix_view IS 'Comprehensive view of employees with all their matrix relationships, brands, and channels';
