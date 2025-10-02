# Trip Details Fields Migration

## Overview

Added three new fields to the `bookings` table to store trip participant and transportation information.

## Migration File

- **File**: `supabase/migrations/20251002000001_add_trip_details_to_bookings.sql`
- **Date**: October 2, 2025

## Changes Made

### Database Schema

Added the following columns to `public.bookings` table:

1. **number_of_students** (integer)

    - Stores the number of students participating in the trip
    - Nullable field

2. **number_of_crew** (integer)

    - Stores the number of crew/staff members accompanying the trip
    - Nullable field

3. **number_of_buses** (integer)
    - Stores the number of buses required for transportation
    - Only applicable when travel company service is required
    - Nullable field

### Application Code Updates

#### trip-planner-dashboard.tsx

Updated the `bookingData` object in the booking creation process (around line 870) to include:

```typescript
number_of_students: numberOfStudents || null,
number_of_crew: numberOfCrew || null,
number_of_buses: numberOfBuses || null,
```

These fields are now saved to the database when a booking is created.

#### remote_db_schema.sql

Updated the documentation schema to reflect the new columns.

## Migration Steps

### To apply this migration to Supabase:

1. **Option A - Using Supabase CLI:**

    ```bash
    supabase db push
    ```

2. **Option B - Manual SQL execution:**

    - Go to Supabase Dashboard → SQL Editor
    - Copy and paste the contents of `20251002000001_add_trip_details_to_bookings.sql`
    - Execute the query

3. **Option C - Using migration command:**
    ```bash
    supabase migration up
    ```

## Verification

After applying the migration, verify:

1. The three new columns exist in the `bookings` table
2. They are of type `integer` and allow NULL values
3. Creating a new booking saves these values correctly
4. Existing bookings have NULL values for these fields (backwards compatible)

## Rollback

If needed, rollback with:

```sql
ALTER TABLE public.bookings
DROP COLUMN number_of_students,
DROP COLUMN number_of_crew,
DROP COLUMN number_of_buses;
```

## Related Features

- Frontend form inputs in Trip Details section
- Validation logic in `validateRequiredServices()`
- Reset logic in `handleBookingComplete()`
- Localization in en.json, ae.json, he.json

## Notes

- Fields are nullable to maintain backwards compatibility
- The `number_of_buses` field is conditionally shown in UI based on destination requirements
- All three fields are reset to empty string in the frontend after successful booking
