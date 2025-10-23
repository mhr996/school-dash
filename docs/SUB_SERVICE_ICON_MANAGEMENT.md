# Sub-Service Icon Management Implementation

## Overview

This implementation adds icon image management for sub-services in both Entertainment Companies and Education Programs. Icons are stored in Supabase Storage with a structured folder hierarchy that ensures automatic cleanup when parent services are deleted.

## Database Changes

### Migration File

**Location:** `supabase/migrations/20251023000001_add_icon_path_to_sub_services.sql`

Added `icon_path` column to:

- `entertainment_company_services`
- `education_program_services`

## Storage Structure

### Entertainment Company Sub-Services

```
entertainment-companies/
  └── [parent_company_id]/
      └── sub-services/
          └── [sub_service_id]/
              └── icon.[ext]
```

### Education Program Sub-Services

```
destinations-properties/
  └── [parent_program_id]/
      └── sub-services/
          └── [sub_service_id]/
              └── icon.[ext]
```

## Features

### 1. Icon Upload

- **Format Support:** JPEG, JPG, PNG, GIF, WebP, SVG
- **Size Limit:** 5MB maximum
- **Auto-replacement:** Uploading a new icon automatically replaces the old one
- **Validation:** File type and size validation before upload

### 2. Icon Display

- **Preview:** 12x12 thumbnail in services table
- **Fallback:** Default icon placeholder when no image is set
- **Error Handling:** Graceful fallback to placeholder on image load errors

### 3. Icon Management

- **Upload Button:** Easy upload via file input
- **Change Button:** Replace existing icon
- **Delete Button:** Remove icon (appears on hover)
- **Save Requirement:** Services must be saved before icons can be uploaded

### 4. Automatic Cleanup

- **Individual Delete:** Icon deleted when service is deleted
- **Parent Delete:** All sub-service icons deleted when parent is deleted
- **Storage Optimization:** Keeps storage clean and organized

## Utility Functions

### File: `utils/sub-service-icon-upload.ts`

#### `uploadSubServiceIcon()`

Uploads a sub-service icon to the appropriate folder structure.

**Parameters:**

- `serviceType`: 'entertainment_company_services' | 'education_program_services'
- `parentServiceId`: ID of the parent service
- `subServiceId`: ID of the sub-service
- `file`: The image file to upload

**Returns:**

```typescript
{
  success: boolean;
  path?: string;
  error?: string;
}
```

#### `deleteSubServiceIcon()`

Deletes a sub-service icon and its database reference.

**Parameters:**

- `serviceType`: 'entertainment_company_services' | 'education_program_services'
- `parentServiceId`: ID of the parent service
- `subServiceId`: ID of the sub-service

**Returns:**

```typescript
{
  success: boolean;
  error?: string;
}
```

#### `getSubServiceIconUrl()`

Gets the public URL for a sub-service icon.

**Parameters:**

- `serviceType`: 'entertainment_company_services' | 'education_program_services'
- `iconPath`: Path to the icon in storage

**Returns:** `string | null`

#### `deleteAllSubServiceIcons()`

Deletes all sub-service icons for a parent service (used when deleting parent service).

**Parameters:**

- `serviceType`: 'entertainment_company_services' | 'education_program_services'
- `parentServiceId`: ID of the parent service

**Returns:**

```typescript
{
  success: boolean;
  error?: string;
}
```

## UI Components

### Entertainment Company Tabs

**File:** `components/entertainment/entertainment-company-tabs.tsx`

**Changes:**

- Added icon column to services table
- Added icon preview with hover-delete functionality
- Added upload/change button for icon management
- Integrated icon deletion with service deletion

### Education Program Tabs

**File:** `components/education/education-program-tabs.tsx`

**Changes:**

- Added icon column to services table
- Added icon preview with hover-delete functionality
- Added upload/change button for icon management
- Integrated icon deletion with service deletion

## User Flow

### Adding an Icon to a Sub-Service

1. **Create/Save Service First**

    - Add a new sub-service with name and price
    - Click "Save All Services" to persist the service
    - Icon upload becomes available after save

2. **Upload Icon**

    - Click "Upload" button in the icon column
    - Select an image file (max 5MB)
    - Icon is automatically uploaded and displayed

3. **Change Icon**

    - Click "Change" button on existing icon
    - Select a new image file
    - Old icon is automatically replaced

4. **Delete Icon**
    - Hover over the icon thumbnail
    - Click the red "×" button that appears
    - Icon is deleted from storage and database

### Best Practices

1. **Icon Guidelines:**

    - Use square images for best results
    - Recommended size: 256x256px or larger
    - Use transparent backgrounds for non-rectangular icons
    - Keep file sizes reasonable (< 500KB recommended)

2. **Workflow:**
    - Always save services before uploading icons
    - Upload icons after all service details are finalized
    - Review icon appearance before saving

## Database Schema Updates

### entertainment_company_services

```sql
ALTER TABLE entertainment_company_services
ADD COLUMN icon_path text;
```

### education_program_services

```sql
ALTER TABLE education_program_services
ADD COLUMN icon_path text;
```

## Error Handling

The implementation includes comprehensive error handling:

1. **File Validation Errors:**

    - Invalid file type
    - File size exceeds limit

2. **Upload Errors:**

    - Storage upload failures
    - Database update failures
    - Automatic rollback on database errors

3. **Delete Errors:**

    - Storage delete failures
    - Database update failures

4. **Display Errors:**
    - Graceful fallback to placeholder images
    - Console logging for debugging

## Testing Checklist

- [ ] Run migration `20251023000001_add_icon_path_to_sub_services.sql`
- [ ] Create a new entertainment company sub-service
- [ ] Upload an icon for the sub-service
- [ ] Verify icon displays correctly
- [ ] Change the icon to a different image
- [ ] Delete the icon
- [ ] Delete the sub-service and verify icon is removed from storage
- [ ] Repeat for education program sub-services
- [ ] Test with various image formats (PNG, JPEG, SVG)
- [ ] Test file size validation (try uploading >5MB file)
- [ ] Test invalid file type (try uploading .txt or .pdf)

## Future Enhancements

1. **Image Optimization:**

    - Auto-resize large images
    - Convert to WebP for better compression
    - Generate multiple sizes for responsive display

2. **Icon Library:**

    - Provide pre-made icon options
    - Icon search and selection UI
    - Category-based icon browser

3. **Batch Operations:**

    - Upload multiple icons at once
    - Bulk icon replacement
    - Template-based icon application

4. **Enhanced Preview:**
    - Zoom on hover
    - Lightbox for full-size view
    - Icon usage analytics

## Notes

- Icons are stored in separate buckets per service type for better organization
- The folder structure ensures automatic cleanup via Supabase Storage cascade
- Public URLs are generated for easy access without authentication
- All operations include proper error handling and user feedback
