-- Check if data exists in the database
-- Run these queries in Supabase SQL Editor to debug

-- 1. Check organizations table
SELECT * FROM organizations;

-- 2. Check if there are duplicate organizations with the same ID
SELECT id, COUNT(*) 
FROM organizations 
WHERE id = 'f8a8b8c8-d8e8-4f8f-8f8f-8f8f8f8f8f8f'
GROUP BY id;

-- 3. If no organization exists, insert it
-- INSERT INTO organizations (id, name) VALUES 
-- ('f8a8b8c8-d8e8-4f8f-8f8f-8f8f8f8f8f8f', 'Test Organization');

-- 4. Check all tables to see what data exists
SELECT 'organizations' as table_name, COUNT(*) as count FROM organizations
UNION ALL
SELECT 'departments', COUNT(*) FROM departments
UNION ALL
SELECT 'employees', COUNT(*) FROM employees
UNION ALL
SELECT 'assessments', COUNT(*) FROM assessments
UNION ALL
SELECT 'box_definitions', COUNT(*) FROM box_definitions;