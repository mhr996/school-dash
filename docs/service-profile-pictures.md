# Service Profile Pictures (Unified)

This is the canonical guide for the unified profile picture system across all services. It consolidates the architecture, implementation, integration steps, and quick references from the previous series of docs.

## Why

- One DB field across all services: `profile_picture_url`
- One storage layout: `services/{service_type}/{service_id}/profile.{ext}`
- One utility module and one reusable React component
- Predictable paths, easy cleanup, consistent UX

## TL;DR contract

- Input: serviceType, serviceId, File
- Output: `{ success, path, publicUrl, error }` or `boolean` for removals
- Error modes: invalid type/size, storage write, DB update
- Success criteria: picture uploaded, DB path updated, old file deleted

## Database and Storage

All service tables include a `TEXT` column named `profile_picture_url`.

Storage structure:

```
services/
  guides/{id}/profile.{ext}
  paramedics/{id}/profile.{ext}
  security_companies/{id}/profile.{ext}
  external_entertainment_companies/{id}/profile.{ext}
  travel_companies/{id}/profile.{ext}
  education_programs/{id}/profile.{ext}
```

## Utilities API (utils/service-profile-picture.ts)

- `uploadServiceProfilePicture(serviceType, serviceId, file)`
    - Validates file (type: jpg/png/webp/gif, size <= 5MB)
    - Deletes old file if present
    - Uploads to `services/{type}/{id}/profile.{ext}`
    - Updates `{table}.profile_picture_url`
- `removeServiceProfilePicture(serviceType, serviceId)` – delete picture and null DB field
- `deleteServiceFolder(serviceType, serviceId)` – remove entire folder on hard delete
- `getServiceProfilePictureUrlWithFallback(path, serviceType)` – returns public URL or a type-specific fallback icon
- `generateServiceProfilePath(serviceType, serviceId, fileName)` – builds storage key
- `validateProfilePicture(file)` – returns error string or null

## React component

`components/services/ServiceProfilePictureUpload.tsx`

Props (most used):

- `serviceType: ServiceType` | `serviceId: string`
- `currentPicturePath?: string | null`
- `onUploadSuccess?(path, url)` | `onUploadError?(msg)` | `onRemoveSuccess?()`
- `size?: 'sm' | 'md' | 'lg'` | `editable?: boolean` | `label?: string`

Features: drag & drop, preview, progress, validation, remove, fallback image, responsive, dark mode.

## Integration patterns

Place the upload at the top of forms. Use the fallback icon when displaying.

Edit/Add page:

```tsx
<ServiceProfilePictureUpload
    serviceType="guides"
    serviceId={id}
    currentPicturePath={entity.profile_picture_url}
    onUploadSuccess={(path) => setEntity((prev) => ({ ...prev, profile_picture_url: path }))}
    size="lg"
    label={t('profile_picture')}
/>
```

List/Preview:

```tsx
<img src={getServiceProfilePictureUrlWithFallback(item.profile_picture_url, 'guides')} alt={item.name} className="w-16 h-16 rounded-full object-cover" />
```

Hard delete cleanup:

```ts
await deleteServiceFolder('guides', serviceId);
```

## Storage policies (Supabase)

```sql
-- INSERT/UPDATE/DELETE for authenticated; SELECT for public
CREATE POLICY "Authenticated users can upload service pictures" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'services');

CREATE POLICY "Users can update service pictures" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'services');

CREATE POLICY "Users can delete service pictures" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'services');

CREATE POLICY "Public can view service pictures" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'services');
```

## Troubleshooting

- Blank image: check DB `profile_picture_url`, storage object exists, and public read policy
- Upload fails: enforce type/size, user auth, bucket write policy
- Old pictures persist: ensure upload path/cleanup logic is called

## Architecture overview

- UI → Utility layer → Supabase Storage + DB
- Upload flow: validate → get current → delete old → generate path → upload → update DB
- Delete flow: DB record deletion → storage folder cleanup

See archived architecture diagram for a visual walkthrough.

## Archived originals

For full historical details and deep dives, see:

- `docs/archive/SERVICE_PROFILE_PICTURES_README.md`
- `docs/archive/SERVICE_PROFILE_PICTURES_ARCHITECTURE.md`
- `docs/archive/SERVICE_PROFILE_PICTURES_IMPLEMENTATION.md`
- `docs/archive/SERVICE_PROFILE_PICTURES_INTEGRATION_PROGRESS.md`
- `docs/archive/SERVICE_PROFILE_PICTURES_COMPLETE.md`
- `docs/archive/SERVICE_PROFILE_PICTURES_QUICK_REFERENCE.md`
