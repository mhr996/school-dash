# Booking Services Migration Guide

## Overview

This migration converts the booking services from JSON storage to a normalized database structure for better data integrity and performance.

## Migration Steps

### 1. Run Database Migrations

Execute the migration files in order:

```bash
# Navigate to your project
cd /path/to/school-dash

# Run migrations through Supabase CLI
supabase migration new create_booking_services_table
# Copy contents of 20250923000001_create_booking_services_table.sql

supabase migration new migrate_services_data
# Copy contents of 20250923000002_migrate_services_data.sql

# Apply migrations
supabase db push
```

### 2. Verify Migration

Check that data was migrated correctly:

```sql
-- Check migration results
SELECT
    'Migration Summary' as info,
    COUNT(*) as total_services_migrated,
    COUNT(DISTINCT booking_id) as bookings_with_services
FROM booking_services;

-- Compare with original JSON data
SELECT COUNT(*) as bookings_with_json_services
FROM bookings
WHERE services IS NOT NULL
AND services != ''
AND services != 'null'
AND services != '[]';
```

### 3. Update Frontend Code

The booking edit page has been updated to support both structures during transition:

- ✅ **Normalized Structure**: Uses `booking_services` table (preferred)
- ✅ **JSON Fallback**: Falls back to old JSON structure if normalized data not found
- ✅ **Backward Compatible**: Works with existing bookings during migration

### 4. Test the System

1. **Create new bookings** - should use normalized structure
2. **Edit existing bookings** - should work with both old and new data
3. **Check service selection** - dropdowns should populate correctly

### 5. Optional Cleanup (After Verification)

Once you've confirmed the migration worked:

```sql
-- Run the cleanup script (OPTIONAL - creates backup first)
-- ONLY RUN AFTER CONFIRMING MIGRATION SUCCESS
\i 20250923000003_cleanup_old_services_column.sql
```

## Benefits of New Structure

### Before (JSON):

```json
{
    "services": "[{\"id\": 2, \"cost\": 165, \"name\": \"Ahmad Yaser\", \"type\": \"guides\"}]"
}
```

❌ Data duplication  
❌ No referential integrity  
❌ Hard to query/filter  
❌ Gets out of sync

### After (Normalized):

```sql
-- booking_services table
booking_id: cb9a3f2d-885a-42a1-a291-a71e58a9875f
service_type: 'guides'
service_id: 2
quantity: 1
days: 1
booked_price: 165.00
```

✅ Normalized data  
✅ Referential integrity  
✅ Easy queries  
✅ Always current service info  
✅ Historical price preservation

## Rollback Plan

If issues arise, the migration includes:

1. **Backup Table**: `bookings_services_backup` contains original JSON data
2. **Dual Support**: Frontend works with both structures
3. **Column Preservation**: Original `services` column kept until cleanup

## Technical Details

### New Table Schema

```sql
CREATE TABLE booking_services (
    id UUID PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id),
    service_type VARCHAR(50) CHECK (service_type IN ('guides', 'paramedics', 'security_companies', 'external_entertainment_companies')),
    service_id INTEGER,
    quantity INTEGER DEFAULT 1,
    days INTEGER DEFAULT 1,
    booked_price DECIMAL(10,2),
    rate_type VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Key Improvements

- **Performance**: Indexed columns for fast queries
- **Integrity**: Foreign key constraints
- **Flexibility**: Easy to add/modify service relationships
- **Scalability**: Supports complex service structures
- **Maintainability**: Separate concerns, easier to debug

## Support

- Check migration logs for any errors
- Verify data integrity before cleanup
- Keep backups until migration is fully verified
