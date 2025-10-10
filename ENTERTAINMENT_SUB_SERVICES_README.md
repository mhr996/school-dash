# Entertainment Company Sub-Services Feature

## Overview

This feature allows external entertainment companies to manage multiple sub-services, each with its own label, price, description, and active status. The interface uses a tabbed design with Basic Information and Services Provided tabs, accessible by both admin users and service providers.

## Database Schema

### Table: `entertainment_company_services`

```sql
CREATE TABLE public.entertainment_company_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entertainment_company_id UUID NOT NULL
        REFERENCES public.external_entertainment_companies(id) ON DELETE CASCADE,
    service_label VARCHAR NOT NULL,
    service_price NUMERIC NOT NULL DEFAULT 0 CHECK (service_price >= 0),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features:**

- **CASCADE DELETE**: When an entertainment company is deleted, all associated sub-services are automatically removed
- **Price Validation**: Service price must be >= 0
- **Indexes**:
    - `idx_entertainment_services_company_id` for company lookups
    - `idx_entertainment_services_active` for filtering active services
- **Auto-updating Timestamps**: Trigger automatically updates `updated_at` on record changes

## Components

### EntertainmentCompanyTabs Component

**Location:** `components/entertainment/entertainment-company-tabs.tsx`

**Features:**

- Two-tab interface using `@headlessui/react`
    1. **Basic Information Tab**: Company name, description, base price, image, status
    2. **Services Provided Tab**: Dynamic list of sub-services

**Props:**

```typescript
interface EntertainmentCompanyTabsProps {
    companyId: string;
    companyData: {
        name: string;
        description: string;
        price: number;
        image: string;
        status: string;
    };
    onUpdate?: () => void;
    isServiceProvider: boolean;
}
```

**Key Functions:**

- `fetchServices()`: Load all services for the company
- `handleAddService()`: Add new empty service to array
- `handleServiceChange(index, field, value)`: Update specific service field
- `handleDeleteService(index)`: Delete service from DB and UI
- `handleSaveBasicInfo()`: Update company information
- `handleSaveServices()`: Save all services (INSERT new + UPDATE existing)

**Validation:**

- Service label cannot be empty
- Service price must be >= 0
- All fields validated before save

**UI Features:**

- Service count badge on Services tab
- Empty state with icon when no services
- Grid layout for service fields (name, price, description, active checkbox)
- Individual delete button per service
- Separate save buttons per tab
- Alert system for success/error messages

## Integration Points

### Admin Dashboard

**File:** `app/(defaults)/external-entertainment-companies/preview/[id]/page.tsx`

**Changes:**

- Imported `EntertainmentCompanyTabs` component
- Replaced static company information display with tabbed interface
- Added `handleCompanyUpdate()` callback to refresh data after updates
- Props: `isServiceProvider={false}` (admin view includes status field)

**File:** `app/(defaults)/external-entertainment-companies/edit/[id]/page.tsx`

**Changes:**

- Imported `EntertainmentCompanyTabs` component
- Replaced traditional form with tabbed interface
- Users can edit basic info AND manage services in one place
- Props: `isServiceProvider={false}` (admin view includes status field)

**File:** `app/(defaults)/external-entertainment-companies/add/page.tsx`

**Changes:**

- Kept as traditional form (must create company + user account first)
- **Updated redirect**: After creation, redirects to `/edit/${companyId}` instead of list
- This allows users to immediately add services without extra navigation

### Service Provider Dashboard

**File:** `app/(defaults)/service/profile/page.tsx`

**Changes:**

- Imported `EntertainmentCompanyTabs` component
- Conditionally render tabs for `entertainment_company` role
- Replaced entertainment company form fields with tabbed interface
- Removed separate save button for entertainment companies (handled in tabs)
- Props: `isServiceProvider={true}` (hides admin-only status field)

## Migration

**File:** `supabase/migrations/add_entertainment_company_services.sql`

**To apply:**

```bash
# Via Supabase CLI
supabase db push

# Or manually run the migration file in Supabase dashboard
```

**What it creates:**

1. `entertainment_company_services` table
2. Foreign key constraint with CASCADE DELETE
3. Check constraint for price validation
4. Two indexes for performance
5. Trigger function for auto-updating timestamps
6. Table and column comments for documentation

## Localization

**New Translation Keys Added:**

### Hebrew (he.json)

```json
"services_provided": "שירותים מוצעים",
"add_service": "הוסף שירות",
"no_services_yet": "אין שירותים עדיין",
"click_add_service_to_start": "לחץ על 'הוסף שירות' כדי להתחיל",
"services_saved_successfully": "השירותים נשמרו בהצלחה",
"error_saving_services": "שגיאה בשמירת שירותים",
"service_deleted_successfully": "השירות נמחק בהצלחה",
"please_fill_all_service_fields": "נא למלא את כל שדות השירות",
"base_price": "מחיר בסיס"
```

### Arabic (ae.json)

```json
"services_provided": "الخدمات المقدمة",
"add_service": "إضافة خدمة",
"no_services_yet": "لا توجد خدمات بعد",
"click_add_service_to_start": "انقر على 'إضافة خدمة' للبدء",
"services_saved_successfully": "تم حفظ الخدمات بنجاح",
"error_saving_services": "خطأ في حفظ الخدمات",
"service_deleted_successfully": "تم حذف الخدمة بنجاح",
"please_fill_all_service_fields": "يرجى ملء جميع حقول الخدمة",
"base_price": "السعر الأساسي"
```

## Usage Examples

### Admin View

1. Navigate to External Entertainment Companies list
2. Click "Add New Company"
3. Fill in basic company info + user account details
4. Click "Save"
5. **Automatically redirected to Edit page (with tabs)**
6. In "Services Provided" tab:
    - Click "Add Service" to add new service
    - Fill in service label (required), price (required), description (optional)
    - Toggle "Active" checkbox for each service
    - Click "Save Services"
    - Delete unwanted services with red delete button
7. Click back to list when done

**OR** edit existing company:

1. Navigate to External Entertainment Companies list
2. Click on any company to view details (Preview page with tabs)
3. See two tabs: "Basic Information" and "Services Provided"
4. In Basic Information tab:
    - Edit company name, description, base price, image
    - Change status (active/inactive)
    - Click "Save Basic Information"
5. In Services Provided tab:
    - Manage services as above

### Service Provider View

1. Service provider logs in with entertainment company account
2. Navigate to Profile page
3. Same tabbed interface appears
4. Status field is hidden (admin-only)
5. Manage own sub-services independently

## Technical Notes

### Data Flow

1. Component mounts → `fetchServices()` loads existing services
2. User adds/edits services → Local state updates
3. User clicks "Save Services" → Validation → API calls
    - New services (no `id`): INSERT into database
    - Existing services (has `id`): UPDATE in database
4. Success → Alert shown → Parent refreshed via `onUpdate` callback

### Role-Based Rendering

- `isServiceProvider={true}`: Hides status dropdown (service can't change own status)
- `isServiceProvider={false}`: Shows all fields including status

### Performance Optimizations

- Database indexes on `company_id` and `company_id + is_active`
- Separate saves per tab (don't force saving all data at once)
- Only modified services are sent to API

### Error Handling

- Validation errors shown in alert component
- Empty service labels or negative prices prevented
- Database errors caught and displayed to user
- Supabase connection errors handled gracefully

## Future Enhancements

### Potential Improvements

1. **Service Categories**: Group services by type (e.g., "Shows", "Activities")
2. **Service Images**: Upload individual images per service
3. **Availability Calendar**: Set specific dates when services are available
4. **Package Deals**: Create bundles of multiple services at discounted price
5. **Service Reviews**: Allow booking feedback on specific services
6. **Usage Analytics**: Track which services are most booked
7. **Bulk Operations**: Enable/disable or delete multiple services at once
8. **Service Templates**: Pre-defined service types for quick setup
9. **Price History**: Track price changes over time
10. **Service Duration**: Add time estimates for each service

## Testing Checklist

- [ ] Apply database migration successfully
- [ ] Admin can view entertainment company with tabs
- [ ] Admin can add new sub-service
- [ ] Admin can edit existing sub-service
- [ ] Admin can delete sub-service
- [ ] Admin can toggle service active status
- [ ] Admin can save basic info (separate from services)
- [ ] Service provider can access their profile with tabs
- [ ] Service provider cannot see status dropdown
- [ ] Service provider can manage their own services
- [ ] Validation works (empty label, negative price)
- [ ] Alert messages display correctly (success and error)
- [ ] Parent data refreshes after updates
- [ ] CASCADE DELETE works (deleting company removes services)
- [ ] Localization keys display correctly in Hebrew and Arabic
- [ ] Service count badge shows correct number
- [ ] Empty state appears when no services exist
- [ ] Grid layout responsive on mobile devices

## Related Files

### Core Files

- `supabase/migrations/add_entertainment_company_services.sql` - Database schema
- `components/entertainment/entertainment-company-tabs.tsx` - Tabbed component
- `app/(defaults)/external-entertainment-companies/preview/[id]/page.tsx` - Admin view
- `app/(defaults)/service/profile/page.tsx` - Service provider view

### Localization Files

- `public/locales/he.json` - Hebrew translations
- `public/locales/ae.json` - Arabic translations

### Reference Files

- `types/index.ts` - May need EntertainmentCompanyService type
- `lib/supabase.js` - Supabase client configuration

## Troubleshooting

### Migration Issues

**Problem:** Migration fails with "table already exists"
**Solution:** Migration uses `CREATE TABLE IF NOT EXISTS`, so it's safe to re-run

**Problem:** Foreign key constraint fails
**Solution:** Ensure `external_entertainment_companies` table exists first

### Component Issues

**Problem:** Tabs don't show data
**Solution:** Check `companyId` is valid and service exists in database

**Problem:** Save fails silently
**Solution:** Check browser console for API errors, verify Supabase connection

**Problem:** Services don't refresh after save
**Solution:** Ensure `onUpdate` callback is properly wired to parent component

### Localization Issues

**Problem:** Keys show as raw strings (e.g., "services_provided")
**Solution:** Verify keys are added to ALL locale files (he.json, ae.json, en.json)

**Problem:** Duplicate key errors in JSON
**Solution:** Some keys like "active", "inactive", "company_name" already exist, don't re-add them

## Support

For issues or questions:

1. Check this README first
2. Review component PropTypes and TypeScript types
3. Check browser console for errors
4. Verify database migration was applied
5. Ensure Supabase RLS policies allow access

---

**Last Updated:** 2024
**Version:** 1.0.0
**Status:** ✅ Complete and Ready for Testing
