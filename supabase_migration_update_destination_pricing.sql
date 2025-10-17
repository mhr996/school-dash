-- Migration: Update Destination Pricing Structure
-- Date: 2025-10-17
-- Description: Changes pricing from {teen, adult, child, guide} to {student, crew}

-- Step 1: Backup existing pricing data
CREATE TABLE IF NOT EXISTS destinations_pricing_backup AS
SELECT id, name, pricing, created_at
FROM destinations
WHERE pricing IS NOT NULL;

-- Step 2: Update destinations with new pricing structure
-- This will set default values - adjust these values as needed per destination
UPDATE destinations
SET pricing = jsonb_build_object(
    'student', 50,
    'crew', 100
)
WHERE pricing IS NOT NULL;

-- Step 3: For destinations without pricing, set a default structure
UPDATE destinations
SET pricing = jsonb_build_object(
    'student', 50,
    'crew', 100
)
WHERE pricing IS NULL;

-- Step 4: Verify the migration
-- Uncomment to check results:
-- SELECT id, name, pricing FROM destinations LIMIT 10;

-- Note: To restore old pricing if needed:
-- UPDATE destinations d
-- SET pricing = b.pricing
-- FROM destinations_pricing_backup b
-- WHERE d.id = b.id;

-- After verifying everything works correctly, you can drop the backup table:
-- DROP TABLE IF EXISTS destinations_pricing_backup;
