# Database Schema Updates for Booking Types

## Overview

This document describes the database schema changes implemented to support different types of bookings in the trip planner system.

## New Booking Types Supported

1. **full_trip** - Complete trip with destination and services (original functionality)
2. **guides_only** - Tour guides only booking
3. **paramedics_only** - Medical assistance only booking
4. **security_only** - Security services only booking
5. **entertainment_only** - Entertainment services only booking
6. **transportation_only** - Travel/transportation only booking
7. **mixed_services** - Multiple services without destination requirement

## Database Changes

### 1. Bookings Table Updates

**New Columns:**

- `booking_type` (varchar) - Specifies the type of booking with CHECK constraint
- `booking_metadata` (jsonb) - Additional metadata specific to booking type
- `customer_id` (uuid) - Foreign key reference to users table for customer identification

**Modified Columns:**

- `destination_id` - Now nullable to support service-only bookings

**Deprecated Columns (for transition):**

- `customer_name` - Will be removed in future migration, use customer_id → users.full_name
- `customer_email` - Will be removed in future migration, use customer_id → users.email
- `customer_phone` - Will be removed in future migration, use customer_id → users.phone

**New Constraints:**

- `booking_destination_requirement_check` - Ensures destination_id is required only for full_trip bookings
- `booking_customer_data_check` - Ensures either customer_id or legacy customer fields are provided during transition
- `bookings_customer_id_fkey` - Foreign key constraint linking to users table
- Updated CHECK constraint for booking_type values

### 2. Booking Services Table Updates

**Modified Constraints:**

- `service_type` enum now includes `travel_companies`
- Updated CHECK constraint to support all service types

### 3. New Indexes

- `idx_bookings_booking_type` - Performance optimization for booking type queries
- `idx_booking_services_service_type` - Performance optimization for service type queries
- `idx_bookings_customer_id` - Performance optimization for customer lookups

## Migration Files

1. **20241001000001_add_booking_types_support.sql** - Main booking types migration
2. **20241001000002_rollback_booking_types_support.sql** - Rollback for booking types
3. **20241001000003_seed_booking_types_test_data.sql** - Test data seeding
4. **20241001000004_normalize_customer_data.sql** - Customer data normalization
5. **20241001000005_complete_customer_normalization.sql** - Remove legacy customer fields
6. **20241001000006_rollback_customer_normalization.sql** - Rollback customer normalization

## Customer Data Normalization

### Problem

The original bookings table stored customer information directly:

```sql
customer_name character varying,
customer_email character varying,
customer_phone character varying,
```

This approach creates data duplication and consistency issues when customer information changes.

### Solution

Replace direct customer fields with a foreign key reference:

```sql
customer_id uuid REFERENCES users(id)
```

### Migration Strategy

1. **Phase 1 (20241001000004)**: Add `customer_id` field alongside existing fields
2. **Phase 2 (20241001000005)**: Remove legacy fields (run only after full transition)

### Benefits

- **Data Consistency**: Single source of truth for customer information
- **Real-time Updates**: Customer changes automatically reflect in bookings
- **Referential Integrity**: Ensures customers exist in the system
- **Better Queries**: Efficient joins with customer data

## Usage Examples

### Creating Different Booking Types (New Recommended Approach)

```sql
-- Full Trip Booking (requires destination and customer)
INSERT INTO bookings (booking_reference, booking_type, destination_id, customer_id, trip_date, total_amount)
VALUES ('BK001', 'full_trip', 'dest-uuid', 'user-uuid', '2024-10-15', 500.00);

-- Guides Only Booking (no destination required)
INSERT INTO bookings (booking_reference, booking_type, customer_id, trip_date, total_amount, booking_metadata)
VALUES ('BK002', 'guides_only', 'user-uuid', '2024-10-20', 150.00, '{"duration": "4 hours", "location": "City Center"}');

-- Transportation Only Booking
INSERT INTO bookings (booking_reference, booking_type, customer_id, trip_date, total_amount, booking_metadata)
VALUES ('BK003', 'transportation_only', 'user-uuid', '2024-10-25', 200.00, '{"pickup": "School", "dropoff": "Event Center"}');
```

### Querying Bookings with Customer Data

```sql
-- Get booking with customer information
SELECT
    b.booking_reference,
    b.booking_type,
    b.trip_date,
    b.total_amount,
    u.full_name as customer_name,
    u.email as customer_email,
    u.phone as customer_phone
FROM bookings b
JOIN users u ON b.customer_id = u.id
WHERE b.booking_reference = 'BK001';
```

### Adding Services to Bookings

```sql
-- Add guide service
INSERT INTO booking_services (booking_id, service_type, service_id, quantity, days, booked_price, rate_type)
VALUES ('booking-uuid', 'guides', 'guide-uuid', 1, 1, 150.00, 'daily');

-- Add travel company service
INSERT INTO booking_services (booking_id, service_type, service_id, quantity, days, booked_price, rate_type)
VALUES ('booking-uuid', 'travel_companies', 'travel-company-uuid', 1, 1, 200.00, 'fixed');
```

## Business Logic Constraints

1. **Full Trip Bookings:**

    - MUST have a destination_id
    - Can have any combination of services
    - Traditional trip planning functionality

2. **Service-Only Bookings:**

    - destination_id is optional (usually NULL)
    - Must have at least one service in booking_services table
    - Specific service requirements based on booking type

3. **Mixed Services:**
    - No destination required
    - Can combine multiple service types
    - Flexible service selection

## Frontend Integration

The booking types correspond to the frontend booking type configurations:

```typescript
const bookingTypeConfigs = [
    { id: 'full_trip', requiresDestination: true, allowsDestination: true },
    { id: 'guides_only', requiredServices: ['guides'], allowsDestination: false },
    { id: 'paramedics_only', requiredServices: ['paramedics'], allowsDestination: false },
    // ... etc
];
```

## Deployment Steps

1. Run the main migration:

    ```bash
    supabase db push
    ```

2. Optionally run the test data seeding:

    ```sql
    -- Execute 20241001000003_seed_booking_types_test_data.sql
    ```

3. Update application code to handle new booking types

4. Test all booking type workflows

## Rollback Instructions

If rollback is needed:

```sql
-- Execute 20241001000002_rollback_booking_types_support.sql
```

**Note:** Rollback may require data cleanup if new booking types have been created.

## Testing Checklist

- [ ] Create full_trip booking with destination
- [ ] Create guides_only booking without destination
- [ ] Create paramedics_only booking
- [ ] Create security_only booking
- [ ] Create entertainment_only booking
- [ ] Create transportation_only booking
- [ ] Create mixed_services booking
- [ ] Verify constraint validation works
- [ ] Test booking_services with travel_companies
- [ ] Verify indexes improve query performance
