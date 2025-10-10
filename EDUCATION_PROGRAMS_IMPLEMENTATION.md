# Education Programs Feature Implementation

## Overview

Added a new "Education Programs" service type that mirrors the external entertainment companies functionality, including database tables, UI components, and full CRUD operations.

## Database Changes

### New Tables Created

#### 1. `education_programs`

Main table for storing education program providers.

**Columns:**

- `id` (uuid, primary key)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `name` (character varying, NOT NULL) - Program name
- `image` (text) - Image URL
- `description` (text) - Program description
- `price` (numeric) - Base price
- `status` (character varying, default 'active') - Status (active/inactive)
- `user_id` (uuid, foreign key to users table) - Linked user account

**Indexes:**

- `idx_education_programs_status` - For filtering by status
- `idx_education_programs_user_id` - For user lookups

#### 2. `education_program_services`

Sub-services table for storing individual services offered by education programs.

**Columns:**

- `id` (uuid, primary key)
- `education_program_id` (uuid, foreign key, NOT NULL) - References education_programs(id)
- `service_label` (character varying, NOT NULL) - Service name
- `service_price` (numeric, NOT NULL, default 0) - Service price
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

**Indexes:**

- `idx_education_program_services_program_id` - For filtering by program

**Cascade Deletes:** When an education program is deleted, all its services are automatically deleted.

### Updated Tables

#### `booking_services`

Updated the `service_type` constraint to include `'education_programs'`:

- guides
- paramedics
- security_companies
- external_entertainment_companies
- travel_companies
- **education_programs** ← NEW

#### `payouts`

Updated the `service_type` constraint to include `'education_programs'` for tracking payments.

### Row Level Security (RLS)

All tables have RLS policies enabled for authenticated users with full CRUD permissions.

## Storage Bucket

**Bucket Name:** `education-programs`

- Used for storing program images
- File path pattern: `{programId}/{timestamp}.{extension}`
- Auto-cleanup: Old images deleted when new ones uploaded

## Files Created

### Pages

#### 1. List Page

**Path:** `app/(defaults)/education-programs/page.tsx`
**Features:**

- DataTable with pagination, sorting, and search
- Displays: image, name, description, price, balance, status, created date
- Actions: View, Edit, Delete
- Bulk delete functionality
- Balance calculation integration
- Responsive design

#### 2. Add Page

**Path:** `app/(defaults)/education-programs/add/page.tsx`
**Features:**

- Tabbed interface (Basic Information / Services)
- Form fields:
    - Program name (required)
    - Base price
    - Description
    - Image upload with preview
    - Status selector
    - User account creation (email & password)
- Sub-services management table
- Form validation
- Success/error alerts
- Auto-redirect on success

#### 3. Edit Page

**Path:** `app/(defaults)/education-programs/edit/[id]/page.tsx`
**Features:**

- Breadcrumb navigation
- Loads existing program data
- Uses EducationProgramTabs component
- Real-time data refresh after updates
- Loading states

### Components

#### Education Program Tabs

**Path:** `components/education/education-program-tabs.tsx`
**Features:**

- Reusable tabbed component for edit functionality
- Two tabs: Basic Information & Services
- **Basic Information Tab:**
    - Edit name, price, description
    - Image upload with preview (using ImageUpload component)
    - Status toggle (admin only)
    - Save changes button
- **Services Tab:**
    - List all sub-services
    - Add new services inline
    - Edit existing services
    - Delete services with confirmation
    - Save all services button
    - Empty state with call-to-action
- Real-time validation
- Success/error notifications
- Loading states

### Utilities

#### Service Balance Manager

**Path:** `utils/service-balance-manager.ts`
**Update:** Added `'education_programs'` to the `ServiceType` union type

This enables balance calculation for education programs, tracking:

- Total earned from bookings
- Total payouts made
- Net balance (earned - paid)
- Booking and payout counts

## User Flow

### Creating a New Education Program

1. Navigate to `/education-programs`
2. Click "Add Education Program"
3. Fill in Basic Information tab:
    - Enter program name
    - Set base price (optional)
    - Add description
    - Upload program image
    - Set status (active/inactive)
    - Provide email and password for user account
4. Switch to Services tab (optional):
    - Click "Add Service"
    - Enter service name and price
    - Repeat for multiple services
5. Click "Save Education Program"
6. User account is created automatically
7. Redirected to programs list

### Editing an Education Program

1. Navigate to `/education-programs`
2. Click edit icon on desired program
3. Modify Basic Information or Services in respective tabs
4. Click "Save Changes" in each tab
5. Updates are saved immediately
6. Success notification appears

### Deleting an Education Program

1. Click delete icon on program row
2. Confirm deletion in modal
3. Program, services, images, and user account all deleted
4. Success notification appears

## Integration Points

### Bookings System

Education programs can now be:

- Selected as a service type in bookings
- Assigned to trips
- Tracked for revenue and payouts
- Included in booking summaries

### Balance Management

- Automatically calculates balances based on bookings and payouts
- Displays in programs list
- Color-coded (green for positive, red for negative)
- Supports payout tracking

### File Storage

- Uses Supabase Storage
- Bucket: `education-programs`
- Automatic cleanup on deletion
- Image preview in UI

## Features Comparison

| Feature          | External Entertainment | Education Programs |
| ---------------- | ---------------------- | ------------------ |
| List View        | ✅                     | ✅                 |
| Add/Create       | ✅                     | ✅                 |
| Edit/Update      | ✅                     | ✅                 |
| Delete           | ✅                     | ✅                 |
| Bulk Delete      | ✅                     | ✅                 |
| Image Upload     | ✅                     | ✅                 |
| Image Preview    | ✅                     | ✅                 |
| Sub-Services     | ✅                     | ✅                 |
| User Account     | ✅                     | ✅                 |
| Balance Tracking | ✅                     | ✅                 |
| Search/Filter    | ✅                     | ✅                 |
| Pagination       | ✅                     | ✅                 |
| Sorting          | ✅                     | ✅                 |
| Status Toggle    | ✅                     | ✅                 |

## Translation Keys

The following translation keys are used (with fallbacks):

- `education_programs_management`
- `education_programs`
- `education_program`
- `add_education_program`
- `edit_education_program`
- `search_education_programs`
- `program_name`
- `program_image`
- `error_loading_education_program`
- `education_program_added_successfully`
- `education_program_deleted_successfully`
- `error_adding_education_program`
- `error_deleting_education_program`
- All standard service-related keys

## Migration Steps

To deploy this feature:

1. **Run Database Migration:**

    ```sql
    -- Execute supabase_migration_education_programs.sql
    ```

2. **Create Storage Bucket:**

    - Create a public bucket named `education-programs` in Supabase Storage
    - Set appropriate permissions (public read, authenticated write)

3. **Update Service Balance Manager:**

    - Already updated to include `'education_programs'` service type

4. **Add Navigation Link** (if needed):
    ```tsx
    <Link href="/education-programs">Education Programs</Link>
    ```

## Security

### Row Level Security (RLS)

- All tables have RLS enabled
- Authenticated users can perform CRUD operations
- Can be customized per role if needed

### User Accounts

- Each education program can have a linked user account
- User roles managed through `user_roles` table
- Uses `education_program` or fallback `service_provider` role

### Data Deletion

- Cascading deletes for sub-services
- Storage cleanup for images
- User account deletion (both public.users and auth.users)

## Future Enhancements

Potential improvements:

1. Preview page similar to entertainment companies
2. Advanced filtering by status, price range
3. Bulk import/export functionality
4. Service provider dashboard
5. Booking assignment interface
6. Performance analytics
7. Rating/review system
8. Document attachments

## Testing Checklist

- [ ] Create new education program
- [ ] Add sub-services
- [ ] Upload program image
- [ ] Edit program information
- [ ] Update sub-services
- [ ] Delete individual services
- [ ] Delete entire program
- [ ] Bulk delete programs
- [ ] Search and filter
- [ ] Pagination navigation
- [ ] Sort by different columns
- [ ] Balance calculation display
- [ ] User account creation
- [ ] Image preview and fallback
- [ ] Mobile responsiveness
- [ ] Dark mode compatibility

## Notes

- The implementation follows the same patterns as external entertainment companies for consistency
- All components are TypeScript-typed for better development experience
- Uses existing UI components (ImageUpload, Alert, ConfirmModal, etc.)
- Fully integrated with the existing booking and payout systems
- Ready for i18n translation support
