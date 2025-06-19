-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    car_number VARCHAR(100),
    country VARCHAR(100),
    age INTEGER CHECK (age > 0 AND age <= 120),
    id_number VARCHAR(100),
    customer_type VARCHAR(20) NOT NULL CHECK (customer_type IN ('new', 'existing')),
    balance DECIMAL(10,2) DEFAULT 0.00
);

-- Migration: Add id_number column if it doesn't exist
ALTER TABLE customers ADD COLUMN IF NOT EXISTS id_number VARCHAR(100);

-- Create updated_at trigger for customers table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_customer_type ON customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to manage customers
CREATE POLICY "Enable all operations for authenticated users" ON customers
    FOR ALL USING (auth.role() = 'authenticated');

-- Optional: Create sample customers for testing
-- INSERT INTO customers (name, phone, car_number, country, age, customer_type, balance) VALUES
-- ('أحمد محمد', '+971501234567', 'ABC123', 'UAE', 35, 'new', 5000.00),
-- ('سارة أحمد', '+971507654321', 'XYZ789', 'UAE', 28, 'existing', 12500.00),
-- ('محمد علي', '+971509876543', NULL, 'Saudi Arabia', 42, 'existing', -2000.00);
