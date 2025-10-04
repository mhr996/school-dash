# School-Booking Linkage Implementation Summary

## Overview

This document describes the implementation of school-to-booking linkage in the trip planner dashboard, allowing bookings to be automatically linked to schools for trip planners and school managers, with admin override capability.

## Database Changes

### Migration Created

**File:** `supabase/migrations/20251004000001_add_school_id_to_bookings.sql`

This migration adds a `school_id` column to the `bookings` table:

- Column type: `uuid` (foreign key to `schools.id`)
- Nullable: Yes (allows flexibility)
- Indexed: Yes (for query performance)
- Purpose: Links bookings to schools for organizational tracking

**Status:** ⚠️ **Migration file created but NOT YET APPLIED to database**

### How to Apply the Migration

Since the Supabase CLI connection is timing out, you need to manually apply this migration through the Supabase Dashboard:

1. Log into your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/20251004000001_add_school_id_to_bookings.sql`
4. Execute the SQL

**Migration SQL:**

```sql
-- Add school_id column to bookings table
ALTER TABLE public.bookings
ADD COLUMN school_id uuid REFERENCES public.schools(id);

-- Add index for better query performance
CREATE INDEX idx_bookings_school_id ON public.bookings(school_id);

-- Add comment to document the column
COMMENT ON COLUMN public.bookings.school_id IS 'Links booking to a school. Auto-populated from user.school_id for trip planners/school managers. Admin can override.';
```

## Frontend Changes

### 1. Trip Planner Dashboard (`components/dashboards/trip-planner-dashboard.tsx`)

#### New State Variables

```typescript
const [isAdminUser, setIsAdminUser] = useState(false);
const [allSchools, setAllSchools] = useState<any[]>([]);
const [allUsers, setAllUsers] = useState<any[]>([]);
const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
```

#### User Authentication Enhancement

- Detects if current user is admin
- Fetches all schools and users for admin selection (only if admin)
- Sets up admin override capability

#### Booking Creation Logic

**For Non-Admins (Trip Planners / School Managers):**

- `school_id`: Automatically set from `currentUser.school_id`
- `customer_id`: Set to `currentUser.id`

**For Admins:**

- `school_id`: Set from admin's selected school (`selectedSchoolId`)
- `customer_id`: Set from admin's selected user (`selectedUserId`)
- Validation: Both school and user must be selected before booking creation

#### UI Changes - Admin Override Section

Added a new section in the checkout modal (visible only to admins):

- **School Selector**: Dropdown to select which school the booking belongs to
- **User Selector**: Dropdown to select which user the booking is for (filtered by selected school)
- Visual styling: Amber-colored panel to distinguish admin override section
- Position: Appears before the order summary in the checkout modal

### 2. Translation Files

Added new translation keys to support the admin UI:

**English (`public/locales/en.json`):**

- `select_user`: "Select User"
- `admin_override`: "Admin Override"
- `select_school_and_user`: "Select School and User"
- `admin_must_select_school_and_user`: "Admin must select both school and user for booking"

**Arabic (`public/locales/ae.json`):**

- `select_user`: "اختر المستخدم"
- `admin_override`: "صلاحية المدير"
- `select_school_and_user`: "اختر المدرسة والمستخدم"
- `admin_must_select_school_and_user`: "يجب على المدير اختيار المدرسة والمستخدم للحجز"

**Hebrew (`public/locales/he.json`):**

- `select_user`: "בחר משתמש"
- `admin_override`: "הרשאת מנהל"
- `select_school_and_user`: "בחר בית ספר ומשתמש"
- `admin_must_select_school_and_user`: "המנהל חייב לבחור גם בית ספר וגם משתמש להזמנה"

## User Experience Flow

### For Trip Planners / School Managers

1. User logs in (already linked to a school via `users.school_id`)
2. Creates a booking through the trip planner dashboard
3. System automatically links the booking to their school
4. No additional UI elements shown
5. Booking is created with:
    - `customer_id` = their user ID
    - `school_id` = their school ID

### For Admins

1. Admin logs in
2. Creates a booking through the trip planner dashboard
3. Checkout modal shows additional "Admin Override" section
4. Admin must select:
    - Which school the booking belongs to
    - Which user the booking is for
5. User dropdown is filtered based on selected school
6. System validates both selections before allowing booking creation
7. Booking is created with:
    - `customer_id` = selected user ID
    - `school_id` = selected school ID

## Next Steps

### Immediate Action Required

1. **Apply the migration** to add `school_id` column to the `bookings` table (see instructions above)

### Testing Checklist

Once migration is applied:

1. **Test as Trip Planner:**

    - [ ] Create a booking and verify `school_id` is set correctly
    - [ ] Verify no admin selectors are shown in checkout modal
    - [ ] Verify booking appears in bookings list

2. **Test as School Manager:**

    - [ ] Create a booking and verify `school_id` is set correctly
    - [ ] Verify no admin selectors are shown in checkout modal
    - [ ] Verify booking appears in bookings list

3. **Test as Admin:**
    - [ ] Verify admin selectors appear in checkout modal
    - [ ] Try to submit without selecting school (should show error)
    - [ ] Try to submit without selecting user (should show error)
    - [ ] Select school and user, create booking
    - [ ] Verify booking has correct `school_id` and `customer_id`
    - [ ] Verify user dropdown filters by selected school

### Future Enhancements (Optional)

1. Update the bookings list page to display school information
2. Add school filter to bookings list
3. Update booking edit page to show/allow changing school (admin only)
4. Add school-based analytics and reporting
5. Update booking preview/details page to show school information

## Files Modified

1. `supabase/migrations/20251004000001_add_school_id_to_bookings.sql` (created)
2. `components/dashboards/trip-planner-dashboard.tsx` (modified)
3. `public/locales/en.json` (modified)
4. `public/locales/ae.json` (modified)
5. `public/locales/he.json` (modified)

## Technical Notes

- The `school_id` column is nullable to maintain backward compatibility with existing bookings
- Admin override section uses a distinctive amber color scheme to make it clear this is an administrative function
- User selection is dynamically filtered based on selected school for better UX
- All validation is performed before database insertion to prevent invalid data
- Console logging added for debugging school and user selection

## Troubleshooting

### If bookings fail to create after migration:

1. Verify the migration was applied successfully
2. Check that the `school_id` column exists in the `bookings` table
3. Check console for any SQL errors
4. Verify users have valid `school_id` values in the `users` table

### If admin selectors don't appear:

1. Verify user role is exactly "admin" (check `user_roles.name`)
2. Check browser console for any JavaScript errors
3. Verify schools and users are being fetched (check network tab)

### If user dropdown is empty:

1. Verify users have `school_id` values
2. Check that selected school ID matches users' `school_id`
3. Verify users are active (`is_active = true`)

---

**Implementation Date:** October 4, 2025
**Status:** ✅ Code Complete | ⚠️ Migration Pending
