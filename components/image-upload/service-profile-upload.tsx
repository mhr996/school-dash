import React, { useRef, useState } from 'react';
import { uploadServiceProfilePicture, getServiceProfileUrl, ServiceType } from '@/utils/service-profile-upload';
import IconUpload from '@/components/icon/icon-camera';
import IconUser from '@/components/icon/icon-user';

interface ServiceProfileUploadProps {
    serviceType: ServiceType;
    serviceId?: string; // Optional for add page (will be created after save)
    currentUrl?: string | null;
    onUploadComplete: (url: string, path: string) => void;
    onError?: (error: string) => void;
    size?: 'sm' | 'md' | 'lg';
    showButton?: boolean;
    buttonLabel?: string;
    disabled?: boolean;
}

const ServiceProfileUpload: React.FC<ServiceProfileUploadProps> = ({
    serviceType,
    serviceId,
    currentUrl,
    onUploadComplete,
    onError,
    size = 'md',
    showButton = false,
    buttonLabel,
    disabled = false,
}) => {
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const sizeClasses = {
        sm: 'h-16 w-16',
        md: 'h-24 w-24 md:h-32 md:w-32',
        lg: 'h-32 w-32 md:h-40 md:w-40',
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop()?.toLowerCase();
            const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

            if (!fileExt || !allowedExtensions.includes(fileExt)) {
                throw new Error('Invalid file type. Please upload an image file (JPG, PNG, GIF, WEBP).');
            }

            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                throw new Error('File size must be less than 5MB.');
            }

            // If serviceId exists, upload immediately
            if (serviceId) {
                const result = await uploadServiceProfilePicture(file, serviceType, serviceId, currentUrl || undefined);

                if ('error' in result) {
                    throw new Error(result.error);
                }

                setPreviewUrl(result.url);
                onUploadComplete(result.url, result.path);
            } else {
                // For add page, just set preview and pass file to parent
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = reader.result as string;
                    setPreviewUrl(base64);
                    // Pass the file object through callback (parent will handle upload after service creation)
                    onUploadComplete(base64, file.name);
                };
                reader.readAsDataURL(file);
            }
        } catch (error) {
            console.error('Error handling file:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error uploading image';
            onError?.(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    const displayUrl = previewUrl || (currentUrl ? getServiceProfileUrl(currentUrl) : null);

    return (
        <div className="flex flex-col items-center gap-4">
            {!showButton ? (
                <div className="relative group cursor-pointer">
                    <div
                        className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-lg`}
                    >
                        {displayUrl ? <img src={displayUrl} alt="Profile" className="w-full h-full object-cover" /> : <IconUser className="w-1/2 h-1/2 text-gray-400" />}
                    </div>

                    {/* Overlay */}
                    <div
                        className={`absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-50 opacity-0 transition-opacity ${
                            disabled ? 'cursor-not-allowed' : 'group-hover:opacity-100 cursor-pointer'
                        }`}
                        onClick={() => !disabled && fileInputRef.current?.click()}
                    >
                        <IconUpload className="h-6 w-6 text-white" />
                    </div>

                    {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-50">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        </div>
                    )}
                </div>
            ) : (
                <button type="button" className="btn btn-outline-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading || disabled}>
                    {uploading ? (
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                            Uploading...
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <IconUpload className="w-4 h-4" />
                            {buttonLabel || 'Upload Profile Picture'}
                        </div>
                    )}
                </button>
            )}

            {/* Hidden file input */}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" disabled={uploading || disabled} />

            {displayUrl && !showButton && <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Click to change photo</p>}
        </div>
    );
};

export default ServiceProfileUpload;
