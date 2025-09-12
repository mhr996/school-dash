-- Create paramedics table
CREATE TABLE public.paramedics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    identity_number VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    hourly_rate DECIMAL(10,2),
    daily_rate DECIMAL(10,2),
    regional_rate DECIMAL(10,2),
    overnight_rate DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE public.paramedics ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for paramedics table
CREATE TRIGGER handle_paramedics_updated_at
    BEFORE UPDATE ON public.paramedics
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_paramedics_identity_number ON public.paramedics(identity_number);
CREATE INDEX idx_paramedics_name ON public.paramedics(name);
