-- Remove unused columns from travel_companies table
ALTER TABLE travel_companies DROP COLUMN IF EXISTS vehicle_types;
ALTER TABLE travel_companies DROP COLUMN IF EXISTS pricing_structure;

-- Drop the unused index for vehicle_types if it exists
DROP INDEX IF EXISTS idx_travel_companies_vehicle_types;
