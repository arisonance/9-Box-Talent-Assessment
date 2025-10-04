import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mnsofbbwcivcobbmfzbe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uc29mYmJ3Y2l2Y29iYm1memJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NzEwOTAsImV4cCI6MjA2ODU0NzA5MH0.6u3n_7b2P4YxQnZ8DX16Sz097TKyxpo9-Agd1TQQ1Ig';

const supabase = createClient(supabaseUrl, supabaseKey);

const FIXED_ORG_ID = 'f8a8b8c8-d8e8-4f8f-8f8f-8f8f8f8f8f8f';

async function seedDatabase() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Check if organization already exists
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', FIXED_ORG_ID)
      .single();

    if (existingOrg) {
      console.log('✅ Organization already exists, skipping seed');
      console.log('📊 Database is already seeded!\n');
      return;
    }

    // Insert organization
    console.log('📝 Creating organization...');
    const { error: orgError } = await supabase
      .from('organizations')
      .insert({ id: FIXED_ORG_ID, name: 'Test Organization' });

    if (orgError) throw orgError;
    console.log('✅ Organization created\n');

    // Insert departments
    console.log('📝 Creating departments...');
    const departments = [
      { id: 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', organization_id: FIXED_ORG_ID, name: 'Engineering', color: '#3B82F6' },
      { id: 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', organization_id: FIXED_ORG_ID, name: 'Sales', color: '#10B981' },
      { id: 'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3', organization_id: FIXED_ORG_ID, name: 'Marketing', color: '#F59E0B' },
      { id: 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', organization_id: FIXED_ORG_ID, name: 'HR', color: '#EF4444' },
      { id: 'd5d5d5d5-d5d5-d5d5-d5d5-d5d5d5d5d5d5', organization_id: FIXED_ORG_ID, name: 'Finance', color: '#8B5CF6' }
    ];

    const { error: deptError } = await supabase.from('departments').insert(departments);
    if (deptError) throw deptError;
    console.log('✅ 5 departments created\n');

    // Insert box definitions
    console.log('📝 Creating 9-box definitions...');
    const boxDefinitions = [
      { organization_id: FIXED_ORG_ID, key: '1-1', label: 'Realign & Redirect', description: 'Not delivering results, cannot adapt', action_hint: 'Realign or exit within 3-6 months', color: '#EF4444', grid_x: 1, grid_y: 1 },
      { organization_id: FIXED_ORG_ID, key: '2-1', label: 'Core Foundation', description: 'Solid at current level, limited advancement potential', action_hint: 'Valuable team member, maintain at current level', color: '#F59E0B', grid_x: 2, grid_y: 1 },
      { organization_id: FIXED_ORG_ID, key: '3-1', label: 'Master Craftsperson', description: 'Expert in specific area, at appropriate level', action_hint: 'Valuable for knowledge transfer and mentoring', color: '#10B981', grid_x: 3, grid_y: 1 },
      { organization_id: FIXED_ORG_ID, key: '1-2', label: 'Evaluate Further', description: 'Some potential but not meeting standards', action_hint: 'Improve or move within 6 months', color: '#FB923C', grid_x: 1, grid_y: 2 },
      { organization_id: FIXED_ORG_ID, key: '2-2', label: 'Steady Contributor', description: 'Reliable performer, meets expectations', action_hint: 'Potential for one level advancement', color: '#3B82F6', grid_x: 2, grid_y: 2 },
      { organization_id: FIXED_ORG_ID, key: '3-2', label: 'Performance Leader', description: 'Exceptional results in current role', action_hint: 'Ready for next level within 24 months', color: '#06B6D4', grid_x: 3, grid_y: 2 },
      { organization_id: FIXED_ORG_ID, key: '1-3', label: 'Rising Talent', description: 'High potential but underperforming', action_hint: 'Needs coaching to reach full performance', color: '#FBBF24', grid_x: 1, grid_y: 3 },
      { organization_id: FIXED_ORG_ID, key: '2-3', label: 'Emerging Leader', description: 'Meets/exceeds expectations, high capacity for growth', action_hint: 'Ready for stretch assignments and challenges', color: '#8B5CF6', grid_x: 2, grid_y: 3 },
      { organization_id: FIXED_ORG_ID, key: '3-3', label: 'Star/Top Talent', description: 'Consistently exceeds standards, learns fast', action_hint: 'Ready for multiple level advancement, succession planning', color: '#10B981', grid_x: 3, grid_y: 3 }
    ];

    const { error: boxError } = await supabase.from('box_definitions').insert(boxDefinitions);
    if (boxError) throw boxError;
    console.log('✅ 9 box definitions created\n');

    // Insert employees
    console.log('📝 Creating employees...');
    const employees = [
      { id: 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', organization_id: FIXED_ORG_ID, employee_id: 'E001', name: 'Sarah Johnson', email: 'sarah.j@test.com', department_id: 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', manager_name: 'Mike Wilson', title: 'Senior Software Engineer', location: 'San Francisco' },
      { id: 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', organization_id: FIXED_ORG_ID, employee_id: 'E002', name: 'David Chen', email: 'david.c@test.com', department_id: 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', manager_name: 'Lisa Brown', title: 'Sales Director', location: 'New York' },
      { id: 'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3', organization_id: FIXED_ORG_ID, employee_id: 'E003', name: 'Jennifer Martinez', email: 'jennifer.m@test.com', department_id: 'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3', manager_name: 'Robert Taylor', title: 'Marketing Manager', location: 'Chicago' },
      { id: 'e4e4e4e4-e4e4-e4e4-e4e4-e4e4e4e4e4e4', organization_id: FIXED_ORG_ID, employee_id: 'E004', name: 'Michael Brown', email: 'michael.b@test.com', department_id: 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', manager_name: 'Sarah Johnson', title: 'Lead Developer', location: 'Austin' },
      { id: 'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5', organization_id: FIXED_ORG_ID, employee_id: 'E005', name: 'Emily Davis', email: 'emily.d@test.com', department_id: 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', manager_name: 'Amanda Wilson', title: 'HR Specialist', location: 'Boston' },
      { id: 'e6e6e6e6-e6e6-e6e6-e6e6-e6e6e6e6e6e6', organization_id: FIXED_ORG_ID, employee_id: 'E006', name: 'James Wilson', email: 'james.w@test.com', department_id: 'd5d5d5d5-d5d5-d5d5-d5d5-d5d5d5d5d5d5', manager_name: 'Karen Smith', title: 'Financial Analyst', location: 'Seattle' },
      { id: 'e7e7e7e7-e7e7-e7e7-e7e7-e7e7e7e7e7e7', organization_id: FIXED_ORG_ID, employee_id: 'E007', name: 'Lisa Garcia', email: 'lisa.g@test.com', department_id: 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', manager_name: 'David Chen', title: 'Sales Representative', location: 'Los Angeles' },
      { id: 'e8e8e8e8-e8e8-e8e8-e8e8-e8e8e8e8e8e8', organization_id: FIXED_ORG_ID, employee_id: 'E008', name: 'Robert Taylor', email: 'robert.t@test.com', department_id: 'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3', manager_name: 'Jennifer Martinez', title: 'Marketing Coordinator', location: 'Denver' },
      { id: 'e9e9e9e9-e9e9-e9e9-e9e9-e9e9e9e9e9e9', organization_id: FIXED_ORG_ID, employee_id: 'E009', name: 'Amanda Wilson', email: 'amanda.w@test.com', department_id: 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', manager_name: 'Emily Davis', title: 'HR Manager', location: 'Portland' },
      { id: 'eAeAeAeA-eAeA-eAeA-eAeA-eAeAeAeAeAeA', organization_id: FIXED_ORG_ID, employee_id: 'E010', name: 'Kevin Lee', email: 'kevin.l@test.com', department_id: 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', manager_name: 'Michael Brown', title: 'Junior Developer', location: 'Miami' },
      { id: 'eBeBeBe8-eBeB-eBeB-eBeB-eBeBeBeBeBe8', organization_id: FIXED_ORG_ID, employee_id: 'E011', name: 'Karen Smith', email: 'karen.s@test.com', department_id: 'd5d5d5d5-d5d5-d5d5-d5d5-d5d5d5d5d5d5', manager_name: 'James Wilson', title: 'Senior Accountant', location: 'Phoenix' },
      { id: 'eCeCeCeC-eCeC-eCeC-eCeC-eCeCeCeCeCeC', organization_id: FIXED_ORG_ID, employee_id: 'E012', name: 'Alex Rodriguez', email: 'alex.r@test.com', department_id: 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', manager_name: 'Sarah Johnson', title: 'Software Engineer', location: 'Dallas' },
      { id: 'eDeDeDe8-eDeD-eDeD-eDeD-eDeDeDeDeDe8', organization_id: FIXED_ORG_ID, employee_id: 'E013', name: 'Jessica Brown', email: 'jessica.b@test.com', department_id: 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', manager_name: 'David Chen', title: 'Account Manager', location: 'Atlanta' },
      { id: 'eEeEeEeE-eEeE-eEeE-eEeE-eEeEeEeEeEeE', organization_id: FIXED_ORG_ID, employee_id: 'E014', name: 'Mark Thompson', email: 'mark.t@test.com', department_id: 'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3', manager_name: 'Jennifer Martinez', title: 'Content Specialist', location: 'Minneapolis' },
      { id: 'eFeFeFe8-eFeF-eFeF-eFeF-eFeFeFeFeFe8', organization_id: FIXED_ORG_ID, employee_id: 'E015', name: 'Rachel Johnson', email: 'rachel.j@test.com', department_id: 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', manager_name: 'Amanda Wilson', title: 'Recruiter', location: 'Nashville' }
    ];

    const { error: empError } = await supabase.from('employees').insert(employees);
    if (empError) throw empError;
    console.log('✅ 15 employees created\n');

    // Insert assessments
    console.log('📝 Creating assessments...');
    const assessments = [
      { organization_id: FIXED_ORG_ID, employee_id: 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', performance: 'high', potential: 'high', box_key: '3-3', assessed_at: new Date().toISOString() },
      { organization_id: FIXED_ORG_ID, employee_id: 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', performance: 'high', potential: 'high', box_key: '3-3', assessed_at: new Date().toISOString() },
      { organization_id: FIXED_ORG_ID, employee_id: 'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3', performance: 'high', potential: 'medium', box_key: '3-2', assessed_at: new Date().toISOString() },
      { organization_id: FIXED_ORG_ID, employee_id: 'e4e4e4e4-e4e4-e4e4-e4e4-e4e4e4e4e4e4', performance: 'high', potential: 'medium', box_key: '3-2', assessed_at: new Date().toISOString() },
      { organization_id: FIXED_ORG_ID, employee_id: 'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5', performance: 'medium', potential: 'high', box_key: '2-3', assessed_at: new Date().toISOString() },
      { organization_id: FIXED_ORG_ID, employee_id: 'e6e6e6e6-e6e6-e6e6-e6e6-e6e6e6e6e6e6', performance: 'medium', potential: 'high', box_key: '2-3', assessed_at: new Date().toISOString() },
      { organization_id: FIXED_ORG_ID, employee_id: 'e7e7e7e7-e7e7-e7e7-e7e7-e7e7e7e7e7e7', performance: 'medium', potential: 'medium', box_key: '2-2', assessed_at: new Date().toISOString() },
      { organization_id: FIXED_ORG_ID, employee_id: 'e8e8e8e8-e8e8-e8e8-e8e8-e8e8e8e8e8e8', performance: 'medium', potential: 'medium', box_key: '2-2', assessed_at: new Date().toISOString() },
      { organization_id: FIXED_ORG_ID, employee_id: 'e9e9e9e9-e9e9-e9e9-e9e9-e9e9e9e9e9e9', performance: 'medium', potential: 'medium', box_key: '2-2', assessed_at: new Date().toISOString() },
      { organization_id: FIXED_ORG_ID, employee_id: 'eAeAeAeA-eAeA-eAeA-eAeA-eAeAeAeAeAeA', performance: 'low', potential: 'high', box_key: '1-3', assessed_at: new Date().toISOString() },
      { organization_id: FIXED_ORG_ID, employee_id: 'eBeBeBe8-eBeB-eBeB-eBeB-eBeBeBeBeBe8', performance: 'high', potential: 'low', box_key: '3-1', assessed_at: new Date().toISOString() }
    ];

    const { error: assessError } = await supabase.from('assessments').insert(assessments);
    if (assessError) throw assessError;
    console.log('✅ 11 assessments created (4 employees unassigned for testing)\n');

    console.log('🎉 Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log('   - 1 Organization');
    console.log('   - 5 Departments');
    console.log('   - 9 Box Definitions');
    console.log('   - 15 Employees');
    console.log('   - 11 Assessments\n');
    console.log('✨ You can now refresh your browser at http://localhost:5176/\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    if (error.details) console.error('Details:', error.details);
    if (error.hint) console.error('Hint:', error.hint);
    process.exit(1);
  }
}

seedDatabase();
