-- Check current organization IDs and fix if needed
SELECT id::text, name FROM organizations;

-- If the ID looks different (with uppercase letters), delete and recreate:
-- DELETE FROM organizations;

-- Then insert with the exact ID we need:
-- INSERT INTO organizations (id, name, created_at, updated_at) 
-- VALUES ('f8a8b8c8-d8e8-4f8f-8f8f-8f8f8f8f8f8f'::uuid, 'Test Organization', NOW(), NOW());