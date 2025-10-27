# Service Profile Pictures - Unified Implementation

## Overview

This document describes the **unified approach** for managing profile pictures across **ALL service types** in the application. Every service now uses a consistent field name (`profile_picture_url`) and organized storage structure.

## Database Changes

### Migration File

- **File**: `supabase_migration_unify_service_profile_pictures.sql`
- **Changes**:
    - ✅ Added `profile_picture_url` to `security_companies`
    - ✅ Added `profile_picture_url` to `travel_companies`
    - ✅ Renamed `image` → `profile_picture_url` in `education_programs`
    - ✅ Renamed `image` → `profile_picture_url` in `external_entertainment_companies`
    - ✅ Renamed `profile_picture_url` → `profile_picture_url` in `guides`
    - ✅ Renamed `profile_picture_url` → `profile_picture_url` in `paramedics`

### Unified Field Name

**All services now use:** `profile_picture_url TEXT`

| Service Type  | Table Name                         | Field Name            |
| ------------- | ---------------------------------- | --------------------- |
| Guides        | `guides`                           | `profile_picture_url` |
| Paramedics    | `paramedics`                       | `profile_picture_url` |
| Security      | `security_companies`               | `profile_picture_url` |
| Entertainment | `external_entertainment_companies` | `profile_picture_url` |
| Travel        | `travel_companies`                 | `profile_picture_url` |
| Education     | `education_programs`               | `profile_picture_url` |

### Storage Structure

Profile pictures are stored in the `services` bucket:

```
services/
  ├── guides/
  │   └── {service_id}/
  │       └── profile.{ext}
  ├── paramedics/
  │   └── {service_id}/
  │       └── profile.{ext}
  ├── security_companies/
  │   └── {service_id}/
  │       └── profile.{ext}
  ├── entertainment/
  │   └── {service_id}/
  │       └── profile.{ext}
  ├── travel_companies/
  │   └── {service_id}/
  │       └── profile.{ext}
  └── education_programs/
      └── {service_id}/
          └── profile.{ext}
```

**Benefits:**

- 🗂️ Organized by service type
- 🗑️ Easy cleanup (delete folder = delete all files)
- 📍 Predictable paths
- 🔄 Consistent naming

## Core Utilities

### Service Profile Picture Utility (`utils/service-profile-picture.ts`)

Comprehensive utility for managing profile pictures across all services.

#### Key Functions:

1. **`uploadServiceProfilePicture(serviceType, serviceId, file)`**

    - Validates file (type, size)
    - Deletes old picture automatically
    - Uploads to correct path: `services/{type}/{id}/profile.{ext}`
    - Updates database with new path
    - Returns: `{ success, path, publicUrl, error }`

2. **`removeServiceProfilePicture(serviceType, serviceId)`**

    - Deletes picture from storage
    - Updates database (sets path to null)
    - Returns: `boolean`

3. **`deleteServiceFolder(serviceType, serviceId)`**

    - Deletes entire service folder
    - Use when deleting a service completely
    - Returns: `boolean`

4. **`getServiceProfilePictureUrlWithFallback(path, serviceType)`**

    - Returns public URL if path exists
    - Returns default icon if no picture
    - Fallback icons for each service type

5. **`generateServiceProfilePath(serviceType, serviceId, fileName)`**

    - Generates storage path
    - Returns: `"{service_type}/{id}/profile.{ext}"`

6. **`validateProfilePicture(file)`**
    - Validates file type (jpg, png, webp, gif)
    - Validates file size (max 5MB)
    - Returns: `error string | null`

## React Component

### ServiceProfilePictureUpload (`components/services/ServiceProfilePictureUpload.tsx`)

Beautiful, reusable component for all service types.

#### Props:

| Prop                 | Type                   | Required | Default | Description                                  |
| -------------------- | ---------------------- | -------- | ------- | -------------------------------------------- |
| `serviceType`        | `ServiceType`          | ✅       | -       | guides, paramedics, security_companies, etc. |
| `serviceId`          | `string`               | ✅       | -       | Service UUID                                 |
| `currentPicturePath` | `string \| null`       | ❌       | `null`  | Current picture path from DB                 |
| `onUploadSuccess`    | `(path, url) => void`  | ❌       | -       | Success callback                             |
| `onUploadError`      | `(error) => void`      | ❌       | -       | Error callback                               |
| `onRemoveSuccess`    | `() => void`           | ❌       | -       | Remove callback                              |
| `className`          | `string`               | ❌       | `''`    | Additional CSS classes                       |
| `size`               | `'sm' \| 'md' \| 'lg'` | ❌       | `'md'`  | Component size                               |
| `editable`           | `boolean`              | ❌       | `true`  | Allow editing                                |
| `label`              | `string`               | ❌       | -       | Label text                                   |

#### Features:

- ✅ **Drag & drop** support
- ✅ **Image preview** before upload
- ✅ **Progress indicator** during upload
- ✅ **File validation** (type + size)
- ✅ **Remove button** with confirmation
- ✅ **Hover effects** and smooth animations
- ✅ **Fallback icons** for each service type
- ✅ **Responsive** design
- ✅ **Dark mode** support
- ✅ **Auto-cleanup** of old pictures

## Usage Examples

### Basic Upload (Service Edit Page)

```tsx
import ServiceProfilePictureUpload from '@/components/services/ServiceProfilePictureUpload';

<ServiceProfilePictureUpload
    serviceType="guides"
    serviceId={guide.id}
    currentPicturePath={guide.profile_picture_url}
    onUploadSuccess={(path, url) => {
        // Update your state
        setGuide({ ...guide, profile_picture_url: path });
        toast.success('Photo updated!');
    }}
    size="lg"
    label="Guide Photo"
/>;
```

### Display Only (No Editing)

```tsx
<ServiceProfilePictureUpload serviceType="paramedics" serviceId={paramedic.id} currentPicturePath={paramedic.profile_picture_url} size="md" editable={false} />
```

### With Custom Callbacks

```tsx
<ServiceProfilePictureUpload
    serviceType="security_companies"
    serviceId={security.id}
    currentPicturePath={security.profile_picture_url}
    onUploadSuccess={(path, url) => {
        // Refresh data from server
        mutate(`/api/security/${security.id}`);
    }}
    onUploadError={(error) => {
        console.error(error);
        toast.error(error);
    }}
    onRemoveSuccess={() => {
        toast.success('Picture removed');
    }}
/>
```

### Display with Fallback

```tsx
import { getServiceProfilePictureUrlWithFallback } from '@/utils/service-profile-picture';

// In your component
<img src={getServiceProfilePictureUrlWithFallback(service.profile_picture_url, 'guides')} alt={service.name} className="w-20 h-20 rounded-full object-cover" />;
```

## Integration Guide

### Step 1: Run Database Migration

```bash
# Execute the migration
psql -U your_user -d your_database -f supabase_migration_unify_service_profile_pictures.sql

# Or via Supabase dashboard: SQL Editor → paste migration → Run
```

### Step 2: Add Component to Edit Pages

For each service type, add the upload component:

```tsx
// Example: guides/edit/[id]/page.tsx
import ServiceProfilePictureUpload from '@/components/services/ServiceProfilePictureUpload';

// In your form
<div className="space-y-6">
    <ServiceProfilePictureUpload
        serviceType="guides"
        serviceId={guide.id}
        currentPicturePath={guide.profile_picture_url}
        onUploadSuccess={() => {
            // Refresh or update state
            router.refresh();
        }}
        size="lg"
        label="Profile Photo"
    />

    {/* Rest of form fields */}
</div>;
```

### Step 3: Update Display Components

Update list/card views to show pictures:

```tsx
import { getServiceProfilePictureUrlWithFallback } from '@/utils/service-profile-picture';

{
    services.map((service) => (
        <div key={service.id}>
            <img src={getServiceProfilePictureUrlWithFallback(service.profile_picture_url, serviceType)} alt={service.name} className="w-16 h-16 rounded-full" />
        </div>
    ));
}
```

### Step 4: Handle Service Deletion

Add cleanup when deleting services:

```tsx
import { deleteServiceFolder } from '@/utils/service-profile-picture';

const handleDelete = async (serviceId: string) => {
    // 1. Delete from database
    await supabase.from('guides').delete().eq('id', serviceId);

    // 2. Clean up storage folder
    await deleteServiceFolder('guides', serviceId);
};
```

## Validation Rules

### File Types

- ✅ JPEG (.jpg, .jpeg)
- ✅ PNG (.png)
- ✅ WEBP (.webp)
- ✅ GIF (.gif)
- ❌ All other types rejected

### File Size

- Maximum: **5MB**
- Larger files are rejected with error message

### Automatic Validation

````tsx
import { validateProfilePicture } from '@/utils/service-profile-picture';

const error = validateProfilePicture(file);
if (error) {
    alert(error); // "Invalid file type..." or "File size exceeds..."
}

## Storage Policies

Ensure your Supabase storage has proper policies:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload service pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'services');

-- Allow authenticated users to update
CREATE POLICY "Users can update service pictures"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'services');

-- Allow authenticated users to delete
CREATE POLICY "Users can delete service pictures"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'services');

-- Allow public read access
CREATE POLICY "Public can view service pictures"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'services');
````

## Troubleshooting

### Image Not Displaying

1. ✅ Check if `profile_picture_url` is stored in database
2. ✅ Verify file exists in storage bucket
3. ✅ Check storage policies allow public read
4. ✅ Inspect network tab for image URL errors
5. ✅ Verify using correct service type

### Upload Failing

1. ✅ Check file size (< 5MB)
2. ✅ Check file type (jpg, png, webp, gif only)
3. ✅ Verify user is authenticated
4. ✅ Check storage bucket write policies
5. ✅ Check browser console for errors

### Old Pictures Not Deleting

1. ✅ Verify upload function is called correctly
2. ✅ Check if old path exists in database
3. ✅ Verify delete permissions in storage

## Best Practices

### ✅ DO

- Use utility functions for all operations
- Handle upload success/error callbacks
- Update local state after successful upload
- Delete storage folder when deleting service
- Use fallback images for better UX
- Validate files before upload

### ❌ DON'T

- Manually construct storage paths
- Forget to clean up storage on service deletion
- Skip file validation
- Hard-code service types
- Ignore error handling

## Summary

This unified implementation provides:

- ✅ **Consistency**: Same field name across all 6 service types
- ✅ **Organization**: Clean folder structure by service type
- ✅ **Ease of Use**: Simple React component + utilities
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Validation**: Built-in file validation
- ✅ **Cleanup**: Automatic deletion of old pictures
- ✅ **Fallbacks**: Default icons for each service
- ✅ **Scalability**: Easy to extend
- ✅ **Beautiful UI**: Drag & drop, animations, responsive

**All services can now manage profile pictures in a clean, consistent way!** 🎨✨

### Pending Implementation:

1. **Service Provider Profile Page** (`app/(defaults)/service/profile/page.tsx`)
    - Allow guides/paramedics to upload their own profile picture
2. **Data Tables**:

    - Display profile pictures in guides data table
    - Display profile pictures in paramedics data table

3. **Explore Page**:

    - Show profile pictures for guides services
    - Show profile pictures for paramedics services

4. **Deletion Cleanup**:
    - Hook into service deletion to clean up storage
    - Implement in guides/paramedics delete functions

## Usage Example

### In Add Page:

```tsx
<ServiceProfileUpload
    serviceType="guides"
    currentUrl={profilePicturePreview}
    onUploadComplete={(url, fileName) => {
        setProfilePicturePreview(url);
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput?.files?.[0]) {
            setProfilePictureFile(fileInput.files[0]);
        }
    }}
    onError={(error) => setAlert({ message: error, type: 'danger' })}
    size="lg"
/>
```

### In Edit Page:

```tsx
<ServiceProfileUpload
    serviceType="guides"
    serviceId={guideId}
    currentUrl={profilePictureUrl}
    onUploadComplete={async (url, path) => {
        const { error } = await supabase.from('guides').update({ profile_picture_url: path }).eq('id', guideId);

        if (!error) {
            setProfilePictureUrl(url);
            setAlert({ message: t('profile_picture_updated'), type: 'success' });
        }
    }}
    onError={(error) => setAlert({ message: error, type: 'danger' })}
    size="lg"
/>
```

### Display in Preview:

```tsx
<img src={getServiceProfileUrl(guide.profile_picture_url)} alt={guide.name} className="w-full h-full object-cover" />
```

## Styling

- Circular avatars with border and shadow
- Hover overlay for edit functionality
- Loading spinners during upload
- Responsive sizing (sm/md/lg)
- Dark mode support

## Translation Keys

Required translation keys:

- `profile_picture`
- `profile_picture_updated`
- `error_updating_profile_picture`
- `tour_guide`
- `paramedic`
