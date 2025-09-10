-- Remove the stupid localized fields from user_roles table
-- We should handle localization on the frontend, not in the database!

-- First, let's see what we have
-- SELECT * FROM user_roles;

-- Remove the Arabic name field - we don't need it!
ALTER TABLE user_roles DROP COLUMN IF EXISTS name_ar;

-- Update role descriptions to be in English only
UPDATE user_roles SET description = 'System administrator with full access' WHERE name = 'admin';
UPDATE user_roles SET description = 'General employee with limited access' WHERE name = 'employee';
UPDATE user_roles SET description = 'School manager with school-specific access' WHERE name = 'school_manager';
UPDATE user_roles SET description = 'Trip planner with trip management access' WHERE name = 'trip_planner';

-- Verify the cleanup
SELECT id, name, description FROM user_roles ORDER BY name;
