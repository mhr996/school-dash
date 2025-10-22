/**
 * Service Profile Picture Upload Component
 *
 * A reusable component for uploading and managing service profile pictures.
 * Features:
 * - Drag & drop support
 * - Image preview
 * - Progress indicator
 * - Validation feedback
 * - Remove/change picture options
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import IconUpload from '@/components/icon/icon-upload';
import IconX from '@/components/icon/icon-x';
import IconCamera from '@/components/icon/icon-camera';
import IconTrash from '@/components/icon/icon-trash';
import { uploadServiceProfilePicture, removeServiceProfilePicture, getServiceProfilePictureUrlWithFallback, validateProfilePicture, ServiceType } from '@/utils/service-profile-picture';

interface ServiceProfilePictureUploadProps {
    serviceType: ServiceType;
    serviceId: string;
    currentPicturePath?: string | null;
    onUploadSuccess?: (path: string, publicUrl: string) => void;
    onUploadError?: (error: string) => void;
    onRemoveSuccess?: () => void;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    editable?: boolean;
    label?: string;
}

export default function ServiceProfilePictureUpload({
    serviceType,
    serviceId,
    currentPicturePath,
    onUploadSuccess,
    onUploadError,
    onRemoveSuccess,
    className = '',
    size = 'md',
    editable = true,
    label,
}: ServiceProfilePictureUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Size configurations
    const sizeConfig = {
        sm: { container: 'w-24 h-24', icon: 'w-8 h-8', text: 'text-xs' },
        md: { container: 'w-40 h-40', icon: 'w-12 h-12', text: 'text-sm' },
        lg: { container: 'w-64 h-64', icon: 'w-16 h-16', text: 'text-base' },
    };

    const config = sizeConfig[size];

    // Get current display URL
    const displayUrl = previewUrl || getServiceProfilePictureUrlWithFallback(currentPicturePath, serviceType);

    // Handle file selection
    const handleFileSelect = useCallback(
        async (file: File) => {
            setError(null);

            // Validate file
            const validationError = validateProfilePicture(file);
            if (validationError) {
                setError(validationError);
                onUploadError?.(validationError);
                return;
            }

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewUrl(e.target?.result as string);
            };
            reader.readAsDataURL(file);

            // Upload
            setIsUploading(true);
            const result = await uploadServiceProfilePicture(serviceType, serviceId, file);
            setIsUploading(false);

            if (result.success && result.path && result.publicUrl) {
                onUploadSuccess?.(result.path, result.publicUrl);
                setPreviewUrl(null); // Clear preview, use actual uploaded image
            } else {
                setError(result.error || 'Upload failed');
                onUploadError?.(result.error || 'Upload failed');
                setPreviewUrl(null);
            }
        },
        [serviceType, serviceId, onUploadSuccess, onUploadError],
    );

    // Handle file input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    // Handle drag events
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    // Handle remove picture
    const handleRemove = async () => {
        if (!currentPicturePath) return;

        setIsUploading(true);
        const success = await removeServiceProfilePicture(serviceType, serviceId);
        setIsUploading(false);

        if (success) {
            onRemoveSuccess?.();
        } else {
            setError('Failed to remove picture');
        }
    };

    // Trigger file input click
    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className={`space-y-3 ${className}`}>
            {label && <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>}

            <div className="relative">
                {/* Main Upload Area */}
                <motion.div
                    className={`relative ${config.container} mx-auto rounded-2xl overflow-hidden group ${editable ? 'cursor-pointer' : ''}`}
                    onDragEnter={editable ? handleDragEnter : undefined}
                    onDragLeave={editable ? handleDragLeave : undefined}
                    onDragOver={editable ? handleDragOver : undefined}
                    onDrop={editable ? handleDrop : undefined}
                    onClick={editable ? triggerFileInput : undefined}
                    whileHover={editable ? { scale: 1.02 } : undefined}
                    whileTap={editable ? { scale: 0.98 } : undefined}
                >
                    {/* Background Image */}
                    <div className="absolute inset-0">
                        <img src={displayUrl} alt="Service profile" className="w-full h-full object-cover" />
                    </div>

                    {/* Overlay */}
                    {editable && (
                        <div className={`absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex items-center justify-center ${isDragging ? 'bg-blue-500/80' : ''}`}>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-center">
                                <IconCamera className={`${config.icon} mx-auto mb-2`} />
                                <p className={`${config.text} font-medium`}>{currentPicturePath ? 'Change Picture' : 'Upload Picture'}</p>
                            </div>
                        </div>
                    )}

                    {/* Upload Progress */}
                    {isUploading && (
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                            <div className="text-white text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-2"></div>
                                <p className={config.text}>Uploading...</p>
                            </div>
                        </div>
                    )}

                    {/* Drag Overlay */}
                    {isDragging && (
                        <div className="absolute inset-0 bg-blue-500/90 flex items-center justify-center border-4 border-white border-dashed rounded-2xl">
                            <div className="text-white text-center">
                                <IconUpload className={`${config.icon} mx-auto mb-2`} />
                                <p className={`${config.text} font-bold`}>Drop image here</p>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Remove Button */}
                {editable && currentPicturePath && !isUploading && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRemove();
                        }}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors z-10"
                        title="Remove picture"
                    >
                        <IconTrash className="w-4 h-4" />
                    </motion.button>
                )}

                {/* Hidden File Input */}
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif" onChange={handleInputChange} className="hidden" />
            </div>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Upload Instructions */}
            {editable && !currentPicturePath && (
                <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Click or drag & drop to upload</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">JPG, PNG, WEBP, GIF (max 5MB)</p>
                </div>
            )}
        </div>
    );
}
