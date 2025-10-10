-- Migration: Add Education Programs Tables
-- Description: Creates education_programs and education_program_services tables
-- Similar structure to external_entertainment_companies

-- Create education_programs table
CREATE TABLE IF NOT EXISTS public.education_programs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    name character varying NOT NULL,
    image text,
    description text,
    price numeric,
    status character varying DEFAULT 'active'::character varying 
        CHECK (status::text = ANY (ARRAY['active'::character varying, 'inactive'::character varying]::text[])),
    user_id uuid,
    CONSTRAINT education_programs_pkey PRIMARY KEY (id),
    CONSTRAINT education_programs_user_id_fkey FOREIGN KEY (user_id) 
        REFERENCES public.users(id) ON DELETE SET NULL
);

-- Create education_program_services table for sub-services
CREATE TABLE IF NOT EXISTS public.education_program_services (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    education_program_id uuid NOT NULL,
    service_label character varying NOT NULL,
    service_price numeric NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT education_program_services_pkey PRIMARY KEY (id),
    CONSTRAINT education_program_services_education_program_id_fkey 
        FOREIGN KEY (education_program_id) 
        REFERENCES public.education_programs(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_education_programs_status ON public.education_programs(status);
CREATE INDEX IF NOT EXISTS idx_education_programs_user_id ON public.education_programs(user_id);
CREATE INDEX IF NOT EXISTS idx_education_program_services_program_id ON public.education_program_services(education_program_id);

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE public.education_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_program_services ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all education programs
CREATE POLICY "Allow authenticated users to read education programs" 
    ON public.education_programs 
    FOR SELECT 
    TO authenticated 
    USING (true);

-- Allow authenticated users to insert education programs
CREATE POLICY "Allow authenticated users to insert education programs" 
    ON public.education_programs 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- Allow authenticated users to update education programs
CREATE POLICY "Allow authenticated users to update education programs" 
    ON public.education_programs 
    FOR UPDATE 
    TO authenticated 
    USING (true);

-- Allow authenticated users to delete education programs
CREATE POLICY "Allow authenticated users to delete education programs" 
    ON public.education_programs 
    FOR DELETE 
    TO authenticated 
    USING (true);

-- Allow authenticated users to read all education program services
CREATE POLICY "Allow authenticated users to read education program services" 
    ON public.education_program_services 
    FOR SELECT 
    TO authenticated 
    USING (true);

-- Allow authenticated users to insert education program services
CREATE POLICY "Allow authenticated users to insert education program services" 
    ON public.education_program_services 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- Allow authenticated users to update education program services
CREATE POLICY "Allow authenticated users to update education program services" 
    ON public.education_program_services 
    FOR UPDATE 
    TO authenticated 
    USING (true);

-- Allow authenticated users to delete education program services
CREATE POLICY "Allow authenticated users to delete education program services" 
    ON public.education_program_services 
    FOR DELETE 
    TO authenticated 
    USING (true);

-- Update booking_services table to include education_programs as a valid service_type
-- Note: This assumes the booking_services table already exists
-- You may need to run this separately if the constraint is enforced differently

-- First, drop the existing constraint
ALTER TABLE public.booking_services 
    DROP CONSTRAINT IF EXISTS booking_services_service_type_check;

-- Then add the new constraint with education_programs included
ALTER TABLE public.booking_services 
    ADD CONSTRAINT booking_services_service_type_check 
    CHECK (service_type::text = ANY (
        ARRAY[
            'guides'::character varying::text, 
            'paramedics'::character varying::text, 
            'security_companies'::character varying::text, 
            'external_entertainment_companies'::character varying::text, 
            'travel_companies'::character varying::text,
            'education_programs'::character varying::text
        ]
    ));

-- Update payouts table service_type constraint as well
ALTER TABLE public.payouts 
    DROP CONSTRAINT IF EXISTS payouts_service_type_check;

ALTER TABLE public.payouts 
    ADD CONSTRAINT payouts_service_type_check 
    CHECK (service_type::text = ANY (
        ARRAY[
            'guides'::character varying::text, 
            'paramedics'::character varying::text, 
            'security_companies'::character varying::text, 
            'external_entertainment_companies'::character varying::text, 
            'travel_companies'::character varying::text,
            'education_programs'::character varying::text
        ]
    ));

-- Add comments for documentation
COMMENT ON TABLE public.education_programs IS 'Stores education program providers similar to entertainment companies';
COMMENT ON TABLE public.education_program_services IS 'Stores sub-services offered by education programs with individual pricing';
COMMENT ON COLUMN public.education_programs.name IS 'Name of the education program provider';
COMMENT ON COLUMN public.education_programs.image IS 'URL to the education program logo/image';
COMMENT ON COLUMN public.education_programs.description IS 'Description of the education program';
COMMENT ON COLUMN public.education_programs.price IS 'Base price for the education program';
COMMENT ON COLUMN public.education_programs.status IS 'Status of the education program (active/inactive)';
COMMENT ON COLUMN public.education_programs.user_id IS 'Reference to the user who manages this education program';
