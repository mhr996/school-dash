'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase';
import CustomSelect from '@/components/elements/custom-select';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import { getTranslation } from '@/i18n';
import PageBreadcrumb from '@/components/layouts/page-breadcrumb';

interface EntertainmentCompanyForm {
    name: string;
    image: string;
    description: string;
    price: number;
    status: string;
}

export default function AddEntertainmentCompany() {
    const { t } = getTranslation();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<EntertainmentCompanyForm>({
        name: '',
        image: '',
        description: '',
        price: 0,
        status: 'active',
    });

    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({
        visible: false,
        message: '',
        type: 'success',
    });

    // Store the image file to upload after database creation
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    // Store the created company ID for image upload
    const [createdCompanyId, setCreatedCompanyId] = useState<string | null>(null);

    const statusOptions = [
        { value: 'active', label: t('active') },
        { value: 'inactive', label: t('inactive') },
    ];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'price' ? parseFloat(value) || 0 : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setAlert({ visible: true, message: t('entertainment_company_name_required'), type: 'danger' });
            return;
        }

        setIsLoading(true);

        try {
            // 1) Create base record to get ID
            const basePayload = {
                name: formData.name.trim(),
                description: formData.description.trim() || null,
                price: formData.price,
                status: formData.status,
            };

            const { data: created, error: insertError } = await supabase.from('external_entertainment_companies').insert([basePayload]).select().single();

            if (insertError) throw insertError;

            const companyId = created.id as string;
            setCreatedCompanyId(companyId);

            // 2) Upload image if any, then update the record
            let imagePath: string | null = null;

            if (imageFile) {
                const ext = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
                const path = `${companyId}/avatar_${Date.now()}.${ext}`;

                const { error: uploadError } = await supabase.storage.from('entertainment-companies').upload(path, imageFile, {
                    cacheControl: '3600',
                    upsert: true,
                });

                if (uploadError) throw uploadError;

                // Get the public URL from Supabase storage
                const {
                    data: { publicUrl },
                } = supabase.storage.from('entertainment-companies').getPublicUrl(path);

                imagePath = publicUrl;

                // Update the record with the image path
                const { error: updateError } = await supabase.from('external_entertainment_companies').update({ image: imagePath }).eq('id', companyId);

                if (updateError) throw updateError;
            }

            setAlert({ visible: true, message: t('entertainment_company_added_successfully'), type: 'success' });

            // Redirect after a brief delay
            setTimeout(() => {
                router.push('/external-entertainment-companies');
            }, 1500);
        } catch (error) {
            console.error('Error adding entertainment company:', error);
            setAlert({ visible: true, message: t('error_adding_entertainment_company'), type: 'danger' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            {/* Header */}
            <PageBreadcrumb
                section="external-entertainment-companies"
                backUrl="/external-entertainment-companies"
                items={[{ label: t('home'), href: '/' }, { label: t('external_entertainment_companies'), href: '/external-entertainment-companies' }, { label: t('add_entertainment_company') }]}
            />

            {/* Title */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold">{t('add_entertainment_company')}</h1>
                <p className="text-gray-500 mt-2">{t('add_entertainment_company_description')}</p>
            </div>

            {/* Alerts */}
            {alert.visible && (
                <div className="fixed top-4 right-4 z-50 min-w-80 max-w-md">
                    <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert({ ...alert, visible: false })} />
                </div>
            )}

            <div className="panel">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                {t('name')} *
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder={t('enter_entertainment_company_name')}
                                className="form-input"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                {t('image')}
                            </label>

                            <div className="mb-1 flex gap-4 w-full">
                                {/* File Input */}
                                <div className="relative w-[250px]">
                                    <input
                                        type="file"
                                        id="image"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setImageFile(file);

                                                // Create preview
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setImagePreview(reader.result as string);
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        className="sr-only"
                                    />
                                    <label
                                        htmlFor="image"
                                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-800"
                                    >
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                                <path
                                                    stroke="currentColor"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                                                />
                                            </svg>
                                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                                <span className="font-semibold">{t('click_to_upload')}</span>
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF up to 10MB</p>
                                        </div>
                                    </label>
                                </div>

                                {/* Image Preview */}
                                {imagePreview && (
                                    <div className="mb-4">
                                        <div className="relative inline-block">
                                            <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg border border-gray-300 shadow-sm" />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImageFile(null);
                                                    setImagePreview(null);
                                                    // Reset the file input
                                                    const input = document.getElementById('image') as HTMLInputElement;
                                                    if (input) input.value = '';
                                                }}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {imageFile && (
                                <div className="mt-2">
                                    <p className="text-sm text-green-600">
                                        ✓ {t('selected_file')}: {imageFile.name}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                {t('price')} *
                            </label>
                            <input
                                id="price"
                                name="price"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.price}
                                onChange={handleInputChange}
                                placeholder={t('enter_price')}
                                className="form-input"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                {t('status')}
                            </label>
                            <CustomSelect
                                options={statusOptions}
                                value={formData.status}
                                onChange={(value: any) => setFormData((prev) => ({ ...prev, status: value as string }))}
                                placeholder={t('select_status')}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                            {t('description')}
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={4}
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder={t('enter_description')}
                            className="form-textarea"
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <Link href="/external-entertainment-companies" className="btn btn-outline-danger">
                            {t('cancel')}
                        </Link>
                        <button type="submit" disabled={isLoading} className="btn btn-primary">
                            {isLoading ? t('saving') : t('save_entertainment_company')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
