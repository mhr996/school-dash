-- Drop and recreate company_settings table with correct structure
DROP TABLE IF EXISTS company_settings CASCADE;

-- Create company_settings table matching the frontend code expectations
CREATE TABLE public.company_settings (
  name character varying NOT NULL,
  logo_url text,
  address text,
  phone character varying,
  tax_number character varying,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  email text,
  CONSTRAINT company_settings_pkey PRIMARY KEY (id)
);

-- Add RLS policies
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read company settings
CREATE POLICY "Allow authenticated users to read company settings" ON public.company_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert/update company settings
CREATE POLICY "Allow authenticated users to modify company settings" ON public.company_settings
  FOR ALL
  TO authenticated
  USING (true);
