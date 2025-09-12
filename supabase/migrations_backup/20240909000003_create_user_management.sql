-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    name_ar VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default roles
INSERT INTO user_roles (name, name_ar, description) VALUES
('admin', 'مدير عام', 'Full system access and administration'),
('employee', 'موظف', 'Company employee with limited access'),
('school_manager', 'مدير مدرسة', 'School manager with school-specific access'),
('trip_planner', 'مسؤول رحلة', 'Trip planning and management')
ON CONFLICT (name) DO NOTHING;

-- Add new columns to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES user_roles(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing users to have role_id based on their current role
UPDATE users SET role_id = (
    SELECT id FROM user_roles WHERE name = 
    CASE 
        WHEN users.role = 'admin' THEN 'admin'
        WHEN users.role = 'teacher' THEN 'employee'
        WHEN users.role = 'driver' THEN 'employee'
        ELSE 'employee'
    END
) WHERE role_id IS NULL;

-- Combine first_name and last_name into full_name for existing users
UPDATE users SET full_name = CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))
WHERE full_name IS NULL AND (first_name IS NOT NULL OR last_name IS NOT NULL);

-- Set is_active based on existing status
UPDATE users SET is_active = (status = 'active') WHERE is_active IS NULL;

-- Create RLS policies for user_roles table
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view roles
CREATE POLICY "Authenticated users can view roles" ON user_roles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Create updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at trigger for user_roles table
CREATE OR REPLACE TRIGGER update_user_roles_updated_at 
    BEFORE UPDATE ON user_roles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
