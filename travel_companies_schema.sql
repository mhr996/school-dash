-- Travel Companies Database Schema
-- This table stores information about travel companies that provide school transportation services

CREATE TABLE travel_companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    services_offered TEXT,
    vehicle_types TEXT[], -- Array of vehicle types: ['باص', 'مينيباص']
    vehicle_count INTEGER DEFAULT 0,
    vehicle_availability VARCHAR(50) DEFAULT 'available', -- 'available', 'busy', 'maintenance'
    accounting_methods TEXT,
    address TEXT NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    pricing_structure VARCHAR(50), -- 'by_students', 'by_vehicle_type', 'by_days', 'by_distance'
    pricing_data JSONB, -- Pricing matrix for vehicle types vs areas
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_travel_companies_code ON travel_companies(code);
CREATE INDEX idx_travel_companies_status ON travel_companies(status);
CREATE INDEX idx_travel_companies_vehicle_availability ON travel_companies(vehicle_availability);
CREATE INDEX idx_travel_companies_name ON travel_companies(name);

-- Add constraints
ALTER TABLE travel_companies ADD CONSTRAINT check_status CHECK (status IN ('active', 'inactive'));
ALTER TABLE travel_companies ADD CONSTRAINT check_vehicle_availability CHECK (vehicle_availability IN ('available', 'busy', 'maintenance'));
ALTER TABLE travel_companies ADD CONSTRAINT check_pricing_structure CHECK (pricing_structure IS NULL OR pricing_structure IN ('by_students', 'by_vehicle_type', 'by_days', 'by_distance'));

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_travel_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER travel_companies_updated_at_trigger
    BEFORE UPDATE ON travel_companies
    FOR EACH ROW
    EXECUTE FUNCTION update_travel_companies_updated_at();

-- Insert sample data (optional)
INSERT INTO travel_companies (name, code, address, email, phone, vehicle_types, vehicle_count, services_offered, accounting_methods, pricing_structure) VALUES
('شركة الراحة للنقل', 'RAH001', 'شارع الملك فهد، الرياض، المملكة العربية السعودية', 'info@rahaltransport.com', '+966112345678', ARRAY['باص', 'مينيباص'], 15, 'نقل الطلاب، رحلات مدرسية، نقل المعلمين', 'محاسبة شهرية، دفع مقدم', 'by_students'),
('مؤسسة النجم الذهبي', 'STAR002', 'طريق الدمام، جدة، المملكة العربية السعودية', 'contact@goldenstar.sa', '+966126789012', ARRAY['باص'], 8, 'خدمات النقل المدرسي، رحلات ترفيهية', 'دفع ربع سنوي', 'by_vehicle_type'),
('شركة المسار السريع', 'FAST003', 'شارع العليا، الدمام، المملكة العربية السعودية', 'admin@fastroute.com.sa', '+966138901234', ARRAY['مينيباص'], 12, 'نقل يومي للطلاب، خدمات النقل الخاص', 'محاسبة يومية، دفع نقدي', 'by_days');

COMMENT ON TABLE travel_companies IS 'Travel companies that provide transportation services for schools';
COMMENT ON COLUMN travel_companies.vehicle_types IS 'Array of Arabic vehicle types: باص (Bus), مينيباص (Minibus)';
COMMENT ON COLUMN travel_companies.pricing_structure IS 'How the company calculates pricing: by number of students, vehicle type, days, or distance';
COMMENT ON COLUMN travel_companies.accounting_methods IS 'Description of how the company handles accounting and payments';
