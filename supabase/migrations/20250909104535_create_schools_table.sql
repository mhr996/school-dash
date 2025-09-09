-- Create schools table for school trips management
CREATE TABLE public.schools (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Basic information
  name character varying NOT NULL,
  code character varying UNIQUE, -- المعرف / الرمز
  type character varying NOT NULL, -- نوع المؤسسه : مجلس/ كلية/مدرسة روضه
  
  -- Contact information
  director_name character varying, -- مدير المؤسسه
  address text, -- عنوان المؤسسه
  email character varying,
  phone character varying,
  
  -- Statistics
  staff_count integer DEFAULT 0, -- عدد الطاقم
  student_count integer DEFAULT 0, -- عدد الطلاب
  class_count integer DEFAULT 0, -- عدد الصفوف
  
  -- Status and metadata
  status character varying DEFAULT 'active',
  notes text,
  
  CONSTRAINT schools_pkey PRIMARY KEY (id)
);

-- Add RLS policies
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read schools
CREATE POLICY "Allow authenticated users to read schools" ON public.schools
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert/update/delete schools
CREATE POLICY "Allow authenticated users to modify schools" ON public.schools
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_schools_code ON public.schools(code);
CREATE INDEX idx_schools_type ON public.schools(type);
CREATE INDEX idx_schools_status ON public.schools(status);
CREATE INDEX idx_schools_name ON public.schools(name);
