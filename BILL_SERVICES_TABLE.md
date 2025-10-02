# Bill View Services Table Enhancement

## Overview

Added a comprehensive services table to the tax invoice bill view page that displays all services included in the booking, providing complete transparency about what was ordered.

## Changes Made

### 1. Database Integration

- **Fetch Booking Services**: Added query to retrieve all services from the `booking_services` table linked to the bill's booking
- **Service Details Resolution**: For each service, fetch the actual service name from the respective service table (guides, paramedics, security_companies, external_entertainment_companies, travel_companies)
- **Async Data Loading**: Implemented Promise.all pattern to fetch all service details concurrently

### 2. Enhanced Bill Details Interface

Added `BookingService` interface:

```typescript
interface BookingService {
    id: string;
    service_type: string;
    service_id: string;
    quantity: number;
    days: number;
    booked_price: number;
    rate_type: string;
    service_details?: {
        name: string;
    };
}
```

### 3. UI Implementation

Created a professional services table showing:

- **Service Type**: Color-coded badge (blue background)
- **Service Name**: Resolved from the service provider tables
- **Quantity**: Number of units/people booked
- **Days**: Duration of service
- **Price**: Unit price per service
- **Total**: Calculated total (price × quantity × days)

### 4. Visual Design

- **Responsive Table**: Horizontal scroll on mobile devices
- **Hover Effects**: Row highlights on hover for better UX
- **Dark Mode Support**: Full dark mode theming
- **Professional Styling**: Consistent with existing bill design
- **Table Structure**:
    - Header row with grey background
    - Alternating row colors for readability
    - Right-aligned numerical columns
    - Center-aligned count columns

### 5. Conditional Display

- **Tax Invoice Only**: Services table only appears for tax invoices (not receipts)
- **Has Services**: Only displays when booking has associated services
- **Fallback Text**: Shows "Unknown Service" if service details can't be fetched

### 6. Service Type Translation

Uses existing translation keys:

- `service_guides` → "Guides" / "المرشدون" / "מדריכים"
- `service_paramedics` → "Paramedics" / "المسعفون" / "פרמדיקים"
- `service_security_companies` → "Security Companies" / "شركات الأمن" / "חברות אבטחה"
- `service_external_entertainment_companies` → "Entertainment Companies" / "شركات الترفيه" / "חברות בידור"
- `service_travel_companies` → "Travel Companies" / "شركات السفر" / "חברות נסיעות"

### 7. Localization

Added new translation keys in all three languages:

**English (en.json)**:

- `booking_services`: "Booking Services"
- `service_name`: "Service Name" (already existed, deduplicated)
- `unknown_service`: "Unknown Service"

**Arabic (ae.json)**:

- `booking_services`: "خدمات الحجز"
- `service_name`: "اسم الخدمة" (already existed, deduplicated)
- `unknown_service`: "خدمة غير معروفة"

**Hebrew (he.json)**:

- `booking_services`: "שירותי הזמנה"
- `service_name`: "שם השירות" (already existed, deduplicated)
- `unknown_service`: "שירות לא ידוע"

## Technical Implementation

### Data Fetching

```typescript
// Fetch booking services if this is a tax invoice
if (data && data.bill_type === 'tax_invoice' && data.booking_id) {
    const { data: servicesData } = await supabase.from('booking_services').select('*').eq('booking_id', data.booking_id);

    // Fetch service details for each service
    const servicesWithDetails = await Promise.all(
        servicesData.map(async (service) => {
            const { data: serviceDetail } = await supabase.from(service.service_type).select('name').eq('id', service.service_id).single();

            return {
                ...service,
                service_details: { name: serviceDetail?.name || t('unknown_service') },
            };
        }),
    );
    setBookingServices(servicesWithDetails);
}
```

### Table Rendering

The table includes:

- Sortable columns for better data organization
- Calculated totals for each service row
- Responsive design with overflow scrolling
- Professional typography and spacing

## User Experience

### For Administrators

1. View tax invoice for a booking
2. See detailed breakdown of all services included
3. Verify quantities, days, and pricing for each service
4. Calculate total service costs at a glance

### For Customers

1. Transparent view of what services were booked
2. Clear pricing breakdown per service
3. Easy-to-understand quantity and duration information
4. Professional invoice presentation

## Benefits

- ✅ **Complete Transparency**: Shows exactly what services were included in the booking
- ✅ **Professional Invoicing**: Standard itemized invoice format
- ✅ **Easy Verification**: Admins can quickly verify service details
- ✅ **Audit Trail**: Clear record of what was booked at what price
- ✅ **Multi-language Support**: Fully translated in EN/AR/HE
- ✅ **Responsive Design**: Works on all device sizes
- ✅ **Dark Mode**: Fully themed for dark mode users

## Table Columns

1. **Service Type**: Badge showing category (guides, paramedics, etc.)
2. **Service Name**: Actual name of the service provider
3. **Quantity**: Number of units booked
4. **Days**: Duration of service
5. **Price**: Unit price
6. **Total**: Calculated total amount

## Data Flow

```
Bill (tax_invoice)
  ↓
Booking ID
  ↓
booking_services table (service_type, service_id, quantity, days, price)
  ↓
Respective service tables (guides, paramedics, etc.) → Fetch name
  ↓
Display in services table
```

## Future Enhancements

- Add service descriptions tooltip
- Export services breakdown separately
- Filter/search services in the table
- Group services by type
- Show rate type (hourly, daily, regional, etc.)

## Testing Checklist

- [ ] Services table displays for tax invoices with services
- [ ] Services table hidden for receipts
- [ ] Services table hidden when no services exist
- [ ] All service types display correctly
- [ ] Service names resolve properly
- [ ] Quantities and days display correctly
- [ ] Prices format correctly with currency
- [ ] Total calculations are accurate
- [ ] Table is responsive on mobile
- [ ] Dark mode styling works correctly
- [ ] All translations display in EN/AR/HE
- [ ] Unknown service fallback works
