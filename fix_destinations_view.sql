-- Fix the destinations_with_details view
-- This corrects the view to match the actual schema where suitable_for_options has NO icon or category column

DROP VIEW IF EXISTS public.destinations_with_details;

CREATE OR REPLACE VIEW public.destinations_with_details AS
SELECT 
  d.*,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'value', dp.value,
        'icon', dp.icon
      )
    ) FILTER (WHERE dp.id IS NOT NULL),
    '[]'
  ) as properties_details,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'value', sf.value
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

-- Grant permissions
GRANT SELECT ON public.destinations_with_details TO authenticated;
GRANT SELECT ON public.destinations_with_details TO anon;
