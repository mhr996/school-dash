import supabase from '@/lib/supabase';

export type SubServiceType = 'entertainment_company_services' | 'education_program_services';

interface UploadSubServiceIconParams {
    serviceType: SubServiceType;
    parentServiceId: string;
    subServiceId: string;
    file: File;
}

interface UploadSubServiceIconResult {
    success: boolean;
    path?: string;
    error?: string;
}

/**
 * Uploads a sub-service icon to the appropriate folder structure
 * @param serviceType - Type of service (entertainment_company_services or education_program_services)
 * @param parentServiceId - ID of the parent service
 * @param subServiceId - ID of the sub-service
 * @param file - The image file to upload
 * @returns Object with success status and path or error
 */
export async function uploadSubServiceIcon({
    serviceType,
    parentServiceId,
    subServiceId,
    file,
}: UploadSubServiceIconParams): Promise<UploadSubServiceIconResult> {
    try {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            return {
                success: false,
                error: 'Invalid file type. Please upload an image file (JPEG, PNG, GIF, WebP, or SVG).',
            };
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return {
                success: false,
                error: 'File size exceeds 5MB limit.',
            };
        }

        // Determine bucket and folder structure based on service type
        const bucket = serviceType === 'entertainment_company_services' ? 'entertainment-companies' : 'destinations-properties';

        // Get file extension
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';

        // Construct the path: [bucket]/[parent_id]/sub-services/[sub_service_id]/icon.[ext]
        const filePath = `${parentServiceId}/sub-services/${subServiceId}/icon.${fileExt}`;

        // Check if an icon already exists and delete it
        const { data: existingFiles } = await supabase.storage.from(bucket).list(`${parentServiceId}/sub-services/${subServiceId}`);

        if (existingFiles && existingFiles.length > 0) {
            // Delete existing icons
            const filesToDelete = existingFiles.map((f) => `${parentServiceId}/sub-services/${subServiceId}/${f.name}`);
            await supabase.storage.from(bucket).remove(filesToDelete);
        }

        // Upload the new icon
        const { data: uploadData, error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
        });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return {
                success: false,
                error: uploadError.message,
            };
        }

        // Get the public URL
        const {
            data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(filePath);

        // Update the database with the icon path (include bucket name for clarity)
        const table = serviceType === 'entertainment_company_services' ? 'entertainment_company_services' : 'education_program_services';
        const fullPath = `${bucket}/${filePath}`; // Include bucket name in path

        const { error: updateError } = await supabase.from(table).update({ icon_path: fullPath }).eq('id', subServiceId);

        if (updateError) {
            console.error('Database update error:', updateError);
            // Rollback: delete the uploaded file
            await supabase.storage.from(bucket).remove([filePath]);
            return {
                success: false,
                error: updateError.message,
            };
        }

        return {
            success: true,
            path: publicUrl,
        };
    } catch (error) {
        console.error('Error uploading sub-service icon:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
}

/**
 * Deletes a sub-service icon and its database reference
 * @param serviceType - Type of service
 * @param parentServiceId - ID of the parent service
 * @param subServiceId - ID of the sub-service
 * @returns Object with success status and error if any
 */
export async function deleteSubServiceIcon(serviceType: SubServiceType, parentServiceId: string, subServiceId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const bucket = serviceType === 'entertainment_company_services' ? 'entertainment-companies' : 'destinations-properties';

        // List all files in the sub-service folder
        const { data: files, error: listError } = await supabase.storage.from(bucket).list(`${parentServiceId}/sub-services/${subServiceId}`);

        if (listError) {
            console.error('List error:', listError);
            return {
                success: false,
                error: listError.message,
            };
        }

        if (files && files.length > 0) {
            // Delete all files in the folder
            const filesToDelete = files.map((f) => `${parentServiceId}/sub-services/${subServiceId}/${f.name}`);
            const { error: deleteError } = await supabase.storage.from(bucket).remove(filesToDelete);

            if (deleteError) {
                console.error('Delete error:', deleteError);
                return {
                    success: false,
                    error: deleteError.message,
                };
            }
        }

        // Update the database to remove the icon path
        const table = serviceType === 'entertainment_company_services' ? 'entertainment_company_services' : 'education_program_services';

        const { error: updateError } = await supabase.from(table).update({ icon_path: null }).eq('id', subServiceId);

        if (updateError) {
            console.error('Database update error:', updateError);
            return {
                success: false,
                error: updateError.message,
            };
        }

        return { success: true };
    } catch (error) {
        console.error('Error deleting sub-service icon:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
}

/**
 * Gets the public URL for a sub-service icon
 * @param serviceType - Type of service
 * @param iconPath - Path to the icon in storage
 * @returns Public URL or null
 */
export function getSubServiceIconUrl(serviceType: SubServiceType, iconPath: string | null): string | null {
    if (!iconPath) return null;

    // Check if the path already includes the bucket name
    const bucketForType = serviceType === 'entertainment_company_services' ? 'entertainment-companies' : 'destinations-properties';
    
    let bucket: string;
    let filePath: string;
    
    if (iconPath.startsWith('entertainment-companies/') || iconPath.startsWith('destinations-properties/')) {
        // New format: bucket is included in the path
        const pathParts = iconPath.split('/');
        bucket = pathParts[0];
        filePath = pathParts.slice(1).join('/');
    } else {
        // Old format: bucket is not included
        bucket = bucketForType;
        filePath = iconPath;
    }

    const {
        data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return publicUrl;
}

/**
 * Deletes all sub-service icons for a parent service (used when deleting parent service)
 * @param serviceType - Type of service
 * @param parentServiceId - ID of the parent service
 * @returns Object with success status and error if any
 */
export async function deleteAllSubServiceIcons(serviceType: SubServiceType, parentServiceId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const bucket = serviceType === 'entertainment_company_services' ? 'entertainment-companies' : 'destinations-properties';

        // List all sub-service folders
        const { data: subServiceFolders, error: listError } = await supabase.storage.from(bucket).list(`${parentServiceId}/sub-services`, {
            limit: 1000,
            offset: 0,
        });

        if (listError) {
            console.error('List error:', listError);
            return {
                success: false,
                error: listError.message,
            };
        }

        if (subServiceFolders && subServiceFolders.length > 0) {
            // For each sub-service folder, list and delete all files
            for (const folder of subServiceFolders) {
                const { data: files } = await supabase.storage.from(bucket).list(`${parentServiceId}/sub-services/${folder.name}`);
                
                if (files && files.length > 0) {
                    const filesToDelete = files.map((f) => `${parentServiceId}/sub-services/${folder.name}/${f.name}`);
                    await supabase.storage.from(bucket).remove(filesToDelete);
                }
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Error deleting all sub-service icons:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
}
