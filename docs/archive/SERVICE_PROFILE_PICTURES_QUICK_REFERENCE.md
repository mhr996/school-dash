/\*\*

- =====================================================
- SERVICE PROFILE PICTURES - QUICK REFERENCE
- =====================================================
-
- This file provides quick copy-paste code snippets for
- implementing service profile pictures across the app.
  \*/

// =====================================================
// 1. IMPORT STATEMENTS
// =====================================================

// In any component that needs profile picture functionality:
import ServiceProfilePictureUpload from '@/components/services/ServiceProfilePictureUpload';
import {
getServiceProfilePictureUrlWithFallback,
deleteServiceFolder,
ServiceType
} from '@/utils/service-profile-picture';

// =====================================================
// 2. SERVICE EDIT/ADD PAGES - Upload Component
// =====================================================

/\*\*

- Add this to your service edit/add form
- Replace 'guides' with your service type
  \*/
  <ServiceProfilePictureUpload
  serviceType="guides" // or paramedics, security_companies, etc.
  serviceId={guide.id}
  currentPicturePath={guide.profile_picture_url}
  onUploadSuccess={(path, publicUrl) => {
  // Update your local state
  setGuide({ ...guide, profile_picture_url: path });
  // Or refresh from database
  router.refresh();
  // Show success message
  toast.success('Profile picture updated!');
  }}
  onUploadError={(error) => {
  console.error('Upload error:', error);
  toast.error(error);
  }}
  onRemoveSuccess={() => {
  setGuide({ ...guide, profile_picture_url: null });
  toast.success('Profile picture removed');
  }}
  size="lg" // sm, md, or lg
  label="Profile Photo"
  editable={true}
  />

// =====================================================
// 3. LIST/TABLE VIEWS - Display Picture
// =====================================================

/\*\*

- Show profile picture in service lists/cards
  \*/
  <img
  src={getServiceProfilePictureUrlWithFallback(
  service.profile_picture_url,
  'guides' // service type
  )}
  alt={service.name}
  className="w-16 h-16 rounded-full object-cover shadow-md"
  />

// =====================================================
// 4. DETAIL/PREVIEW PAGES - Large Display
// =====================================================

/\*\*

- Show larger profile picture in detail views
\*/
  <div className="relative w-40 h-40">
      <img
          src={getServiceProfilePictureUrlWithFallback(
              service.profile_picture_url,
              'guides'
          )}
          alt={service.name}
          className="w-full h-full rounded-2xl object-cover shadow-xl"
      />
  </div>

// =====================================================
// 5. SERVICE DELETION - Cleanup Storage
// =====================================================

/\*\*

- Clean up storage folder when deleting a service
  \*/
  const handleDeleteService = async (serviceId: string) => {
  try {
  // 1. Delete from database
  const { error } = await supabase
  .from('guides')
  .delete()
  .eq('id', serviceId);
            if (error) throw error;

            // 2. Delete storage folder (including profile picture)
            await deleteServiceFolder('guides', serviceId);

            toast.success('Service deleted successfully');
            router.refresh();
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete service');
        }
    };

// =====================================================
// 6. FETCHING DATA - Include profile_picture_url
// =====================================================

/\*\*

- When fetching service data, include profile_picture_url
  _/
  const { data: guides } = await supabase
  .from('guides')
  .select('_, profile_picture_url')
  .eq('status', 'active');

// =====================================================
// 7. SERVICE TYPES (TypeScript)
// =====================================================

/\*\*

- Available service types for TypeScript
  \*/
  type ServiceType =
  | 'guides'
  | 'paramedics'
  | 'security_companies'
  | 'external_entertainment_companies'
  | 'travel_companies'
  | 'education_programs';

// =====================================================
// 8. STORAGE PATHS (for reference)
// =====================================================

/\*\*

- Storage structure (automatically handled by utilities):
-
- services/guides/{id}/profile.png
- services/paramedics/{id}/profile.jpg
- services/security_companies/{id}/profile.webp
- services/entertainment/{id}/profile.png
- services/travel_companies/{id}/profile.jpg
- services/education_programs/{id}/profile.png
  \*/

// =====================================================
// 9. VALIDATION RULES
// =====================================================

/\*\*

- Automatically validated by the component:
-   - File types: JPG, PNG, WEBP, GIF
-   - Max size: 5MB
-   - Errors shown to user automatically
      \*/

// =====================================================
// 10. FALLBACK ICONS (automatic)
// =====================================================

/\*\*

- Default icons used when no profile picture exists:
-
- guides → /assets/services-icons/guide.png
- paramedics → /assets/services-icons/paramedic.png
- security_companies → /assets/services-icons/security.png
- external_entertainment_companies → /assets/services-icons/entertainment.png
- travel_companies → /assets/services-icons/transportation.png
- education_programs → /assets/services-icons/education.png
  \*/

// =====================================================
// 11. COMPONENT PROPS (Full Reference)
// =====================================================

interface ServiceProfilePictureUploadProps {
serviceType: ServiceType; // Required - type of service
serviceId: string; // Required - service UUID
currentPicturePath?: string | null; // Optional - current picture path
onUploadSuccess?: (path: string, publicUrl: string) => void; // Optional
onUploadError?: (error: string) => void; // Optional
onRemoveSuccess?: () => void; // Optional
className?: string; // Optional - additional CSS
size?: 'sm' | 'md' | 'lg'; // Optional - default 'md'
editable?: boolean; // Optional - default true
label?: string; // Optional - label text
}

// =====================================================
// 12. EXAMPLE: Complete Service Edit Page Structure
// =====================================================

export default function EditGuidePage({ params }: { params: { id: string } }) {
const [guide, setGuide] = useState<any>(null);
const router = useRouter();
const { t } = getTranslation();

    useEffect(() => {
        loadGuide();
    }, []);

    const loadGuide = async () => {
        const { data } = await supabase
            .from('guides')
            .select('*, profile_picture_url')
            .eq('id', params.id)
            .single();
        setGuide(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Save guide data (profile picture already uploaded via component)
        const { error } = await supabase
            .from('guides')
            .update({
                name: guide.name,
                phone: guide.phone,
                // profile_picture_url already updated by component
            })
            .eq('id', params.id);

        if (!error) {
            toast.success(t('guide_updated'));
            router.push('/guides');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture Upload */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
                <ServiceProfilePictureUpload
                    serviceType="guides"
                    serviceId={params.id}
                    currentPicturePath={guide?.profile_picture_url}
                    onUploadSuccess={(path) => {
                        setGuide({ ...guide, profile_picture_url: path });
                    }}
                    size="lg"
                    label={t('profile_photo')}
                />
            </div>

            {/* Other form fields */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 space-y-4">
                <input
                    type="text"
                    value={guide?.name || ''}
                    onChange={(e) => setGuide({ ...guide, name: e.target.value })}
                    placeholder={t('name')}
                    className="form-input"
                />
                {/* More fields... */}
            </div>

            <button type="submit" className="btn btn-primary">
                {t('save')}
            </button>
        </form>
    );

}

// =====================================================
// 13. MIGRATION CHECKLIST
// =====================================================

/\*\*

- To implement profile pictures for a service:
-
-   1. [ ] Run database migration (if not already done)
-   2. [ ] Add ServiceProfilePictureUpload to edit page
-   3. [ ] Update list view to show pictures
-   4. [ ] Update detail/preview view to show pictures
-   5. [ ] Add cleanup to delete function
-   6. [ ] Test upload, display, and deletion
-   7. [ ] Verify storage folder structure
-   8. [ ] Test with large files (should reject > 5MB)
-   9. [ ] Test with invalid file types (should reject)
-   10. [ ] Test drag & drop functionality
            \*/

// =====================================================
// END OF QUICK REFERENCE
// =====================================================
