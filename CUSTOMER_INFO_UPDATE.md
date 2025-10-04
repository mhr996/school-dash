# Customer Information Update - Bookings & Bills Pages

## Summary

Updated both the Bookings and Bills pages to fetch customer information from the `users` table using the `customer_id` foreign key relationship, instead of using the deprecated customer fields stored directly on the bookings/bills tables.

## Changes Made

### 1. Bookings Page (`app/(defaults)/bookings/page.tsx`)

#### Interface Update

- **Removed deprecated fields:**

    - `customer_name: string | null`
    - `customer_email: string | null`
    - `customer_phone: string | null`

- **Added customer relationship:**
    ```typescript
    customer_id: string;
    customer: {
        full_name: string;
        email: string;
        phone: string | null;
    } | null;
    ```

#### Query Update

- **Old query:**

    ```typescript
    .select(`
        *,
        destination:destinations(name, address)
    `)
    ```

- **New query:**
    ```typescript
    .select(`
        *,
        customer:users!customer_id(full_name, email, phone),
        destination:destinations(name, address)
    `)
    ```

#### Search Filter Update

- Changed from searching `customer_name`, `customer_email`
- To searching `customer?.full_name`, `customer?.email`

#### Display Update

- Changed from `customer_name || t('no_name')`
- To `customer?.full_name || t('no_name')`

---

### 2. Bills Page (`app/(defaults)/bills/page.tsx`)

#### Interface Update

- **Added to booking object:**
    ```typescript
    booking: {
        booking_reference: string;
        total_amount: number;
        customer_id: string;
        customer: {
            full_name: string;
            email: string;
            phone: string | null;
        } | null;
        destination: {
            name: string;
        };
    };
    ```

#### Query Update

- **Old query:**

    ```typescript
    booking:bookings(
        booking_reference,
        total_amount,
        destination:destinations(name)
    )
    ```

- **New query:**
    ```typescript
    booking:bookings(
        booking_reference,
        total_amount,
        customer_id,
        customer:users!customer_id(full_name, email, phone),
        destination:destinations(name)
    )
    ```

#### Search Filter Update

- Changed from searching `customer_name`, `customer_email`
- To searching `booking?.customer?.full_name`, `booking?.customer?.email`

#### Display Update

- Changed from `customer_name`, `customer_email`
- To `booking?.customer?.full_name || t('unknown_customer')`, `booking?.customer?.email`

---

## Database Schema Reference

The `bookings` table now has:

```sql
customer_id uuid NOT NULL,
CONSTRAINT bookings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id)
```

The `users` table has:

```sql
full_name character varying,
email character varying NOT NULL,
phone character varying,
```

---

## Benefits

1. **Single Source of Truth**: Customer information is now maintained in one place (users table)
2. **Data Consistency**: Any updates to user info automatically reflect in all bookings and bills
3. **Better Data Integrity**: Foreign key relationships ensure valid customer references
4. **Reduced Redundancy**: No duplicate customer data stored across tables
5. **Admin Override Support**: Now properly supports the new school_id linkage where admins can select different users/schools

---

## Migration Notes

- The old `customer_name`, `customer_email`, `customer_phone` fields still exist on the bills table as they are stored at the time of bill creation (historical snapshot)
- Bookings now rely entirely on the `customer_id` relationship
- All existing bookings must have a valid `customer_id` pointing to a user in the users table

---

## Testing Checklist

- [ ] Bookings page loads without errors
- [ ] Bills page loads without errors
- [ ] Search functionality works for customer names and emails
- [ ] Customer information displays correctly in both pages
- [ ] Null customer handling works (shows "Unknown Customer" or "No Name")
- [ ] Admin created bookings show the correct selected user info
- [ ] Non-admin created bookings show the creator's user info
