'use client';
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import supabase from '@/lib/supabase';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import { getTranslation } from '@/i18n';
import IconX from '@/components/icon/icon-x';
import IconUpload from '@/components/icon/icon-camera';

const AddCar = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        title: '',
        year: '',
        brand: '',
        status: '',
        provider: '',
        kilometers: '',
        market_price: '',
        value_price: '',
        sale_price: '',
    });

    const [images, setImages] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({
        visible: false,
        message: '',
        type: 'success',
    });
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + previewUrls.length > 10) {
            setAlert({ visible: true, message: 'Maximum 10 images allowed', type: 'danger' });
            return;
        }
        setImages((prev) => [...prev, ...files]);

        // Generate preview URLs
        files.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrls((prev) => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
        setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
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
    const uploadImages = async (carTitle: string) => {
        if (images.length === 0) return [];

        const imageUrls: string[] = [];
        const folderName = carTitle.replace(/[^a-zA-Z0-9]/g, '_');

        for (let i = 0; i < images.length; i++) {
            const file = images[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `${folderName}/image_${i + 1}.${fileExt}`;

            const { data, error } = await supabase.storage.from('cars').upload(fileName, file);

            if (error) {
                console.error('Error uploading image:', error);
                throw error;
            }

            imageUrls.push(fileName); // Store the file path, not the public URL
        }

        return imageUrls;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setSaving(true);
        try {
            // Upload images first
            const imageUrls = await uploadImages(form.title);

            // Prepare car data
            const carData = {
                title: form.title.trim(),
                year: parseInt(form.year),
                brand: form.brand.trim(),
                status: form.status,
                provider: form.provider.trim() || null,
                kilometers: form.kilometers ? parseFloat(form.kilometers) : 0,
                market_price: form.market_price ? parseFloat(form.market_price) : 0,
                value_price: form.value_price ? parseFloat(form.value_price) : 0,
                sale_price: form.sale_price ? parseFloat(form.sale_price) : 0,
                images: imageUrls,
            };

            const { data, error } = await supabase.from('cars').insert([carData]).select();

            if (error) throw error;

            setAlert({ visible: true, message: t('car_added_successfully'), type: 'success' });

            // Redirect to cars list after a short delay
            setTimeout(() => {
                router.push('/cars');
            }, 1500);
        } catch (error) {
            console.error(error);
            setAlert({
                visible: true,
                message: error instanceof Error ? error.message : t('error_adding_car'),
                type: 'danger',
            });
        } finally {
            setSaving(false);
        }
    };

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
                        <span>{t('add_new_car')}</span>
                    </li>
                </ul>
            </div>

            <div className="mb-6">
                <h1 className="text-2xl font-bold">{t('add_new_car')}</h1>
                <p className="text-gray-500">{t('create_car_listing')}</p>
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
                        </div>

                        {/* Brand */}
                        <div>
                            <label htmlFor="brand" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                                {t('brand')} <span className="text-red-500">*</span>
                            </label>
                            <input type="text" id="brand" name="brand" value={form.brand} onChange={handleInputChange} className="form-input" placeholder={t('enter_brand')} required />
                        </div>

                        {/* Status */}
                        <div>
                            <label htmlFor="status" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                                {t('car_status')} <span className="text-red-500">*</span>
                            </label>
                            <select id="status" name="status" value={form.status} onChange={handleInputChange} className="form-select" required>
                                <option value="">{t('enter_car_status')}</option>
                                <option value="new">{t('new')}</option>
                                <option value="used">{t('used')}</option>
                                <option value="excellent">{t('excellent')}</option>
                                <option value="good">{t('good')}</option>
                                <option value="fair">{t('fair')}</option>
                                <option value="poor">{t('poor')}</option>
                            </select>
                        </div>

                        {/* Provider */}
                        <div>
                            <label htmlFor="provider" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                                {t('provider')}
                            </label>
                            <input type="text" id="provider" name="provider" value={form.provider} onChange={handleInputChange} className="form-input" placeholder={t('enter_provider')} />
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
                        </div>

                        {/* Market Price */}
                        <div>
                            <label htmlFor="market_price" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                                {t('market_price')}
                            </label>{' '}
                            <div className="flex">
                                <span className="inline-flex items-center px-3 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border border-r-0 border-gray-300 dark:border-gray-600 ltr:rounded-l-md rtl:rounded-r-md ltr:border-r-0 rtl:border-l-0">
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
                        </div>

                        {/* Value Price */}
                        <div>
                            <label htmlFor="value_price" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                                {t('value_price')}
                            </label>{' '}
                            <div className="flex">
                                <span className="inline-flex items-center px-3 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border border-r-0 border-gray-300 dark:border-gray-600 ltr:rounded-l-md rtl:rounded-r-md ltr:border-r-0 rtl:border-l-0">
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
                        </div>

                        {/* Sale Price */}
                        <div>
                            <label htmlFor="sale_price" className="block text-sm font-bold text-gray-700 dark:text-white mb-2">
                                {t('sale_price')}
                            </label>{' '}
                            <div className="flex">
                                <span className="inline-flex items-center px-3 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border border-r-0 border-gray-300 dark:border-gray-600 ltr:rounded-l-md rtl:rounded-r-md ltr:border-r-0 rtl:border-l-0">
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
                    <div>
                        <label className="mb-3 block text-sm font-bold text-gray-700 dark:text-white">{t('car_images')}</label>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {/* Add New Image Button */}
                            {previewUrls.length < 10 && (
                                <div
                                    onClick={handleFileSelect}
                                    className="flex h-36 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:border-primary hover:bg-gray-100 dark:border-[#1b2e4b] dark:bg-black dark:hover:border-primary dark:hover:bg-[#1b2e4b]"
                                >
                                    <IconUpload className="mb-2 h-6 w-6" />
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('click_to_upload')}</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-500">{t('image_formats')}</p>
                                </div>
                            )}

                            {/* Image Previews */}
                            {previewUrls.map((url, index) => (
                                <div key={index} className="group relative h-36">
                                    <img src={url} alt={`Preview ${index + 1}`} className="h-full w-full rounded-lg object-cover" />
                                    <button
                                        type="button"
                                        className="absolute right-0 top-0 hidden rounded-full bg-red-500 p-1 text-white hover:bg-red-600 group-hover:block"
                                        onClick={() => removeImage(index)}
                                    >
                                        <IconX className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" multiple onChange={handleFileChange} />
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('first_image_thumbnail')}</p>
                    </div>
                    {/* Submit Button */}
                    <div className="flex justify-end gap-4 mt-8">
                        <button type="button" onClick={() => router.back()} className="btn btn-outline-danger">
                            {t('cancel')}
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? t('creating') : t('create_car')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCar;
