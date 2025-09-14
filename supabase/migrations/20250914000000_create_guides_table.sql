-- Create guides table with same structure as paramedics
CREATE TABLE public.guides (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    identity_number VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    hourly_rate DECIMAL(10,2),
    daily_rate DECIMAL(10,2),
    regional_rate DECIMAL(10,2),
    overnight_rate DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;

-- Create trigger for guides table to handle updated_at
CREATE TRIGGER handle_guides_updated_at
    BEFORE UPDATE ON public.guides
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_guides_identity_number ON public.guides(identity_number);
CREATE INDEX idx_guides_name ON public.guides(name);