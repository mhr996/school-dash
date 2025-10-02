# Edit Destination Image Preview Enhancement

## Overview

Enhanced the edit destination page to show proper image previews for existing thumbnail and gallery images, with improved UI for deleting and replacing images.

## Changes Made

### 1. Visual Image Previews

- **Thumbnail Preview**: Shows a 48x48 preview of the current thumbnail image with hover effects
- **Gallery Preview**: Displays all existing gallery images in a responsive grid (2 columns on mobile, 4 on desktop)
- **Images are 32px height**: All gallery images display at uniform height with object-cover for proper aspect ratio

### 2. Delete Functionality

- **Hover to Delete**: Delete button appears on hover over images with smooth opacity transition
- **Background Overlay**: Semi-transparent black overlay on hover for better UX
- **Visual Feedback**: Red circular delete button with trash icon
- **Deferred Deletion**: Images are marked for deletion but only removed from storage on form submission

### 3. Improved State Management

Added new state variables:

- `deletedGalleryPaths`: Tracks gallery images marked for deletion
- `shouldDeleteThumbnail`: Tracks if the thumbnail should be deleted

### 4. Enhanced Form Submission Logic

The submit handler now:

1. **Deletes marked gallery images** from Supabase storage
2. **Deletes old thumbnail** if marked for deletion
3. **Uploads new thumbnail** if provided
4. **Preserves existing thumbnail** if not deleted and no new file uploaded
5. **Uploads new gallery images** and adds them to existing paths
6. **Updates database** with the final array of gallery paths

### 5. Better UI/UX

- **Current Image Display**: Shows "Current: [filename]" label for existing thumbnail
- **Contextual Upload Labels**:
    - "Replace Thumbnail" when new file is selected
    - "Upload New Thumbnail" when existing thumbnail exists
    - "Add More Images" for gallery when images already exist
- **Grid Layout**: Responsive gallery grid with proper spacing
- **Filename Display**: Shows truncated filename below each gallery image

### 6. Localization

Added new translation keys in all three languages:

**English (en.json)**:

- `replace_thumbnail`: "Replace Thumbnail"
- `upload_new_thumbnail`: "Upload New Thumbnail"
- `add_more_images`: "Add More Images"

**Arabic (ae.json)**:

- `replace_thumbnail`: "استبدال الصورة المصغرة"
- `upload_new_thumbnail`: "تحميل صورة مصغرة جديدة"
- `add_more_images`: "إضافة المزيد من الصور"

**Hebrew (he.json)**:

- `replace_thumbnail`: "החלף תמונה ממוזערת"
- `upload_new_thumbnail`: "העלה תמונה ממוזערת חדשה"
- `add_more_images`: "הוסף עוד תמונות"

## Technical Implementation

### Import Addition

```typescript
import { getPublicUrlFromPath } from '@/utils/file-upload';
```

### New State Variables

```typescript
const [deletedGalleryPaths, setDeletedGalleryPaths] = useState<string[]>([]);
const [shouldDeleteThumbnail, setShouldDeleteThumbnail] = useState(false);
```

### Delete Handlers

```typescript
const handleRemoveGallery = (path: string) => {
    setGalleryPaths((prev) => prev.filter((p) => p !== path));
    setDeletedGalleryPaths((prev) => [...prev, path]);
};

const handleDeleteExistingThumbnail = () => {
    setShouldDeleteThumbnail(true);
    setThumbnailPath(null);
};
```

### Storage Cleanup in Submit Handler

```typescript
// Delete marked gallery images from storage
if (deletedGalleryPaths.length > 0) {
    for (const path of deletedGalleryPaths) {
        const cleanPath = path.startsWith('/destinations/') ? path.replace('/destinations/', '') : path;
        await supabase.storage.from('destinations').remove([cleanPath]);
    }
}

// Delete old thumbnail if marked for deletion
if (shouldDeleteThumbnail && thumbnailPath) {
    const cleanPath = thumbnailPath.startsWith('/destinations/') ? thumbnailPath.replace('/destinations/', '') : thumbnailPath;
    await supabase.storage.from('destinations').remove([cleanPath]);
}
```

## User Experience Flow

### Viewing Existing Images

1. User opens edit destination page
2. Existing thumbnail displays as image preview with filename
3. Existing gallery images display in responsive grid

### Deleting Images

1. User hovers over image
2. Dark overlay appears with delete button
3. User clicks delete button
4. Image is removed from preview (but not from storage yet)
5. On form submit, image is permanently deleted from Supabase storage

### Adding New Images

1. User uploads new thumbnail (optional - replaces or adds to existing)
2. User uploads new gallery images (adds to existing images)
3. On form submit, new images are uploaded and paths are updated in database

### Replacing Thumbnail

1. User sees existing thumbnail preview
2. User can delete existing thumbnail (click delete button)
3. User uploads new thumbnail via upload component
4. On form submit, old thumbnail is deleted and new one is saved

## Benefits

- ✅ **Visual Confirmation**: Users can see what images are currently uploaded
- ✅ **Better UX**: Intuitive hover-to-delete interaction
- ✅ **Efficient Storage**: Only deletes images when form is submitted
- ✅ **Error Prevention**: Clear visual feedback prevents accidental deletions
- ✅ **Responsive Design**: Works well on mobile and desktop
- ✅ **Internationalized**: Fully translated in all supported languages
- ✅ **Clean Code**: Proper state management and separation of concerns

## Testing Checklist

- [ ] Existing thumbnail displays correctly
- [ ] Existing gallery images display in grid
- [ ] Hover effect shows delete button
- [ ] Deleting thumbnail removes preview
- [ ] Deleting gallery image removes from grid
- [ ] Uploading new thumbnail works
- [ ] Uploading new gallery images works
- [ ] Form submission deletes marked images from storage
- [ ] Form submission uploads new images
- [ ] Database updates with correct paths
- [ ] All translations display correctly in EN/AR/HE
