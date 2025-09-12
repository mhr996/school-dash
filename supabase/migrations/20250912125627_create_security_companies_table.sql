-- Create security companies table
CREATE TABLE IF NOT EXISTS security_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name VARCHAR(255) NOT NULL,
    tax_number VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    license_types TEXT,
    weapon_types TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    notes TEXT
);

-- Create an update trigger for updated_at
CREATE OR REPLACE FUNCTION update_security_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_security_companies_updated_at_trigger
    BEFORE UPDATE ON security_companies
    FOR EACH ROW
    EXECUTE FUNCTION update_security_companies_updated_at();

-- Add RLS policies
ALTER TABLE security_companies ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
CREATE POLICY "Allow read access for authenticated users" ON security_companies
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow insert for authenticated users
CREATE POLICY "Allow insert for authenticated users" ON security_companies
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow update for authenticated users
CREATE POLICY "Allow update for authenticated users" ON security_companies
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow delete for authenticated users
CREATE POLICY "Allow delete for authenticated users" ON security_companies
    FOR DELETE
    TO authenticated
    USING (true);
