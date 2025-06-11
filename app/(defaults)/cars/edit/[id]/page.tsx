'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import supabase from '@/lib/supabase';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import { getTranslation } from '@/i18n';
import IconX from '@/components/icon/icon-x';
import IconUpload from '@/components/icon/icon-camera';
import BrandSelect from '@/components/brand-select/brand-select';
import StatusSelect from '@/components/status-select/status-select';
import ProviderSelect from '@/components/provider-select/provider-select';
import TypeSelect from '@/components/type-select/type-select';

interface Car {
    id: string;
    title: string;
    year: number;
    brand: string;
    status: string;
    type?: string;
    provider: string;
    kilometers: number;
    market_price: number;
    value_price: number;
    sale_price: number;
    images: string[];
    providers?: {
        id: string;
        name: string;
        address: string;
        phone: string;
    };
}

const EditCar = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const params = useParams();
    const carId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [car, setCar] = useState<Car | null>(null);
    const [form, setForm] = useState({
        title: '',
        year: '',
        brand: '',
        status: '',
        type: '',
        provider: '',
        kilometers: '',
        market_price: '',
        value_price: '',
        sale_price: '',
    }); // Separate states for thumbnail and gallery images
    const [thumbnailImage, setThumbnailImage] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
    const [galleryImages, setGalleryImages] = useState<File[]>([]);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]); // Display URLs for existing images
    const [existingImagePaths, setExistingImagePaths] = useState<string[]>([]); // Original relative paths
    const thumbnailInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({
        visible: false,
        message: '',
        type: 'success',
    });
    useEffect(() => {
        const fetchCar = async () => {
            try {
                const { data, error } = await supabase.from('cars').select('*, providers(id, name, address, phone)').eq('id', carId).single();

                if (error) throw error;

                if (data) {
                    setCar(data);
                    setForm({
                        title: data.title || '',
                        year: data.year?.toString() || '',
                        brand: data.brand || '',
                        status: data.status || '',
                        type: data.type || '',
                        provider: data.providers?.id || data.provider || '',
                        kilometers: data.kilometers?.toString() || '',
                        market_price: data.market_price?.toString() || '',
                        value_price: data.value_price?.toString() || '',
                        sale_price: data.sale_price?.toString() || '',
                    });
                    // Convert relative paths to full URLs for display and keep original paths
                    if (data.images && data.images.length > 0) {
                        setExistingImagePaths(data.images); // Store original relative paths
                        const imageUrls = data.images.map((imagePath: string) => {
                            const { data: urlData } = supabase.storage.from('cars').getPublicUrl(imagePath);
                            return urlData.publicUrl;
                        });

                        // Set thumbnail (first image) and gallery (rest of images)
                        if (imageUrls.length > 0) {
                            setThumbnailPreview(imageUrls[0]);
                            if (imageUrls.length > 1) {
                                setGalleryPreviews(imageUrls.slice(1));
                            }
                        }
                        setExistingImages(imageUrls); // Store full URLs for display
                    }
                }
            } catch (error) {
                console.error('Error fetching car:', error);
                setAlert({ visible: true, message: t('error_loading_data'), type: 'danger' });
            } finally {
                setLoading(false);
            }
        };

        if (carId) {
            fetchCar();
        }
    }, [carId]);
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleThumbnailSelect = () => {
        thumbnailInputRef.current?.click();
    };

    const handleGallerySelect = () => {
        galleryInputRef.current?.click();
    };

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setThumbnailImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setThumbnailPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + galleryPreviews.length > 9) {
            setAlert({ visible: true, message: 'Maximum 9 gallery images allowed', type: 'danger' });
            return;
        }
        setGalleryImages((prev) => [...prev, ...files]);

        // Generate preview URLs
        files.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setGalleryPreviews((prev) => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeThumbnail = () => {
        setThumbnailImage(null);
        setThumbnailPreview('');
    };

    const removeGalleryImage = (index: number) => {
        setGalleryImages((prev) => prev.filter((_, i) => i !== index));
        setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (index: number) => {
        setExistingImages((prev) => prev.filter((_, i) => i !== index));
        setExistingImagePaths((prev) => prev.filter((_, i) => i !== index));
    };

    const validateForm = () => {
        if (!form.title.trim()) {
            setAlert({ visible: true, message: t('car_title_required'), type: 'danger' });
            return false;
        }
        if (!form.year.trim()) {
            setAlert({ visible: true, message: t('year_required'), type: 'danger' });
            return false;
        }
        if (!form.brand.trim()) {
            setAlert({ visible: true, message: t('brand_required'), type: 'danger' });
            return false;
        }
        if (!form.status.trim()) {
            setAlert({ visible: true, message: t('car_status_required'), type: 'danger' });
            return false;
        }
        if (form.kilometers && parseFloat(form.kilometers) < 0) {
            setAlert({ visible: true, message: t('kilometers_must_be_positive'), type: 'danger' });
            return false;
        }
        if (form.market_price && parseFloat(form.market_price) < 0) {
            setAlert({ visible: true, message: t('price_must_be_positive'), type: 'danger' });
            return false;
        }
        if (form.value_price && parseFloat(form.value_price) < 0) {
            setAlert({ visible: true, message: t('price_must_be_positive'), type: 'danger' });
            return false;
        }
        if (form.sale_price && parseFloat(form.sale_price) < 0) {
            setAlert({ visible: true, message: t('price_must_be_positive'), type: 'danger' });
            return false;
        }
        return true;
    };
    const uploadNewImages = async (carId: string) => {
        const imageUrls: string[] = [];

        // Upload new thumbnail if provided
        if (thumbnailImage) {
            const fileExt = thumbnailImage.name.split('.').pop();
            const fileName = `${carId}/thumbnail.${fileExt}`;

            const { data, error } = await supabase.storage.from('cars').upload(fileName, thumbnailImage);

            if (error) {
                console.error('Error uploading thumbnail:', error);
                throw error;
            }

            imageUrls.push(fileName);
        }

        // Upload new gallery images
        for (let i = 0; i < galleryImages.length; i++) {
            const file = galleryImages[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `${carId}/gallery_${Date.now()}_${i + 1}.${fileExt}`;

            const { data, error } = await supabase.storage.from('cars').upload(fileName, file);

            if (error) {
                console.error('Error uploading gallery image:', error);
                throw error;
            }

            imageUrls.push(fileName);
        }

        return imageUrls;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setSaving(true);
        try {
            // Upload new images if any
            const newImageUrls = await uploadNewImages(carId); // Combine existing image paths and new images
            const allImageUrls = [...existingImagePaths, ...newImageUrls]; // Prepare car data
            const carData = {
                title: form.title.trim(),
                year: parseInt(form.year),
                brand: form.brand.trim(),
                status: form.status,
                type: form.type || null,
                provider: form.provider || null,
                kilometers: form.kilometers ? parseFloat(form.kilometers) : 0,
                market_price: form.market_price ? parseFloat(form.market_price) : 0,
                value_price: form.value_price ? parseFloat(form.value_price) : 0,
                sale_price: form.sale_price ? parseFloat(form.sale_price) : 0,
                images: allImageUrls,
            };

            const { error } = await supabase.from('cars').update(carData).eq('id', carId);

            if (error) throw error;

            setAlert({ visible: true, message: t('car_updated_successfully'), type: 'success' });

            // Redirect to cars list after a short delay
            setTimeout(() => {
                router.push('/cars');
            }, 1500);
        } catch (error) {
            console.error(error);
            setAlert({
                visible: true,
                message: error instanceof Error ? error.message : t('error_updating_car'),
                type: 'danger',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-80">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
                <span className="ml-3">{t('loading')}</span>
            </div>
        );
    }

    if (!car) {
        return (
            <div className="flex flex-col items-center justify-center h-80">
                <p className="text-xl font-bold mb-2">{t('car_not_found')}</p>
                <button onClick={() => router.push('/cars')} className="btn btn-primary mt-4">
                    {t('back_to_cars')}
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center gap-5 mb-6">
                <div onClick={() => router.back()}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mb-4 cursor-pointer text-primary rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </div>
                {/* Breadcrumb Navigation */}
                <ul className="flex space-x-2 rtl:space-x-reverse mb-4">
                    <li>
                        <Link href="/" className="text-primary hover:underline">
                            {t('home')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <Link href="/cars" className="text-primary hover:underline">
                            {t('cars')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <span>{t('edit_car')}</span>
                    </li>
                </ul>
            </div>

            <div className="mb-6">
                <h1 className="text-2xl font-bold">{t('edit_car')}</h1>
                <p className="text-gray-500">{t('update_car_information')}</p>
            </div>

            {alert.visible && (
                <div className="mb-6">
                    <Alert
                        type={alert.type}
                        title={alert.type === 'success' ? t('success') : t('error')}
                        message={alert.message}
                        onClose={() => setAlert({ visible: false, message: '', type: 'success' })}
                    />
                </div>
            )}

            <div className="panel">
                <div className="mb-5">
                    <h5 className="text-lg font-semibold dark:text-white-light">{t('car_information')}</h5>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Car Title */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                                {t('car_title')} <span className="text-red-500">*</span>
                            </label>
                            <input type="text" id="title" name="title" value={form.title} onChange={handleInputChange} className="form-input" placeholder={t('enter_car_title')} required />
                        </div>
                        {/* Year */}
                        <div>
                            <label htmlFor="year" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                                {t('year')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                id="year"
                                name="year"
                                min="1900"
                                max={new Date().getFullYear() + 1}
                                value={form.year}
                                onChange={handleInputChange}
                                className="form-input"
                                placeholder={t('enter_year')}
                                required
                            />
                        </div>{' '}
                        {/* Brand */}
                        <div>
                            <label htmlFor="brand" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                                {t('brand')} <span className="text-red-500">*</span>
                            </label>{' '}
                            <BrandSelect defaultValue={form.brand} className="form-input" name="brand" onChange={handleInputChange} />
                        </div>
                        {/* Status */}
                        <div>
                            <label htmlFor="status" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                                {t('car_status')} <span className="text-red-500">*</span>
                            </label>
                            <StatusSelect defaultValue={form.status} className="form-input" name="status" onChange={handleInputChange} />
                        </div>{' '}
                        {/* Type */}
                        <div>
                            <label htmlFor="type" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                                {t('car_type')}
                            </label>
                            <TypeSelect defaultValue={form.type} className="form-input" name="type" onChange={handleInputChange} />
                        </div>
                        {/* Provider */}
                        <div>
                            <label htmlFor="provider" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                                {t('provider')}
                            </label>
                            <ProviderSelect defaultValue={form.provider} className="form-input" name="provider" onChange={handleInputChange} />
                        </div>
                        {/* Kilometers */}
                        <div>
                            <label htmlFor="kilometers" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                                {t('kilometers')}
                            </label>
                            <input
                                type="number"
                                id="kilometers"
                                name="kilometers"
                                min="0"
                                value={form.kilometers}
                                onChange={handleInputChange}
                                className="form-input"
                                placeholder={t('enter_kilometers')}
                            />
                        </div>{' '}
                        {/* Market Price */}
                        <div>
                            <label htmlFor="market_price" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                                {t('market_price')}
                            </label>
                            <div className="flex">
                                <span className="inline-flex items-center px-3 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border ltr:border-r-0 rtl:border-l-0 border-gray-300 dark:border-gray-600 ltr:rounded-l-md rtl:rounded-r-md">
                                    $
                                </span>
                                <input
                                    type="number"
                                    id="market_price"
                                    name="market_price"
                                    step="0.01"
                                    min="0"
                                    value={form.market_price}
                                    onChange={handleInputChange}
                                    className="form-input ltr:rounded-l-none rtl:rounded-r-none"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>{' '}
                        {/* Value Price */}
                        <div>
                            <label htmlFor="value_price" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                                {t('value_price')}
                            </label>
                            <div className="flex">
                                <span className="inline-flex items-center px-3 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border ltr:border-r-0 rtl:border-l-0 border-gray-300 dark:border-gray-600 ltr:rounded-l-md rtl:rounded-r-md">
                                    $
                                </span>
                                <input
                                    type="number"
                                    id="value_price"
                                    name="value_price"
                                    step="0.01"
                                    min="0"
                                    value={form.value_price}
                                    onChange={handleInputChange}
                                    className="form-input ltr:rounded-l-none rtl:rounded-r-none"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>{' '}
                        {/* Sale Price */}
                        <div>
                            <label htmlFor="sale_price" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                                {t('sale_price')}
                            </label>
                            <div className="flex">
                                <span className="inline-flex items-center px-3 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border ltr:border-r-0 rtl:border-l-0 border-gray-300 dark:border-gray-600 ltr:rounded-l-md rtl:rounded-r-md">
                                    $
                                </span>
                                <input
                                    type="number"
                                    id="sale_price"
                                    name="sale_price"
                                    step="0.01"
                                    min="0"
                                    value={form.sale_price}
                                    onChange={handleInputChange}
                                    className="form-input ltr:rounded-l-none rtl:rounded-r-none"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>{' '}
                    {/* Car Images */}
                    <div className="space-y-6">
                        <label className="block text-sm font-bold text-gray-700 dark:text-white mb-3">{t('car_images')}</label>

                        {/* Thumbnail Section */}
                        <div>
                            <h6 className="text-sm font-medium text-gray-700 dark:text-white mb-3">{t('thumbnail_image')}</h6>
                            <div className="flex items-center gap-4">
                                {/* Thumbnail Preview or Upload Button */}
                                {thumbnailPreview ? (
                                    <div className="relative group">
                                        <img src={thumbnailPreview} alt="Thumbnail preview" className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200" />
                                        <button
                                            type="button"
                                            onClick={removeThumbnail}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <IconX className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={handleThumbnailSelect}
                                        className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary hover:bg-gray-50 dark:border-gray-600 dark:hover:border-primary dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <IconUpload className="w-6 h-6 text-gray-400" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('upload_thumbnail')}</p>
                                    <p className="text-xs text-gray-500">{t('recommended_size')}: 400x300px</p>
                                    <button type="button" onClick={handleThumbnailSelect} className="btn btn-outline-primary btn-sm mt-2">
                                        {thumbnailPreview ? t('change_thumbnail') : t('select_thumbnail')}
                                    </button>
                                </div>
                            </div>
                            <input ref={thumbnailInputRef} type="file" accept="image/*" onChange={handleThumbnailChange} className="hidden" />
                        </div>

                        {/* Gallery Section */}
                        <div>
                            <h6 className="text-sm font-medium text-gray-700 dark:text-white mb-3">
                                {t('gallery_images')} <span className="text-xs text-gray-500">({t('optional')})</span>
                            </h6>

                            {/* Gallery Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
                                {/* Existing Gallery Images (excluding first image which is thumbnail) */}
                                {existingImages.slice(1).map((imageUrl, index) => (
                                    <div key={`existing-gallery-${index}`} className="relative group">
                                        <img src={imageUrl} alt={`Gallery image ${index + 1}`} className="w-full h-20 object-cover rounded-lg border" />
                                        <button
                                            type="button"
                                            onClick={() => removeExistingImage(index + 1)} // +1 because we're excluding thumbnail
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <IconX className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}

                                {/* New Gallery Images */}
                                {galleryPreviews.map((preview, index) => (
                                    <div key={`gallery-preview-${index}`} className="relative group">
                                        <img src={preview} alt={`Gallery preview ${index + 1}`} className="w-full h-20 object-cover rounded-lg border" />
                                        <button
                                            type="button"
                                            onClick={() => removeGalleryImage(index)}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <IconX className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}

                                {/* Add More Gallery Images Button */}
                                {existingImages.length - 1 + galleryPreviews.length < 9 && (
                                    <div
                                        onClick={handleGallerySelect}
                                        className="w-full h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary hover:bg-gray-50 dark:border-gray-600 dark:hover:border-primary dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <IconUpload className="w-5 h-5 text-gray-400" />
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between">
                                <button type="button" onClick={handleGallerySelect} className="btn btn-outline-secondary btn-sm">
                                    {t('add_gallery_images')}
                                </button>
                                <p className="text-xs text-gray-500">
                                    {existingImages.length - 1 + galleryPreviews.length}/9 {t('images')}
                                </p>
                            </div>

                            <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleGalleryChange} className="hidden" />
                            <p className="text-xs text-gray-500 mt-2">{t('gallery_description')}</p>
                        </div>
                    </div>
                    {/* Submit Button */}
                    <div className="flex justify-end gap-4 mt-8">
                        <button type="button" onClick={() => router.back()} className="btn btn-outline-danger">
                            {t('cancel')}
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? t('updating') : t('update_car')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditCar;
