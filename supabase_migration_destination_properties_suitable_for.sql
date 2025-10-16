-- Migration: Create reference tables for Destination Properties and Suitable For
-- This replaces the JSONB/ARRAY approach with proper relational tables

-- ============================================
-- 1. Create destination_properties table
-- ============================================
CREATE TABLE IF NOT EXISTS public.destination_properties (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  value text NOT NULL,
  icon text, -- Icon name or emoji
  is_active boolean NOT NULL DEFAULT true,
  display_order integer DEFAULT 0,
  CONSTRAINT destination_properties_pkey PRIMARY KEY (id),
  CONSTRAINT destination_properties_value_unique UNIQUE (value)
);

-- ============================================
-- 2. Create suitable_for_options table
-- ============================================
CREATE TABLE IF NOT EXISTS public.suitable_for_options (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  value text NOT NULL,
  icon text, -- Icon name or emoji
  is_active boolean NOT NULL DEFAULT true,
  display_order integer DEFAULT 0,
  CONSTRAINT suitable_for_options_pkey PRIMARY KEY (id),
  CONSTRAINT suitable_for_options_value_unique UNIQUE (value)
);

-- ============================================
-- 3. Create junction table: destination_properties_link
-- ============================================
CREATE TABLE IF NOT EXISTS public.destination_properties_link (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  destination_id uuid NOT NULL,
  property_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT destination_properties_link_pkey PRIMARY KEY (id),
  CONSTRAINT destination_properties_link_destination_fkey FOREIGN KEY (destination_id) 
    REFERENCES public.destinations(id) ON DELETE CASCADE,
  CONSTRAINT destination_properties_link_property_fkey FOREIGN KEY (property_id) 
    REFERENCES public.destination_properties(id) ON DELETE CASCADE,
  CONSTRAINT destination_properties_link_unique UNIQUE (destination_id, property_id)
);

-- ============================================
-- 4. Create junction table: destination_suitable_for_link
-- ============================================
CREATE TABLE IF NOT EXISTS public.destination_suitable_for_link (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  destination_id uuid NOT NULL,
  suitable_for_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT destination_suitable_for_link_pkey PRIMARY KEY (id),
  CONSTRAINT destination_suitable_for_link_destination_fkey FOREIGN KEY (destination_id) 
    REFERENCES public.destinations(id) ON DELETE CASCADE,
  CONSTRAINT destination_suitable_for_link_suitable_for_fkey FOREIGN KEY (suitable_for_id) 
    REFERENCES public.suitable_for_options(id) ON DELETE CASCADE,
  CONSTRAINT destination_suitable_for_link_unique UNIQUE (destination_id, suitable_for_id)
);

-- ============================================
-- 5. Add indexes for better query performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_destination_properties_link_destination 
  ON public.destination_properties_link(destination_id);
CREATE INDEX IF NOT EXISTS idx_destination_properties_link_property 
  ON public.destination_properties_link(property_id);

CREATE INDEX IF NOT EXISTS idx_destination_suitable_for_link_destination 
  ON public.destination_suitable_for_link(destination_id);
CREATE INDEX IF NOT EXISTS idx_destination_suitable_for_link_suitable_for 
  ON public.destination_suitable_for_link(suitable_for_id);

CREATE INDEX IF NOT EXISTS idx_destination_properties_active 
  ON public.destination_properties(is_active);
CREATE INDEX IF NOT EXISTS idx_suitable_for_options_active 
  ON public.suitable_for_options(is_active);

-- ============================================
-- 6. Insert default destination properties
-- ============================================
INSERT INTO public.destination_properties (value, icon, display_order) VALUES
  ('wheelchair_accessible', '♿', 1),
  ('parking_available', '🅿️', 2),
  ('restrooms', '🚻', 3),
  ('wifi_available', '📶', 4),
  ('food_beverages', '🍽️', 5),
  ('gift_shop', '🎁', 6),
  ('guided_tours', '👥', 7),
  ('audio_guide', '🎧', 8),
  ('photography_allowed', '📷', 9),
  ('air_conditioned', '❄️', 10),
  ('outdoor_seating', '🪑', 11),
  ('pet_friendly', '🐕', 12),
  ('family_friendly', '👨‍👩‍👧‍👦', 13),
  ('educational_programs', '📚', 14),
  ('first_aid_available', '🏥', 15)
ON CONFLICT (value) DO NOTHING;

-- ============================================
-- 7. Insert default suitable_for options
-- ============================================
INSERT INTO public.suitable_for_options (value, icon, display_order) VALUES
  ('elementary_school', '🎒', 1),
  ('middle_school', '📖', 2),
  ('high_school', '🎓', 3),
  ('kindergarten', '🧸', 4),
  ('special_education', '🌟', 5),
  ('adults', '👔', 6),
  ('families', '👨‍👩‍👧', 7),
  ('senior_citizens', '👴', 8),
  ('corporate_groups', '💼', 9),
  ('religious_groups', '🕌', 10)
ON CONFLICT (value) DO NOTHING;

-- ============================================
-- 8. Enable RLS (Row Level Security)
-- ============================================
ALTER TABLE public.destination_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suitable_for_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destination_properties_link ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destination_suitable_for_link ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. Create RLS Policies
-- ============================================

-- Public read access for properties and suitable_for options
CREATE POLICY "Allow public read access to destination properties"
  ON public.destination_properties FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to suitable for options"
  ON public.suitable_for_options FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to destination properties links"
  ON public.destination_properties_link FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to destination suitable for links"
  ON public.destination_suitable_for_link FOR SELECT
  USING (true);

-- Authenticated users can manage properties
CREATE POLICY "Allow authenticated insert to destination properties"
  ON public.destination_properties FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update to destination properties"
  ON public.destination_properties FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete from destination properties"
  ON public.destination_properties FOR DELETE
  TO authenticated
  USING (true);

-- Authenticated users can manage suitable_for options
CREATE POLICY "Allow authenticated insert to suitable for options"
  ON public.suitable_for_options FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update to suitable for options"
  ON public.suitable_for_options FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete from suitable for options"
  ON public.suitable_for_options FOR DELETE
  TO authenticated
  USING (true);

-- Authenticated users can manage links
CREATE POLICY "Allow authenticated insert to destination properties links"
  ON public.destination_properties_link FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete from destination properties links"
  ON public.destination_properties_link FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert to destination suitable for links"
  ON public.destination_suitable_for_link FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete from destination suitable for links"
  ON public.destination_suitable_for_link FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- 10. Create helper views for easier querying
-- ============================================

-- View: Destinations with their properties and suitable_for
CREATE OR REPLACE VIEW public.destinations_with_details AS
SELECT 
  d.*,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', dp.id,
        'value', dp.value,
        'icon', dp.icon
      )
    ) FILTER (WHERE dp.id IS NOT NULL),
    '[]'
  ) as properties_details,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', sf.id,
        'value', sf.value,
        'icon', sf.icon
      )
    ) FILTER (WHERE sf.id IS NOT NULL),
    '[]'
  ) as suitable_for_details
FROM public.destinations d
LEFT JOIN public.destination_properties_link dpl ON d.id = dpl.destination_id
LEFT JOIN public.destination_properties dp ON dpl.property_id = dp.id AND dp.is_active = true
LEFT JOIN public.destination_suitable_for_link dsfl ON d.id = dsfl.destination_id
LEFT JOIN public.suitable_for_options sf ON dsfl.suitable_for_id = sf.id AND sf.is_active = true
GROUP BY d.id;

-- ============================================
-- MIGRATION NOTES:
-- ============================================
-- After running this migration, you'll need to:
-- 1. Migrate existing data from properties/suitable_for JSONB/ARRAY to new tables
-- 2. Update the frontend to use the new multi-select components
-- 3. Update queries to JOIN with the new tables or use the view
-- 4. Eventually drop the old properties/suitable_for columns from destinations table
--
-- DON'T drop the old columns yet - we'll do that after confirming everything works!
