-- Migration to update school types from Arabic to English values
-- This ensures all new schools are stored with English values and existing data is migrated

-- Update existing school types from Arabic to English
UPDATE schools
SET type = CASE
    WHEN type = 'مجلس' THEN 'council'
    WHEN type = 'كلية' THEN 'college'
    WHEN type = 'مدرسة' THEN 'school'
    WHEN type = 'روضه' THEN 'kindergarten'
    ELSE type -- Keep any existing English values or unknown types as they are
END
WHERE type IN ('مجلس', 'كلية', 'مدرسة', 'روضه');

-- Add comment explaining the change
COMMENT ON COLUMN schools.type IS 'Institution type stored in English (council, college, school, kindergarten) for consistency, localized on frontend display';
