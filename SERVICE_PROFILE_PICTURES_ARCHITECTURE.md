# Service Profile Pictures - Architecture Diagram

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  ServiceProfilePictureUpload Component                   │  │
│  │  • Drag & drop upload                                    │  │
│  │  • Image preview                                         │  │
│  │  • Progress indicator                                    │  │
│  │  • Validation feedback                                   │  │
│  │  • Remove button                                         │  │
│  └────────────────────┬────────────────────────────────────┘  │
│                       │                                         │
└───────────────────────┼─────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│                      UTILITY LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  utils/service-profile-picture.ts                              │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │  Upload          │  │  Remove          │  │  Delete      │ │
│  │  ----------------│  │  ----------------│  │  Folder      │ │
│  │  • Validate      │  │  • Remove file   │  │  ----------  │ │
│  │  • Delete old    │  │  • Update DB     │  │  • List all  │ │
│  │  • Upload new    │  │                  │  │  • Delete    │ │
│  │  • Update DB     │  │                  │  │    files     │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │  Generate Path   │  │  Get URL         │  │  Validate    │ │
│  │  ----------------│  │  ----------------│  │  File        │ │
│  │  • Service type  │  │  • Public URL    │  │  ----------  │ │
│  │  • Service ID    │  │  • Fallback      │  │  • Type      │ │
│  │  • File name     │  │    icons         │  │  • Size      │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                 │
└────────────┬────────────────────────────────┬───────────────────┘
             │                                │
             ↓                                ↓
┌─────────────────────────────┐  ┌──────────────────────────────┐
│     SUPABASE STORAGE        │  │     SUPABASE DATABASE        │
├─────────────────────────────┤  ├──────────────────────────────┤
│                             │  │                              │
│  Bucket: services           │  │  Tables:                     │
│  ├── guides/                │  │  • guides                    │
│  │   └── {id}/             │  │  • paramedics                │
│  │       └── profile.ext   │  │  • security_companies        │
│  ├── paramedics/            │  │  • entertainment             │
│  │   └── {id}/             │  │  • travel_companies          │
│  │       └── profile.ext   │  │  • education_programs        │
│  ├── security_companies/    │  │                              │
│  │   └── {id}/             │  │  All have:                   │
│  │       └── profile.ext   │  │  profile_picture_path TEXT   │
│  ├── entertainment/         │  │                              │
│  │   └── {id}/             │  │                              │
│  │       └── profile.ext   │  │                              │
│  ├── travel_companies/      │  │                              │
│  │   └── {id}/             │  │                              │
│  │       └── profile.ext   │  │                              │
│  └── education_programs/    │  │                              │
│      └── {id}/             │  │                              │
│          └── profile.ext   │  │                              │
│                             │  │                              │
└─────────────────────────────┘  └──────────────────────────────┘
```

## 🔄 Upload Flow

```
User selects file
       │
       ↓
┌─────────────────┐
│  Validate File  │ ← Check type (jpg, png, webp, gif)
│                 │ ← Check size (max 5MB)
└────────┬────────┘
         │
         ↓ [Valid]
┌─────────────────┐
│  Get Current    │ ← Query database for existing path
│  Picture Path   │
└────────┬────────┘
         │
         ↓ [Has existing]
┌─────────────────┐
│  Delete Old     │ ← Remove old file from storage
│  Picture        │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Generate Path  │ ← services/{type}/{id}/profile.{ext}
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Upload to      │ ← Upload to Supabase Storage
│  Storage        │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Update         │ ← Update profile_picture_path in DB
│  Database       │
└────────┬────────┘
         │
         ↓
    Success! ✓
    Return path & URL
```

## 🗑️ Delete Flow

```
User deletes service
       │
       ↓
┌─────────────────┐
│  Delete from    │ ← Remove record from database
│  Database       │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Get Service    │ ← List all files in folder
│  Folder Path    │   services/{type}/{id}/
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Delete All     │ ← Remove all files in folder
│  Files          │   (including profile picture)
└────────┬────────┘
         │
         ↓
    Complete! ✓
    Folder cleaned up
```

## 📊 Data Model

```
┌─────────────────────────────────────────────────────────┐
│                     Service Tables                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  guides                    security_companies           │
│  ├── id (uuid)            ├── id (uuid)                │
│  ├── name                 ├── name                     │
│  ├── phone                ├── phone                    │
│  ├── email                ├── email                    │
│  ├── hourly_rate          ├── hourly_rate              │
│  ├── daily_rate           ├── daily_rate               │
│  └── profile_picture_path └── profile_picture_path     │
│                                                         │
│  paramedics               entertainment                 │
│  ├── id (uuid)            ├── id (uuid)                │
│  ├── name                 ├── name                     │
│  ├── phone                ├── description              │
│  ├── email                ├── price                    │
│  ├── hourly_rate          └── profile_picture_path     │
│  ├── daily_rate                                        │
│  └── profile_picture_path travel_companies             │
│                           ├── id (uuid)                │
│                           ├── name                     │
│                           ├── code                     │
│                           ├── email                    │
│                           ├── phone                    │
│                           └── profile_picture_path     │
│                                                         │
│                           education_programs            │
│                           ├── id (uuid)                │
│                           ├── name                     │
│                           ├── description              │
│                           ├── price                    │
│                           └── profile_picture_path     │
│                                                         │
└─────────────────────────────────────────────────────────┘

Key: profile_picture_path (TEXT) - Unified across all tables
```

## 🎯 Integration Points

```
┌─────────────────────────────────────────────────────────┐
│                   Application Layer                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Admin Pages              Service Provider Pages        │
│  ├── Guides Edit          ├── Profile Page             │
│  ├── Paramedics Edit      └── Edit Own Profile         │
│  ├── Security Edit                                     │
│  ├── Entertainment Edit                                │
│  ├── Travel Edit                                       │
│  └── Education Edit                                    │
│                                                         │
│  Display Components                                     │
│  ├── List/Table Views    (Show thumbnails)            │
│  ├── Detail/Preview       (Show large picture)         │
│  ├── Cards               (Show avatars)               │
│  └── Explore Page         (Show in service cards)      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 🔐 Security & Permissions

```
┌─────────────────────────────────────────────────────────┐
│                  Storage Policies                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  READ (Public)                                          │
│  ├── Anyone can view profile pictures                  │
│  └── Used for displaying in UI                         │
│                                                         │
│  WRITE (Authenticated)                                  │
│  ├── Admin can upload/update/delete any picture        │
│  ├── Service provider can edit own picture             │
│  └── Validated at application level                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 🎨 Component Hierarchy

```
ServiceProfilePictureUpload
├── Container
│   ├── Label (optional)
│   └── Upload Area
│       ├── Background Image
│       ├── Hover Overlay
│       │   ├── Camera Icon
│       │   └── "Change Picture" text
│       ├── Upload Progress
│       │   ├── Spinner
│       │   └── "Uploading..." text
│       ├── Drag Overlay
│       │   ├── Upload Icon
│       │   └── "Drop image here" text
│       └── Remove Button
│           └── Trash Icon
├── File Input (hidden)
└── Error Message (conditional)
```

## 📈 Performance Considerations

```
┌─────────────────────────────────────────────────────────┐
│                   Optimizations                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  • File size limit: 5MB max                            │
│  • Supported formats: jpg, png, webp, gif              │
│  • Old files auto-deleted (no orphans)                 │
│  • Lazy loading of images in lists                     │
│  • Fallback icons (cached)                             │
│  • Organized folder structure (fast lookups)           │
│  • Single utility file (tree-shakeable)                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

**This architecture provides a scalable, maintainable solution for managing service profile pictures across the entire application!** 🚀
