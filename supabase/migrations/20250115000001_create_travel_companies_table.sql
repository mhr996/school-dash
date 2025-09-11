-- Create travel_companies table
CREATE TABLE travel_companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    services_offered TEXT,
    vehicle_count INTEGER DEFAULT 0,
    vehicle_availability VARCHAR(50) DEFAULT 'available', -- 'available', 'busy', 'maintenance'
    accounting_methods TEXT,
    address TEXT NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    pricing_data JSONB, -- Pricing matrix for vehicle types vs areas
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_travel_companies_name ON travel_companies(name);
CREATE INDEX idx_travel_companies_status ON travel_companies(status);
CREATE INDEX idx_travel_companies_pricing_data ON travel_companies USING GIN(pricing_data);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_travel_companies_updated_at 
    BEFORE UPDATE ON travel_companies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE travel_companies ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth requirements)
CREATE POLICY "Enable read access for all authenticated users" ON travel_companies
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON travel_companies
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON travel_companies
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON travel_companies
    FOR DELETE USING (auth.role() = 'authenticated');
