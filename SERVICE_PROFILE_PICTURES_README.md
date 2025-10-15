# Service Provider Profile Pictures Implementation

## Overview

This document describes the implementation of profile picture functionality for guides and paramedics service providers.

## Database Changes

### Migration File

- **File**: `supabase_migration_add_profile_pictures.sql`
- **Changes**:
    - Added `profile_picture_url` column to `guides` table
    - Added `profile_picture_url` column to `paramedics` table
    - Both columns store the storage path to the profile picture

### Storage Structure

Profile pictures are stored in the `services` bucket with the following structure:

```
services/
  ├── guides/
  │   └── {guide_id}/
  │       └── profile-{timestamp}.{ext}
  └── paramedics/
      └── {paramedic_id}/
          └── profile-{timestamp}.{ext}
```

## New Utilities

### Service Profile Upload Utility (`utils/service-profile-upload.ts`)

Provides functions for managing service provider profile pictures:

#### Functions:

1. **`uploadServiceProfilePicture(file, serviceType, serviceId, existingUrl?)`**

    - Uploads a profile picture to the correct storage path
    - Automatically deletes old profile picture if one exists
    - Returns public URL and storage path

2. **`deleteServiceProfilePicture(serviceType, serviceId)`**

    - Deletes all files in a service provider's storage folder
    - Used when updating or removing profile pictures

3. **`deleteServiceFolder(serviceType, serviceId)`**

    - Deletes entire service folder when service is deleted
    - Keeps storage clean

4. **`getServiceProfileUrl(path)`**
    - Converts storage path to public URL
    - Returns default avatar if no picture exists

## New Components

### ServiceProfileUpload (`components/image-upload/service-profile-upload.tsx`)

Specialized component for uploading service provider profile pictures.

#### Props:

- `serviceType`: 'guides' | 'paramedics'
- `serviceId`: Optional (for add page vs edit page)
- `currentUrl`: Current profile picture URL
- `onUploadComplete`: Callback when upload completes
- `onError`: Error handler
- `size`: 'sm' | 'md' | 'lg'
- `showButton`: Display as button instead of circular avatar
- `disabled`: Disable upload functionality

#### Features:

- Image preview before upload
- File type validation (JPG, PNG, GIF, WEBP)
- File size validation (max 5MB)
- Automatic cleanup of old images
- Support for both add and edit modes

## Updated Pages

### Guides

#### Add Page (`app/(defaults)/guides/add/page.tsx`)

- **Changes**:
    - Added profile picture upload section
    - Profile picture uploaded after guide creation
    - Stores file temporarily until guide is saved

#### Edit Page (`app/(defaults)/guides/edit/[id]/page.tsx`)

- **Changes**:
    - Added profile picture upload section
    - Immediate upload on file selection
    - Database updated automatically

#### Preview Page (`app/(defaults)/guides/preview/[id]/page.tsx`)

- **Changes**:
    - Added profile picture display in sidebar
    - Shows default avatar if no picture exists
    - Large circular display with name and role

### Paramedics

#### Add Page (`app/(defaults)/paramedics/add/page.tsx`)

- **Changes**: Same as guides add page

#### Edit Page (`app/(defaults)/paramedics/edit/[id]/page.tsx`)

- **Changes**: Same as guides edit page

#### Preview Page (`app/(defaults)/paramedics/preview/[id]/page.tsx`)

- **Changes**: Same as guides preview page

## Features

### Add/Edit Pages

1. **Profile Picture Upload**:

    - Large circular upload area
    - Click to upload
    - Preview before save
    - Modern UI with hover effects

2. **Validation**:

    - Only image files accepted
    - Maximum 5MB file size
    - Clear error messages

3. **User Experience**:
    - Loading states during upload
    - Success/error notifications
    - Instant preview

### Preview Pages

1. **Profile Picture Display**:
    - Large (160x160px) circular avatar
    - Shown in sidebar
    - Includes name and role label
    - Default avatar for missing pictures

## Storage Management

### Automatic Cleanup

- Old profile pictures are deleted when:
    - New picture is uploaded
    - Service is deleted (to be implemented)

### File Organization

- Each service has its own folder
- Files named with timestamp to avoid conflicts
- Easy to identify and manage

## Security Considerations

1. **File Type Validation**: Only image files allowed
2. **File Size Limit**: 5MB maximum
3. **Storage Path**: Uses service ID to prevent conflicts
4. **Access Control**: Should be configured in Supabase storage policies

## Next Steps

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
