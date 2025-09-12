-- Create users table for school trips dashboard
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'user', -- 'admin', 'teacher', 'driver', 'user'
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'suspended'
    avatar_url TEXT,
    department VARCHAR(100), -- for teachers/staff
    employee_id VARCHAR(50), -- for staff identification
    notes TEXT,
    permissions JSONB DEFAULT '{}', -- store specific permissions
    last_login_at TIMESTAMP WITH TIME ZONE,
    auth_user_id UUID -- reference to Supabase auth user
);

-- Create company_settings table for school information
CREATE TABLE IF NOT EXISTS company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    school_name VARCHAR(255) NOT NULL,
    school_address TEXT,
    school_phone VARCHAR(20),
    school_email VARCHAR(255),
    school_website VARCHAR(255),
    logo_url TEXT,
    academic_year VARCHAR(20), -- e.g., "2024-2025"
    currency VARCHAR(10) DEFAULT 'USD',
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    school_license_number VARCHAR(100),
    insurance_policy_number VARCHAR(100),
    insurance_expiry_date DATE,
    settings JSONB DEFAULT '{}', -- additional settings as JSON
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Create trips table for school trip management
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    trip_name VARCHAR(255) NOT NULL,
    description TEXT,
    destination VARCHAR(255) NOT NULL,
    departure_date DATE NOT NULL,
    return_date DATE NOT NULL,
    departure_time TIME,
    return_time TIME,
    max_students INTEGER DEFAULT 30,
    cost_per_student DECIMAL(10,2) DEFAULT 0,
    grade_levels VARCHAR(100), -- e.g., "9,10,11" or "Grade 9-11"
    trip_type VARCHAR(50) DEFAULT 'educational', -- 'educational', 'recreational', 'sports', 'cultural'
    status VARCHAR(20) DEFAULT 'planning', -- 'planning', 'approved', 'active', 'completed', 'cancelled'
    meeting_point VARCHAR(255),
    emergency_contact VARCHAR(255),
    special_requirements TEXT,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    date_of_birth DATE,
    grade_level VARCHAR(20),
    class_section VARCHAR(20),
    parent_guardian_name VARCHAR(255),
    parent_guardian_phone VARCHAR(20),
    parent_guardian_email VARCHAR(255),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    medical_conditions TEXT,
    allergies TEXT,
    address TEXT,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'graduated', 'transferred'
    avatar_url TEXT,
    notes TEXT
);

-- Create trip_registrations table (many-to-many between students and trips)
CREATE TABLE IF NOT EXISTS trip_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
    payment_status VARCHAR(20) DEFAULT 'unpaid', -- 'unpaid', 'partial', 'paid', 'refunded'
    amount_paid DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(50), -- 'cash', 'card', 'bank_transfer', 'cheque'
    special_requirements TEXT,
    parent_consent BOOLEAN DEFAULT FALSE,
    medical_form_submitted BOOLEAN DEFAULT FALSE,
    emergency_contact_confirmed BOOLEAN DEFAULT FALSE,
    registered_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    UNIQUE(trip_id, student_id)
);

-- Create buses table for transportation
CREATE TABLE IF NOT EXISTS buses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    bus_number VARCHAR(50) UNIQUE NOT NULL,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 50,
    model VARCHAR(100),
    year INTEGER,
    insurance_policy_number VARCHAR(100),
    insurance_expiry_date DATE,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    fuel_type VARCHAR(20) DEFAULT 'diesel', -- 'diesel', 'petrol', 'electric', 'hybrid'
    status VARCHAR(20) DEFAULT 'available', -- 'available', 'in_use', 'maintenance', 'out_of_service'
    gps_tracking_id VARCHAR(100),
    safety_features TEXT,
    notes TEXT
);

-- Create trip_buses table (assign buses to trips)
CREATE TABLE IF NOT EXISTS trip_buses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES users(id), -- driver should be a user with 'driver' role
    departure_time TIME,
    return_time TIME,
    route_details TEXT,
    UNIQUE(trip_id, bus_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_departure_date ON trips(departure_date);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_grade_level ON students(grade_level);
CREATE INDEX IF NOT EXISTS idx_trip_registrations_trip_id ON trip_registrations(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_registrations_student_id ON trip_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_trip_registrations_status ON trip_registrations(status);
CREATE INDEX IF NOT EXISTS idx_buses_status ON buses(status);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_buses ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (you can modify these based on your needs)
-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth.uid()::text = auth_user_id::text);

-- Admins can read all users
CREATE POLICY "Admins can read all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- Company settings are readable by authenticated users
CREATE POLICY "Authenticated users can read company settings" ON company_settings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can modify company settings
CREATE POLICY "Only admins can modify company settings" ON company_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- Trips are readable by authenticated users
CREATE POLICY "Authenticated users can read trips" ON trips
    FOR SELECT USING (auth.role() = 'authenticated');

-- Students are readable by authenticated users
CREATE POLICY "Authenticated users can read students" ON students
    FOR SELECT USING (auth.role() = 'authenticated');

-- Trip registrations are readable by authenticated users
CREATE POLICY "Authenticated users can read trip registrations" ON trip_registrations
    FOR SELECT USING (auth.role() = 'authenticated');

-- Buses are readable by authenticated users
CREATE POLICY "Authenticated users can read buses" ON buses
    FOR SELECT USING (auth.role() = 'authenticated');

-- Trip buses are readable by authenticated users
CREATE POLICY "Authenticated users can read trip buses" ON trip_buses
    FOR SELECT USING (auth.role() = 'authenticated');

-- Insert default company settings
INSERT INTO company_settings (
    school_name,
    school_address,
    school_phone,
    school_email,
    academic_year,
    currency,
    timezone,
    language
) VALUES (
    'Demo School',
    '123 Education Street, Learning City, LC 12345',
    '+1-234-567-8900',
    'info@demoschool.edu',
    '2024-2025',
    'USD',
    'America/New_York',
    'en'
) ON CONFLICT DO NOTHING;
