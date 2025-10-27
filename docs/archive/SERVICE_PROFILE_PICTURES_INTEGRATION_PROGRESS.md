# Service Profile Pictures - Quick Integration Guide

## ✅ Guides - COMPLETED

### Edit Page (`app/(defaults)/guides/edit/[id]/page.tsx`)

- ✅ Updated imports to use new component
- ✅ Changed `profile_picture_url` → `profile_picture_url`
- ✅ Updated ServiceProfilePictureUpload component with new props
- ✅ Added onRemoveSuccess callback

### List Page (`app/(defaults)/guides/page.tsx`)

- ✅ Updated imports
- ✅ Changed interface field `profile_picture_url` → `profile_picture_url`
- ✅ Updated datatable render to use `getServiceProfilePictureUrlWithFallback`
- ✅ Added storage cleanup to deleteGuide function
- ✅ Added storage cleanup to bulkDelete function

### Remaining Guides Pages

- ⏳ Preview page - Need to add profile picture display
- ⏳ Add page - Need to add profile picture upload (optional)

## 🔄 Remaining Services

### Paramedics

- ⏳ Edit page
- ⏳ List page (datatable)
- ⏳ Preview page
- ⏳ Add page (optional)

### Security Companies

- ⏳ Edit page
- ⏳ List page (datatable)
- ⏳ Preview page
- ⏳ Add page (optional)

### Entertainment Companies

- ⏳ Edit page
- ⏳ List page (datatable)
- ⏳ Preview page
- ⏳ Add page (optional)

### Travel Companies

- ⏳ Edit page
- ⏳ List page (datatable)
- ⏳ Preview page
- ⏳ Add page (optional)

### Education Programs

- ⏳ Edit page
- ⏳ List page (datatable)
- ⏳ Preview page
- ⏳ Add page (optional)

## 🌐 Global Pages

### Explore Page (`app/(defaults)/explore/page.tsx`)

- ⏳ Update service cards to show profile pictures
- Use: `getServiceProfilePictureUrlWithFallback(service.profile_picture_url, serviceType)`

### Trip Planner (`components/dashboards/trip-planner-dashboard.tsx`)

- ⏳ Show profile pictures when selecting services
- Add to paramedics, guides, security sections

### Service Provider Profile Pages

- ⏳ Create/update profile pages for service providers
- Allow them to edit their own profile pictures

## 📝 Integration Pattern

### 1. Edit Pages

```tsx
// Import
import ServiceProfilePictureUpload from '@/components/services/ServiceProfilePictureUpload';
import { getServiceProfilePictureUrlWithFallback } from '@/utils/service-profile-picture';

// State
const [profilePicturePath, setProfilePicturePath] = useState<string | null>(null);

// In form
<ServiceProfilePictureUpload
    serviceType="guides" // or paramedics, security_companies, etc.
    serviceId={serviceId}
    currentPicturePath={profilePicturePath}
    onUploadSuccess={(path) => {
        setProfilePicturePath(path);
        setAlert({ message: t('profile_picture_updated'), type: 'success' });
    }}
    onUploadError={(error) => {
        setAlert({ message: error, type: 'danger' });
    }}
    onRemoveSuccess={() => {
        setProfilePicturePath(null);
        setAlert({ message: t('profile_picture_removed'), type: 'success' });
    }}
    size="lg"
    label={t('profile_picture')}
/>;
```

### 2. List/Datatable Pages

```tsx
// Import
import { getServiceProfilePictureUrlWithFallback, deleteServiceFolder } from '@/utils/service-profile-picture';

// Interface - change field name
profile_picture_url?: string | null; // was profile_picture_url

// Datatable column
{
    accessor: 'profile_picture',
    title: t('profile_picture'),
    render: ({ profile_picture_url, name }) => (
        <div className="flex items-center justify-center">
            <img
                src={getServiceProfilePictureUrlWithFallback(profile_picture_url, 'guides')}
                alt={name}
                className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
            />
        </div>
    ),
}

// Delete function - add cleanup
await deleteServiceFolder('guides', serviceId);
```

### 3. Preview Pages

```tsx
// Import
import { getServiceProfilePictureUrlWithFallback } from '@/utils/service-profile-picture';

// Display
<img src={getServiceProfilePictureUrlWithFallback(service.profile_picture_url, 'guides')} alt={service.name} className="w-40 h-40 rounded-2xl object-cover shadow-lg" />;
```

### 4. Service Cards (Explore, Trip Planner)

```tsx
// Import
import { getServiceProfilePictureUrlWithFallback } from '@/utils/service-profile-picture';

// In card
<img src={getServiceProfilePictureUrlWithFallback(service.profile_picture_url, serviceType)} alt={service.name} className="w-16 h-16 rounded-full object-cover" />;
```

## 🎯 Service Type Mapping

| Service       | Table Name                         | ServiceType Enum                     |
| ------------- | ---------------------------------- | ------------------------------------ |
| Guides        | `guides`                           | `'guides'`                           |
| Paramedics    | `paramedics`                       | `'paramedics'`                       |
| Security      | `security_companies`               | `'security_companies'`               |
| Entertainment | `external_entertainment_companies` | `'external_entertainment_companies'` |
| Travel        | `travel_companies`                 | `'travel_companies'`                 |
| Education     | `education_programs`               | `'education_programs'`               |

## 📋 Checklist per Service

- [ ] Update interface: `profile_picture_url` → `profile_picture_url`
- [ ] Update imports: Use new component and utilities
- [ ] Edit page: Add ServiceProfilePictureUpload
- [ ] List page: Update datatable column
- [ ] List page: Add deleteServiceFolder to delete functions
- [ ] Preview page: Display profile picture
- [ ] Global pages: Update service cards

## 🚀 Next Steps

1. Complete Guides preview page
2. Apply same pattern to all other services
3. Update Explore page
4. Update Trip Planner
5. Create Service Provider profile pages
