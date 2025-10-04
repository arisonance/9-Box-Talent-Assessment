-- Matrix Organization Seed Data
-- Populates brands, sales channels, and sample matrix relationships

-- ============================================================================
-- BRANDS
-- ============================================================================

-- Get the organization ID (assumes single org from existing seed)
DO $$
DECLARE
  v_org_id uuid;
BEGIN
  SELECT id INTO v_org_id FROM organizations LIMIT 1;

  -- Insert Brands
  INSERT INTO brands (id, organization_id, name, color, description) VALUES
    ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', v_org_id, 'iPort', '#8b5cf6', 'Smart home control systems'),
    ('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', v_org_id, 'Sonance', '#10b981', 'Architectural speakers and audio'),
    ('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', v_org_id, 'James', '#f59e0b', 'Outdoor audio solutions'),
    ('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a', v_org_id, 'Blaze', '#ef4444', 'Outdoor entertainment systems'),
    ('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b', v_org_id, 'Truefig', '#3b82f6', 'Premium audio solutions')
  ON CONFLICT (id) DO NOTHING;

END $$;

-- ============================================================================
-- SALES CHANNELS
-- ============================================================================

DO $$
DECLARE
  v_org_id uuid;
BEGIN
  SELECT id INTO v_org_id FROM organizations LIMIT 1;

  -- Insert Sales Channels
  INSERT INTO sales_channels (id, organization_id, name, color, description) VALUES
    ('f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c', v_org_id, 'Bugry Residential', '#ec4899', 'Residential custom integration channel'),
    ('a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d', v_org_id, 'Retail', '#06b6d4', 'Retail and consumer sales'),
    ('b8c9d0e1-f2a3-4b5c-5d6e-7f8a9b0c1d2e', v_org_id, 'Commercial Audio', '#8b5cf6', 'Commercial AV and sound systems'),
    ('c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', v_org_id, 'iPort Enterprise', '#6366f1', 'Enterprise smart building solutions')
  ON CONFLICT (id) DO NOTHING;

END $$;

-- ============================================================================
-- SAMPLE MATRIX RELATIONSHIPS
-- ============================================================================

-- This creates realistic matrix relationships for the seeded employees
DO $$
DECLARE
  v_org_id uuid;
  v_ceo_id uuid;
  v_vp_eng_id uuid;
  v_vp_sales_id uuid;
  v_vp_ops_id uuid;
  v_dir_hr_id uuid;
  v_eng1_id uuid;
  v_eng2_id uuid;
  v_sales1_id uuid;
  v_sales2_id uuid;
  v_brand_iport uuid;
  v_brand_sonance uuid;
  v_brand_james uuid;
  v_channel_residential uuid;
  v_channel_retail uuid;
  v_channel_commercial uuid;
  v_dept_eng uuid;
  v_dept_sales uuid;
BEGIN
  -- Get organization ID
  SELECT id INTO v_org_id FROM organizations LIMIT 1;

  -- Get brand IDs
  SELECT id INTO v_brand_iport FROM brands WHERE name = 'iPort' LIMIT 1;
  SELECT id INTO v_brand_sonance FROM brands WHERE name = 'Sonance' LIMIT 1;
  SELECT id INTO v_brand_james FROM brands WHERE name = 'James' LIMIT 1;

  -- Get channel IDs
  SELECT id INTO v_channel_residential FROM sales_channels WHERE name = 'Bugry Residential' LIMIT 1;
  SELECT id INTO v_channel_retail FROM sales_channels WHERE name = 'Retail' LIMIT 1;
  SELECT id INTO v_channel_commercial FROM sales_channels WHERE name = 'Commercial Audio' LIMIT 1;

  -- Get department IDs
  SELECT id INTO v_dept_eng FROM departments WHERE name = 'Engineering' LIMIT 1;
  SELECT id INTO v_dept_sales FROM departments WHERE name = 'Sales' LIMIT 1;

  -- Get some employee IDs (using names from the existing seed)
  SELECT id INTO v_ceo_id FROM employees WHERE title LIKE '%CEO%' OR title LIKE '%Chief Executive%' LIMIT 1;
  SELECT id INTO v_vp_eng_id FROM employees WHERE title LIKE '%VP%' AND department_id = v_dept_eng LIMIT 1;
  SELECT id INTO v_vp_sales_id FROM employees WHERE title LIKE '%VP%' AND department_id = v_dept_sales LIMIT 1;
  SELECT id INTO v_eng1_id FROM employees WHERE department_id = v_dept_eng AND title LIKE '%Engineer%' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_eng2_id FROM employees WHERE department_id = v_dept_eng AND title LIKE '%Engineer%' ORDER BY created_at OFFSET 1 LIMIT 1;
  SELECT id INTO v_sales1_id FROM employees WHERE department_id = v_dept_sales ORDER BY created_at LIMIT 1;
  SELECT id INTO v_sales2_id FROM employees WHERE department_id = v_dept_sales ORDER BY created_at OFFSET 1 LIMIT 1;

  -- Only proceed if we have employees
  IF v_eng1_id IS NOT NULL AND v_eng2_id IS NOT NULL THEN

    -- ========================================================================
    -- SET PRIMARY MANAGERS (Solid Line Reporting)
    -- ========================================================================

    -- VP Engineering reports to CEO
    IF v_vp_eng_id IS NOT NULL AND v_ceo_id IS NOT NULL THEN
      UPDATE employees SET primary_manager_id = v_ceo_id WHERE id = v_vp_eng_id;
    END IF;

    -- VP Sales reports to CEO
    IF v_vp_sales_id IS NOT NULL AND v_ceo_id IS NOT NULL THEN
      UPDATE employees SET primary_manager_id = v_ceo_id WHERE id = v_vp_sales_id;
    END IF;

    -- Engineer 1 reports to VP Engineering
    IF v_eng1_id IS NOT NULL AND v_vp_eng_id IS NOT NULL THEN
      UPDATE employees SET primary_manager_id = v_vp_eng_id WHERE id = v_eng1_id;
    END IF;

    -- Engineer 2 reports to VP Engineering
    IF v_eng2_id IS NOT NULL AND v_vp_eng_id IS NOT NULL THEN
      UPDATE employees SET primary_manager_id = v_vp_eng_id WHERE id = v_eng2_id;
    END IF;

    -- Sales 1 reports to VP Sales
    IF v_sales1_id IS NOT NULL AND v_vp_sales_id IS NOT NULL THEN
      UPDATE employees SET primary_manager_id = v_vp_sales_id WHERE id = v_sales1_id;
    END IF;

    -- Sales 2 reports to VP Sales
    IF v_sales2_id IS NOT NULL AND v_vp_sales_id IS NOT NULL THEN
      UPDATE employees SET primary_manager_id = v_vp_sales_id WHERE id = v_sales2_id;
    END IF;

    -- ========================================================================
    -- EMPLOYEE BRAND AFFILIATIONS
    -- ========================================================================

    -- Engineer 1: Primary iPort, also works on Sonance
    INSERT INTO employee_brands (employee_id, brand_id, is_primary) VALUES
      (v_eng1_id, v_brand_iport, true),
      (v_eng1_id, v_brand_sonance, false)
    ON CONFLICT (employee_id, brand_id) DO NOTHING;

    -- Engineer 2: Primary Sonance, also works on James
    INSERT INTO employee_brands (employee_id, brand_id, is_primary) VALUES
      (v_eng2_id, v_brand_sonance, true),
      (v_eng2_id, v_brand_james, false)
    ON CONFLICT (employee_id, brand_id) DO NOTHING;

    -- Sales 1: Works with Residential and Retail channels
    IF v_sales1_id IS NOT NULL THEN
      INSERT INTO employee_channels (employee_id, channel_id, is_primary) VALUES
        (v_sales1_id, v_channel_residential, true),
        (v_sales1_id, v_channel_retail, false)
      ON CONFLICT (employee_id, channel_id) DO NOTHING;
    END IF;

    -- Sales 2: Works with Commercial channel
    IF v_sales2_id IS NOT NULL THEN
      INSERT INTO employee_channels (employee_id, channel_id, is_primary) VALUES
        (v_sales2_id, v_channel_commercial, true)
      ON CONFLICT (employee_id, channel_id) DO NOTHING;
    END IF;

    -- ========================================================================
    -- MATRIX RELATIONSHIPS (Dotted Line Reporting)
    -- ========================================================================

    -- Engineer 1 has PRIMARY reporting to VP Engineering (already set above via primary_manager_id)
    IF v_eng1_id IS NOT NULL AND v_vp_eng_id IS NOT NULL THEN
      INSERT INTO matrix_relationships (employee_id, manager_id, relationship_type, entity_id, entity_type, allocation_percentage)
      VALUES (v_eng1_id, v_vp_eng_id, 'primary', v_dept_eng, 'department', 60)
      ON CONFLICT (employee_id, manager_id, relationship_type, entity_id) DO NOTHING;
    END IF;

    -- Engineer 1 ALSO reports to VP Sales for iPort brand work (matrix/dotted line)
    IF v_eng1_id IS NOT NULL AND v_vp_sales_id IS NOT NULL AND v_brand_iport IS NOT NULL THEN
      INSERT INTO matrix_relationships (employee_id, manager_id, relationship_type, entity_id, entity_type, allocation_percentage)
      VALUES (v_eng1_id, v_vp_sales_id, 'brand', v_brand_iport, 'brand', 40)
      ON CONFLICT (employee_id, manager_id, relationship_type, entity_id) DO NOTHING;
    END IF;

    -- Sales 1 reports to VP Sales (primary) for Residential channel
    IF v_sales1_id IS NOT NULL AND v_vp_sales_id IS NOT NULL THEN
      INSERT INTO matrix_relationships (employee_id, manager_id, relationship_type, entity_id, entity_type, allocation_percentage)
      VALUES (v_sales1_id, v_vp_sales_id, 'primary', v_dept_sales, 'department', 70)
      ON CONFLICT (employee_id, manager_id, relationship_type, entity_id) DO NOTHING;
    END IF;

    -- Sales 1 ALSO has dotted line to VP Engineering for product feedback (matrix)
    IF v_sales1_id IS NOT NULL AND v_vp_eng_id IS NOT NULL AND v_channel_residential IS NOT NULL THEN
      INSERT INTO matrix_relationships (employee_id, manager_id, relationship_type, entity_id, entity_type, allocation_percentage)
      VALUES (v_sales1_id, v_vp_eng_id, 'channel', v_channel_residential, 'channel', 30)
      ON CONFLICT (employee_id, manager_id, relationship_type, entity_id) DO NOTHING;
    END IF;

  END IF;

END $$;

-- ============================================================================
-- VERIFICATION QUERIES (commented out - uncomment to test)
-- ============================================================================

-- View all brands
-- SELECT * FROM brands;

-- View all channels
-- SELECT * FROM sales_channels;

-- View all matrix relationships
-- SELECT
--   e.name as employee_name,
--   m.name as manager_name,
--   mr.relationship_type,
--   mr.entity_type,
--   mr.allocation_percentage,
--   CASE
--     WHEN mr.entity_type = 'brand' THEN b.name
--     WHEN mr.entity_type = 'channel' THEN sc.name
--     WHEN mr.entity_type = 'department' THEN d.name
--   END as entity_name
-- FROM matrix_relationships mr
-- JOIN employees e ON mr.employee_id = e.id
-- JOIN employees m ON mr.manager_id = m.id
-- LEFT JOIN brands b ON mr.entity_id = b.id AND mr.entity_type = 'brand'
-- LEFT JOIN sales_channels sc ON mr.entity_id = sc.id AND mr.entity_type = 'channel'
-- LEFT JOIN departments d ON mr.entity_id = d.id AND mr.entity_type = 'department';

-- View employee matrix view
-- SELECT * FROM employee_matrix_view;

-- Check allocation percentages
-- SELECT
--   e.name,
--   calculate_total_allocation(e.id) as total_allocation
-- FROM employees e
-- WHERE e.id IN (SELECT DISTINCT employee_id FROM matrix_relationships);
