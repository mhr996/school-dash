import supabase from '@/lib/supabase';

export type ServiceType = 'guides' | 'paramedics';

/**
 * Upload a profile picture for a service provider (guide or paramedic)
 * Storage structure: services/{serviceType}/{serviceId}/{filename}
 */
export async function uploadServiceProfilePicture(
    file: File,
    serviceType: ServiceType,
    serviceId: string,
    existingUrl?: string
): Promise<{ url: string; path: string } | { error: string }> {
    try {
        // Delete old profile picture if it exists
        if (existingUrl) {
            await deleteServiceProfilePicture(serviceType, serviceId);
        }

        // Generate unique filename with timestamp
        const fileExt = file.name.split('.').pop();
        const fileName = `profile-${Date.now()}.${fileExt}`;
        const filePath = `${serviceType}/${serviceId}/${fileName}`;

        // Upload the new file
        const { error: uploadError } = await supabase.storage
            .from('services')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return { error: uploadError.message };
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('services')
            .getPublicUrl(filePath);

        return { url: publicUrl, path: filePath };
    } catch (error: any) {
        console.error('Error uploading service profile picture:', error);
        return { error: error.message || 'Failed to upload profile picture' };
    }
}

/**
 * Delete a service provider's profile picture
 */
export async function deleteServiceProfilePicture(
    serviceType: ServiceType,
    serviceId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // List all files in the service's folder
        const folderPath = `${serviceType}/${serviceId}`;
        const { data: files, error: listError } = await supabase.storage
            .from('services')
            .list(folderPath);

        if (listError) {
            console.error('Error listing files:', listError);
            return { success: false, error: listError.message };
        }

        if (!files || files.length === 0) {
            return { success: true }; // No files to delete
        }

        // Delete all files in the folder
        const filesToDelete = files.map(file => `${folderPath}/${file.name}`);
        const { error: deleteError } = await supabase.storage
            .from('services')
            .remove(filesToDelete);

        if (deleteError) {
            console.error('Error deleting files:', deleteError);
            return { success: false, error: deleteError.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error deleting service profile picture:', error);
        return { success: false, error: error.message || 'Failed to delete profile picture' };
    }
}

/**
 * Delete entire service folder when service is deleted
 */
export async function deleteServiceFolder(
    serviceType: ServiceType,
    serviceId: string
): Promise<{ success: boolean; error?: string }> {
    return await deleteServiceProfilePicture(serviceType, serviceId);
}

/**
 * Get public URL from storage path
 */
export function getServiceProfileUrl(path: string | null | undefined): string {
    if (!path) return '/assets/images/user-profile.png'; // Default avatar

    // If it's already a full URL, return it
    if (path.startsWith('http')) {
        return path;
    }

    // Get public URL from path
    const { data: { publicUrl } } = supabase.storage
        .from('services')
        .getPublicUrl(path);

    return publicUrl || '/assets/images/user-profile.png';
}
