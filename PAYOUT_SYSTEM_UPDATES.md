# Payout System Updates - Booking & Payment Records

## Overview

Updated the payout system to support two types of records: **booking records** (unpaid obligations) and **payment records** (actual payments made). This creates better tracking of financial obligations to service providers.

## Workflow

### 1. Booking Confirmation

- When an admin confirms a booking (changes status to 'confirmed'), the system automatically creates **booking-type payout records** for each service in the booking
- Each service gets its own booking record with:
    - Amount calculated as: `quantity × days × booked_price`
    - Status: `pending`
    - Type: `booking`
    - Link to the booking_service record

### 2. Payment Creation

- In the payouts page, booking records with `pending` status show a **"Create Payment"** button
- Admin clicks the button and fills in payment details (method, date, account info, etc.)
- System creates a **payment-type payout record** linked to the original booking record
- Original booking record status changes to `paid`
- Both records remain visible in the table for complete audit trail

### 3. Example

- Booking has 3 services → 3 booking records created automatically
- Admin makes 3 payments → 3 payment records created
- Total: 6 records in payouts table (3 booking + 3 payment)

## Database Changes

### Migration File

**Location:** `supabase/migrations/20251022000001_add_payout_type_and_booking_tracking.sql`

### New Columns in `payouts` Table:

1. **`type`** - varchar - 'booking' or 'payment'
    - Distinguishes between obligation records and actual payment records
2. **`booking_service_id`** - uuid (nullable)
    - Links to `booking_services` table
    - Tracks which specific booking service this payout is for
3. **`booking_record_id`** - uuid (nullable)
    - Links payment records to their originating booking records
    - Creates the parent-child relationship
4. **`status`** - varchar - 'pending', 'paid', or 'cancelled'
    - Tracks whether a booking record has been paid
    - Defaults to 'pending' for booking records
    - Set to 'paid' for payment records

### Indexes Added:

- `payouts_booking_service_id_idx` - For quick lookup of payouts by booking service
- `payouts_booking_record_id_idx` - For quick lookup of payments by their booking record
- `payouts_type_status_idx` - For efficient filtering by type and status

## Code Changes

### 1. New Utility: `utils/payout-manager.ts`

Created comprehensive utility for payout management with functions:

#### `createBookingPayoutRecords()`

- **Purpose:** Create booking-type payout records when a booking is confirmed
- **Parameters:**
    - `bookingId` - The confirmed booking ID
    - `bookingReference` - Booking reference number for description
    - `confirmedByUserId` - Admin who confirmed the booking
- **Returns:** Success/error result with created records
- **Logic:**
    1. Fetches all booking_services for the booking
    2. Checks for existing payout records (prevents duplicates)
    3. Gets service provider details from respective tables
    4. Calculates total amount per service
    5. Inserts booking-type payout records

#### `createPaymentFromBookingRecord()`

- **Purpose:** Convert a booking record into a payment record
- **Parameters:**
    - `bookingRecordId` - The booking payout record ID
    - `paymentDetails` - Payment method, date, account info, etc.
    - `createdByUserId` - Admin creating the payment
- **Returns:** Success/error result with payment record
- **Logic:**
    1. Fetches the booking record
    2. Validates no payment already exists
    3. Creates payment record with all details
    4. Updates booking record status to 'paid'

#### `checkBookingHasPayouts()`

- **Purpose:** Check if a booking already has payout records
- **Parameters:** `bookingId`
- **Returns:** boolean

#### `getServiceProviderDetails()`

- **Purpose:** Fetch service provider name and user_id from service tables
- **Parameters:** `serviceType`, `serviceId`
- **Returns:** Provider name and user_id

### 2. Updated: `app/(defaults)/bookings/edit/[id]/page.tsx`

- **Import:** Added `createBookingPayoutRecords` and `checkBookingHasPayouts`
- **Logic Enhancement:** In `handleSave()` function
    - After successful booking update and tax invoice generation
    - Checks if booking status is 'confirmed'
    - Calls `createBookingPayoutRecords()` to generate payout obligations
    - Shows consolidated success message with:
        - Tax invoice number (if generated)
        - Number of payout records created
        - Any errors that occurred

### 3. Updated: `app/(defaults)/payouts/page.tsx`

Major UI and functionality updates:

#### Interface Changes:

```typescript
interface Payout {
    // ...existing fields...
    type: 'booking' | 'payment';
    booking_service_id: string | null;
    booking_record_id: string | null;
    status: 'pending' | 'paid' | 'cancelled';
}
```

#### New State:

- `typeFilter` - Filter by booking/payment type
- `statusFilter` - Filter by pending/paid/cancelled
- `showPaymentModal` - Control payment creation modal
- `selectedBookingRecord` - Currently selected booking for payment
- `paymentForm` - Payment details form data
- `creatingPayment` - Track which record is being processed

#### New UI Components:

1. **Type Filter Dropdown** - Filter by 'booking' or 'payment'
2. **Status Filter Dropdown** - Filter by 'pending', 'paid', or 'cancelled'
3. **Type Column** - Badge showing record type (warning for booking, success for payment)
4. **Status Column** - Badge showing status (warning for pending, success for paid)
5. **Actions Column** - Shows "Create Payment" button for pending booking records
6. **Payment Modal** - Full-featured dialog for creating payments with:
    - Payment method selection
    - Payment date picker
    - Payment-specific fields (account, bank, transaction #, etc.)
    - Notes field
    - Submit/Cancel buttons

#### New Functions:

- `getTypeBadgeClass()` - Returns badge class for type column
- `getStatusBadgeClass()` - Returns badge class for status column
- `handleOpenPaymentModal()` - Opens modal with selected booking record
- `handleClosePaymentModal()` - Closes modal and resets form
- `handleCreatePayment()` - Processes payment creation

#### Filter Logic Updates:

- Added type and status to filter conditions
- All filters work together (AND logic)
- Real-time filtering on data changes

### 4. Updated: `remote_db_schema.sql`

Updated the schema documentation to reflect the new columns and constraints.

## Features Implemented

### ✅ Automatic Booking Record Creation

- Triggered when booking status changes to 'confirmed'
- One record per service in the booking
- Prevents duplicate records
- Captures all service details at time of booking

### ✅ Payment Creation Interface

- Modal-based payment entry
- Payment method specific fields
- Validation and error handling
- Real-time status updates

### ✅ Comprehensive Filtering

- Filter by type (booking/payment)
- Filter by status (pending/paid/cancelled)
- Filter by service type
- Filter by payment method
- Search by provider name, reference, etc.

### ✅ Visual Distinction

- Color-coded badges for types
- Color-coded badges for status
- Conditional action buttons
- Clear labels and icons

### ✅ Audit Trail

- Both booking and payment records preserved
- Linked via `booking_record_id`
- Complete financial history per service
- Created by tracking

### ✅ Data Integrity

- Foreign key constraints
- Check constraints on enums
- Prevents duplicate payments
- Validates amounts > 0

## Benefits

1. **Clear Financial Obligations**

    - See all unpaid obligations at a glance
    - Track which services haven't been paid

2. **Complete Audit Trail**

    - Both obligation and payment records visible
    - Easy to match payments to services
    - Historical tracking

3. **Better Cash Flow Management**

    - Know exactly what's owed
    - Plan payments accordingly
    - Track payment status

4. **Automatic Record Keeping**

    - No manual entry for obligations
    - Reduces human error
    - Consistent data capture

5. **Flexible Filtering**
    - Find unpaid obligations quickly
    - Filter by service type
    - View payment history

## Testing Checklist

- [ ] Confirm a booking and verify booking records are created
- [ ] Check that booking records show "Create Payment" button
- [ ] Create a payment and verify payment record is created
- [ ] Verify booking record status changes to 'paid'
- [ ] Test all filter combinations
- [ ] Verify no duplicate records can be created
- [ ] Test with bookings that have multiple services
- [ ] Verify foreign key relationships work correctly
- [ ] Check that the migration runs without errors
- [ ] Test with different payment methods
- [ ] Verify amounts are calculated correctly (quantity × days × price)

## Migration Instructions

1. **Run the migration:**

    ```bash
    # You mentioned you'll push manually, so run this in your database:
    # Execute the SQL file: supabase/migrations/20251022000001_add_payout_type_and_booking_tracking.sql
    ```

2. **Verify the changes:**

    ```sql
    -- Check table structure
    \d public.payouts;

    -- Verify indexes
    SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'payouts';
    ```

3. **Update existing data (if needed):**
    - All existing payout records will have `type = 'payment'` and `status = 'paid'`
    - This is handled automatically by the migration

## Future Enhancements (Optional)

- [ ] Add bulk payment creation
- [ ] Export pending obligations report
- [ ] Email notifications for pending payments
- [ ] Payment approval workflow
- [ ] Payment scheduling
- [ ] Partial payments support
- [ ] Payment reversal/cancellation
- [ ] Integration with accounting systems

## Notes

- The system preserves backward compatibility
- Existing payout records automatically get `type='payment'` and `status='paid'`
- The feature is non-destructive - all data is retained
- Foreign keys use `ON DELETE SET NULL` to prevent data loss if services are deleted
- All user-facing text uses translation keys for i18n support

---

**Implementation Date:** October 22, 2025  
**Files Modified:** 4  
**Files Created:** 2  
**Database Tables Modified:** 1  
**New Utility Functions:** 4
