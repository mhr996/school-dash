/**
 * Service Profile Picture Management Utility
 * 
 * Provides a unified approach for managing profile pictures across all service types.
 * Storage structure: services/{service_type}/{service_id}/profile.{ext}
 * 
 * Features:
 * - Upload profile pictures with automatic path generation
 * - Delete old pictures when uploading new ones
 * - Automatic cleanup when deleting services
 * - Consistent naming and structure across all services
 * - Support for multiple image formats (jpg, png, webp, gif)
 */

import supabase from '@/lib/supabase';
import { getPublicUrlFromPath } from './file-upload';

// ==========================================
// TYPES & CONSTANTS
// ==========================================

export type ServiceType = 
    | 'guides'
    | 'paramedics'
    | 'security_companies'
    | 'external_entertainment_companies'
    | 'travel_companies'
    | 'education_programs';

export type ServiceTableName = 
    | 'guides'
    | 'paramedics'
    | 'security_companies'
    | 'external_entertainment_companies'
    | 'travel_companies'
    | 'education_programs';

const SERVICE_TYPE_FOLDER_MAP: Record<ServiceType, string> = {
    guides: 'guides',
    paramedics: 'paramedics',
    security_companies: 'security_companies',
    external_entertainment_companies: 'entertainment',
    travel_companies: 'travel_companies',
    education_programs: 'education_programs',
};

const STORAGE_BUCKET = 'services';
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ==========================================
// PATH GENERATION
// ==========================================

/**
 * Generate the storage path for a service profile picture
 * @param serviceType - Type of service (guides, paramedics, etc.)
 * @param serviceId - Unique ID of the service
 * @param fileName - Original file name (to extract extension)
 * @returns Storage path in format: services/{service_type}/{id}/profile.{ext}
 */
export function generateServiceProfilePath(
    serviceType: ServiceType,
    serviceId: string,
    fileName: string
): string {
    const extension = fileName.split('.').pop()?.toLowerCase() || 'png';
    const folder = SERVICE_TYPE_FOLDER_MAP[serviceType];
    return `${folder}/${serviceId}/profile.${extension}`;
}

/**
 * Get the folder path for a service (for deletion)
 * @param serviceType - Type of service
 * @param serviceId - Unique ID of the service
 * @returns Folder path: {service_type}/{id}
 */
export function getServiceFolderPath(serviceType: ServiceType, serviceId: string): string {
    const folder = SERVICE_TYPE_FOLDER_MAP[serviceType];
    return `${folder}/${serviceId}`;
}

// ==========================================
// VALIDATION
// ==========================================

/**
 * Validate uploaded image file
 * @param file - File to validate
 * @returns Error message if invalid, null if valid
 */
export function validateProfilePicture(file: File): string | null {
    if (!file) {
        return 'No file provided';
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`;
    }

    if (file.size > MAX_FILE_SIZE) {
        return `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`;
    }

    return null;
}

// ==========================================
// UPLOAD FUNCTIONS
// ==========================================

interface UploadResult {
    success: boolean;
    path?: string;
    publicUrl?: string;
    error?: string;
}

/**
 * Upload a profile picture for a service
 * Automatically handles:
 * - Old picture deletion
 * - Path generation
 * - Database update
 * 
 * @param serviceType - Type of service
 * @param serviceId - Unique ID of the service
 * @param file - Image file to upload
 * @returns Upload result with path and public URL
 */
export async function uploadServiceProfilePicture(
    serviceType: ServiceType,
    serviceId: string,
    file: File
): Promise<UploadResult> {
    try {
        // Validate file
        const validationError = validateProfilePicture(file);
        if (validationError) {
            return { success: false, error: validationError };
        }

        // Get current profile picture path to delete old one
        const { data: currentData } = await supabase
            .from(serviceType as ServiceTableName)
            .select('profile_picture_url')
            .eq('id', serviceId)
            .single();

        // Delete old profile picture if exists
        if (currentData?.profile_picture_url) {
            await deleteServiceProfilePicture(serviceType, serviceId, currentData.profile_picture_url);
        }

        // Generate new path
        const storagePath = generateServiceProfilePath(serviceType, serviceId, file.name);

        // Upload to storage
        const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(storagePath, file, {
                cacheControl: '3600',
                upsert: true,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return { success: false, error: uploadError.message };
        }

        // Update database
        const { error: updateError } = await supabase
            .from(serviceType as ServiceTableName)
            .update({ 
                profile_picture_url: storagePath,
                updated_at: new Date().toISOString()
            })
            .eq('id', serviceId);

        if (updateError) {
            console.error('Database update error:', updateError);
            // Rollback: delete uploaded file
            await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
            return { success: false, error: updateError.message };
        }

        // Get public URL
        const publicUrl = getPublicUrlFromPath(storagePath);

        return {
            success: true,
            path: storagePath,
            publicUrl,
        };
    } catch (error) {
        console.error('Unexpected error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
}

// ==========================================
// DELETE FUNCTIONS
// ==========================================

/**
 * Delete a specific profile picture file
 * @param serviceType - Type of service
 * @param serviceId - Unique ID of the service
 * @param picturePath - Path to the picture file
 * @returns True if successful, false otherwise
 */
export async function deleteServiceProfilePicture(
    serviceType: ServiceType,
    serviceId: string,
    picturePath: string
): Promise<boolean> {
    try {
        const { error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .remove([picturePath]);

        if (error) {
            console.error('Error deleting profile picture:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Unexpected error deleting profile picture:', error);
        return false;
    }
}

/**
 * Delete entire service folder (including profile picture)
 * Call this when deleting a service entirely
 * 
 * @param serviceType - Type of service
 * @param serviceId - Unique ID of the service
 * @returns True if successful, false otherwise
 */
export async function deleteServiceFolder(
    serviceType: ServiceType,
    serviceId: string
): Promise<boolean> {
    try {
        const folderPath = getServiceFolderPath(serviceType, serviceId);

        // List all files in the folder
        const { data: files, error: listError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .list(folderPath);

        if (listError) {
            console.error('Error listing files:', listError);
            return false;
        }

        if (!files || files.length === 0) {
            return true; // No files to delete
        }

        // Delete all files in the folder
        const filePaths = files.map(file => `${folderPath}/${file.name}`);
        const { error: deleteError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .remove(filePaths);

        if (deleteError) {
            console.error('Error deleting folder:', deleteError);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Unexpected error deleting service folder:', error);
        return false;
    }
}

/**
 * Remove profile picture from service (delete file and update database)
 * @param serviceType - Type of service
 * @param serviceId - Unique ID of the service
 * @returns True if successful, false otherwise
 */
export async function removeServiceProfilePicture(
    serviceType: ServiceType,
    serviceId: string
): Promise<boolean> {
    try {
        // Get current picture path
        const { data: currentData } = await supabase
            .from(serviceType as ServiceTableName)
            .select('profile_picture_url')
            .eq('id', serviceId)
            .single();

        if (!currentData?.profile_picture_url) {
            return true; // No picture to remove
        }

        // Delete from storage
        await deleteServiceProfilePicture(serviceType, serviceId, currentData.profile_picture_url);

        // Update database
        const { error: updateError } = await supabase
            .from(serviceType as ServiceTableName)
            .update({ 
                profile_picture_url: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', serviceId);

        if (updateError) {
            console.error('Database update error:', updateError);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Unexpected error removing profile picture:', error);
        return false;
    }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Get public URL for a service profile picture
 * @param profilePicturePath - Storage path of the picture
 * @returns Public URL or null if no path provided
 */
export function getServiceProfilePictureUrl(profilePicturePath: string | null | undefined): string | null {
    if (!profilePicturePath) return null;
    return getPublicUrlFromPath(profilePicturePath);
}

/**
 * Get fallback avatar URL for services without profile pictures
 * @param serviceType - Type of service
 * @returns Path to default avatar icon
 */
export function getServiceFallbackAvatar(serviceType: ServiceType): string {
    // Use generic placeholder for all service types in add/edit pages
    return '/assets/images/img-placeholder-fallback.webp';
}

/**
 * Get display URL with fallback
 * @param profilePicturePath - Storage path of the picture
 * @param serviceType - Type of service (for fallback)
 * @returns Public URL or fallback icon
 */
export function getServiceProfilePictureUrlWithFallback(
    profilePicturePath: string | null | undefined,
    serviceType: ServiceType
): string {
    if (profilePicturePath) {
        return getPublicUrlFromPath(profilePicturePath);
    }
    return getServiceFallbackAvatar(serviceType);
}

// ==========================================
// BATCH OPERATIONS (for migrations)
// ==========================================

/**
 * Update all services of a type with new profile picture paths
 * Useful for data migration
 */
export async function migrateServiceProfilePictures(
    serviceType: ServiceType,
    oldFieldName: string = 'image'
): Promise<{ success: number; failed: number }> {
    const result = { success: 0, failed: 0 };
    
    try {
        // This is a helper for manual migrations if needed
        console.log(`Migration helper for ${serviceType} - implement as needed`);
        // Implementation would depend on specific migration needs
    } catch (error) {
        console.error('Migration error:', error);
    }
    
    return result;
}

