# Booking Reference Format Update

## Overview

Updated the booking reference generation to use booking type-specific prefixes instead of the generic "BK" prefix.

## Format

**Pattern:** `[PREFIX][TIMESTAMP][RANDOM]`

- **Prefix:** 2-letter code based on booking type
- **Timestamp:** Last 6 digits of current timestamp
- **Random:** 2-digit random number (00-99)

**Total Length:** 10 characters

## Booking Type Prefixes

| Booking Type        | Prefix | Example Reference |
| ------------------- | ------ | ----------------- |
| Full Trip           | `FT`   | `FT72337313`      |
| Guides Only         | `GU`   | `GU45629187`      |
| Paramedics Only     | `PM`   | `PM89234556`      |
| Security Only       | `SC`   | `SC34233442`      |
| Entertainment Only  | `EN`   | `EN12456789`      |
| Transportation Only | `TR`   | `TR98765432`      |
| Education Only      | `ED`   | `ED56789012`      |

## Implementation Details

### Location

`components/dashboards/trip-planner-dashboard.tsx` (around line 948)

### Code

```typescript
// Generate booking type prefix
const getBookingTypePrefix = (type: BookingType): string => {
    const prefixMap: Record<BookingType, string> = {
        full_trip: 'FT',
        guides_only: 'GO',
        paramedics_only: 'PM',
        security_only: 'SC',
        entertainment_only: 'EN',
        transportation_only: 'TR',
        education_only: 'ED',
    };
    return prefixMap[type] || 'BK';
};

// Generate unique booking reference to prevent collisions
const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
const random = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, '0');
const bookingTypePrefix = getBookingTypePrefix(selectedBookingType || 'full_trip');
const uniqueBookingRef = `${bookingTypePrefix}${timestamp}${random}`;
```

## Benefits

1. **Quick Identification:** Staff can immediately identify the booking type from the reference number
2. **Better Organization:** Easier to filter and sort bookings by type
3. **Professional:** More informative reference numbers for customers
4. **Backwards Compatible:** Fallback to "BK" if booking type is unknown

## Examples by Use Case

### Full Trip Booking

- Reference: `FT72337313`
- Includes: Destination + Multiple services

### Security Service Only

- Reference: `SC34233442`
- Includes: Security services only (no destination)

### Education Programs Only

- Reference: `ED56789012`
- Includes: Education program services only

## Database Compatibility

- Field: `bookings.booking_reference`
- Type: `VARCHAR` (UNIQUE)
- Max Length: 10 characters
- All existing references remain valid
- New bookings will use the new format

## Testing

To test different booking types:

1. Create a Full Trip booking → Should generate `FT` prefix
2. Create a Security Only booking → Should generate `SC` prefix
3. Create an Education Only booking → Should generate `ED` prefix
4. Verify all references are unique
5. Check that references display correctly in:
    - My Bookings page
    - Admin Dashboard
    - Payment records
    - Email notifications

## Migration Notes

- No database migration required
- Existing booking references (starting with "BK") remain unchanged
- New bookings will automatically use the new format
- The system gracefully handles both old and new formats
