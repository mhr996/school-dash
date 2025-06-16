-- Create cars table
CREATE TABLE IF NOT EXISTS cars (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL,
    brand VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    type VARCHAR(100),
    provider VARCHAR(255),
    kilometers DECIMAL(10,2) DEFAULT 0.00,
    market_price DECIMAL(12,2) DEFAULT 0.00,
    value_price DECIMAL(12,2) DEFAULT 0.00,
    sale_price DECIMAL(12,2) DEFAULT 0.00,
    images TEXT[] DEFAULT '{}',
    colors JSONB DEFAULT '[]'::jsonb,
    desc TEXT, -- New description field
    features JSONB DEFAULT '[]'::jsonb -- New features field as array of objects
);

-- Create updated_at trigger for cars table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cars_updated_at 
    BEFORE UPDATE ON cars 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cars_title ON cars(title);
CREATE INDEX IF NOT EXISTS idx_cars_brand ON cars(brand);
CREATE INDEX IF NOT EXISTS idx_cars_status ON cars(status);
CREATE INDEX IF NOT EXISTS idx_cars_year ON cars(year);
CREATE INDEX IF NOT EXISTS idx_cars_created_at ON cars(created_at);
CREATE INDEX IF NOT EXISTS idx_cars_provider ON cars(provider);

-- Enable Row Level Security (RLS)
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to manage cars
CREATE POLICY "Enable all operations for authenticated users" ON cars
    FOR ALL USING (auth.role() = 'authenticated');
