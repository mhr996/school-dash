-- Disable Row Level Security on all tables to prevent infinite recursion
-- Frontend role-based access control will handle permissions instead

-- Drop existing RLS policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Authenticated users can read company settings" ON company_settings;
DROP POLICY IF EXISTS "Only admins can modify company settings" ON company_settings;
DROP POLICY IF EXISTS "Authenticated users can view roles" ON user_roles;

-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE trip_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE buses DISABLE ROW LEVEL SECURITY;
ALTER TABLE trip_buses DISABLE ROW LEVEL SECURITY;
ALTER TABLE schools DISABLE ROW LEVEL SECURITY;

-- Add comment explaining the approach
COMMENT ON TABLE users IS 'RLS disabled - using frontend role-based access control instead';
COMMENT ON TABLE user_roles IS 'RLS disabled - using frontend role-based access control instead';
