-- Migration: Update booking_type constraint to add education_only and remove mixed_services
-- Date: 2024
-- Description: Updates the CHECK constraint on bookings table to include education_only and remove mixed_services

-- Step 1: Drop the existing CHECK constraint on booking_type
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_booking_type_check;

-- Step 2: Add the new CHECK constraint with updated values
ALTER TABLE bookings 
ADD CONSTRAINT bookings_booking_type_check 
CHECK (booking_type IN (
    'full_trip',
    'guides_only',
    'paramedics_only',
    'security_only',
    'entertainment_only',
    'transportation_only',
    'education_only'
));

-- Step 3: Update any existing mixed_services bookings to full_trip (or appropriate type)
-- This ensures no data is lost and all bookings have valid types
UPDATE bookings 
SET booking_type = 'full_trip' 
WHERE booking_type = 'mixed_services';

-- Verification query (optional - to check the changes)
-- SELECT booking_type, COUNT(*) FROM bookings GROUP BY booking_type;
