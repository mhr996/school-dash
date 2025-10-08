'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase';
import CustomSelect from '@/components/elements/custom-select';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import { getTranslation } from '@/i18n';
import PageBreadcrumb from '@/components/layouts/page-breadcrumb';
import IconMail from '@/components/icon/icon-mail';
import IconEye from '@/components/icon/icon-eye';

interface EntertainmentCompanyForm {
    name: string;
    image: string;
    description: string;
    price: number;
    status: string;
    user_email: string;
    user_password: string;
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
        user_email: '',
        user_password: '',
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

    // User account creation state
    const [showPassword, setShowPassword] = useState(false);
    const [roles, setRoles] = useState<any[]>([]);

    const statusOptions = [
        { value: 'active', label: t('active') },
        { value: 'inactive', label: t('inactive') },
    ];

    // Fetch user roles on component mount
    useEffect(() => {
        async function fetchRoles() {
            try {
                const { data: rolesData, error } = await supabase.from('user_roles').select('*').order('id');

                if (error) {
                    console.error('Error fetching roles:', error);
                    return;
                }

                setRoles(rolesData || []);
            } catch (error) {
                console.error('Error fetching roles:', error);
            }
        }

        fetchRoles();
    }, []);

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

        // Validate user account fields
        if (!formData.user_email.trim()) {
            setAlert({ visible: true, message: t('email_required'), type: 'danger' });
            return;
        }

        if (!formData.user_password.trim() || formData.user_password.length < 6) {
            setAlert({ visible: true, message: t('password_min_6_chars'), type: 'danger' });
            return;
        }

        setIsLoading(true);

        try {
            // 1) Find the entertainment_company role
            const entertainmentCompanyRole = roles.find((role) => role.name === 'entertainment_company');
            if (!entertainmentCompanyRole) {
                throw new Error(t('role_not_found'));
            }

            // 2) Create user account
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.user_email.trim(),
                password: formData.user_password,
                options: {
                    data: {
                        full_name: formData.name.trim(), // Use entertainment company name as full name
                    },
                },
            });

            if (authError) throw authError;

            if (!authData.user) {
                throw new Error('Failed to create user account');
            }

            // 3) Create user profile with entertainment_company role and get the user ID
            const { data: userData, error: profileError } = await supabase
                .from('users')
                .insert([
                    {
                        full_name: formData.name.trim(), // Use entertainment company name as full name
                        email: formData.user_email.trim(),
                        role_id: entertainmentCompanyRole.id,
                        auth_user_id: authData.user.id,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    },
                ])
                .select()
                .single();

            if (profileError) throw profileError;

            if (!userData) {
                throw new Error('User profile creation failed - no user data returned');
            }

            // 4) Create entertainment company record and link to user
            const basePayload = {
                name: formData.name.trim(),
                description: formData.description.trim() || null,
                price: formData.price,
                status: formData.status,
                user_id: userData.id, // Link to public.users record
            };

            const { data: created, error: insertError } = await supabase.from('external_entertainment_companies').insert([basePayload]).select().single();

            if (insertError) throw insertError;

            const companyId = created.id as string;
            setCreatedCompanyId(companyId);

            // 5) Upload image if any, then update the record
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

                    {/* User Account Creation */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h3 className="text-lg font-semibold mb-4">{t('user_account_creation')}</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">{t('user_account_description')}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* User Email */}
                            <div className="space-y-2">
                                <label htmlFor="user_email" className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                    <IconMail className="w-5 h-5 text-primary" />
                                    {t('email')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="user_email"
                                    name="user_email"
                                    value={formData.user_email}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    placeholder={t('enter_email')}
                                    required
                                />
                            </div>

                            {/* User Password */}
                            <div className="space-y-2">
                                <label htmlFor="user_password" className="text-sm font-bold text-gray-700 dark:text-white">
                                    {t('password')} <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="user_password"
                                        name="user_password"
                                        value={formData.user_password}
                                        onChange={handleInputChange}
                                        className="form-input pr-12"
                                        placeholder={t('enter_password')}
                                        minLength={6}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                                    >
                                        {showPassword ? (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M2 2L22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <path
                                                    d="M6.71 6.71C4.33 8.26 2.67 10.94 2 12C2.67 13.06 4.33 15.74 6.71 17.29"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                                <path
                                                    d="M10.59 10.59C10.21 11.37 10.21 12.63 10.59 13.41C10.97 14.19 11.81 14.81 12.59 14.59"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                                <path
                                                    d="M17.29 17.29C19.67 15.74 21.33 13.06 22 12C21.33 10.94 19.67 8.26 17.29 6.71"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        ) : (
                                            <IconEye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-500">{t('password_min_6_chars')}</p>
                            </div>
                        </div>
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
