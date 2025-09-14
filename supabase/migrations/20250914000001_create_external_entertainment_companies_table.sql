-- Create external_entertainment_companies table
CREATE TABLE IF NOT EXISTS public.external_entertainment_companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name VARCHAR NOT NULL,
    image TEXT,
    description TEXT,
    price DECIMAL(10,2),
    status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_external_entertainment_companies_status ON public.external_entertainment_companies(status);
CREATE INDEX IF NOT EXISTS idx_external_entertainment_companies_created_at ON public.external_entertainment_companies(created_at);
CREATE INDEX IF NOT EXISTS idx_external_entertainment_companies_name ON public.external_entertainment_companies(name);

-- Add updated_at trigger
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.external_entertainment_companies 
    FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.external_entertainment_companies ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Enable read access for all users" ON public.external_entertainment_companies
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON public.external_entertainment_companies
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON public.external_entertainment_companies
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for authenticated users" ON public.external_entertainment_companies
    FOR DELETE USING (true);

-- Add comments for documentation
COMMENT ON TABLE public.external_entertainment_companies IS 'External entertainment companies for school events';
COMMENT ON COLUMN public.external_entertainment_companies.name IS 'Name of the entertainment company';
COMMENT ON COLUMN public.external_entertainment_companies.image IS 'Image URL or path for the company';
COMMENT ON COLUMN public.external_entertainment_companies.description IS 'Description of services offered';
COMMENT ON COLUMN public.external_entertainment_companies.price IS 'Price for services in local currency';
COMMENT ON COLUMN public.external_entertainment_companies.status IS 'Status of the company (active/inactive)';