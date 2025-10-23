'use client';

import Link from 'next/link';
import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import { getTranslation } from '@/i18n';
import PageBreadcrumb from '@/components/layouts/page-breadcrumb';
import IconMail from '@/components/icon/icon-mail';
import IconEye from '@/components/icon/icon-eye';
import IconPlus from '@/components/icon/icon-plus';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconSave from '@/components/icon/icon-save';
import IconStar from '@/components/icon/icon-star';
import { Tab } from '@headlessui/react';
import ImageUpload from '@/components/image-upload/image-upload';

interface EducationProgramForm {
    name: string;
    image: string;
    description: string;
    price: number;
    status: string;
    user_email: string;
    user_password: string;
}

export default function AddEducationProgram() {
    const { t } = getTranslation();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState<EducationProgramForm>({
        name: '',
        image: '',
        description: '',
        price: 0,
        status: 'active',
        user_email: '',
        user_password: '',
    });

    const [roles, setRoles] = useState<any[]>([]);

    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({
        visible: false,
        message: '',
        type: 'success',
    });

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'price' ? parseFloat(value) || 0 : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setAlert({ visible: true, message: t('program_name_required') || 'Program name is required', type: 'danger' });
            return;
        }

        if (!formData.user_email.trim()) {
            setAlert({ visible: true, message: t('email_required') || 'Email is required', type: 'danger' });
            return;
        }

        if (!formData.user_password.trim() || formData.user_password.length < 6) {
            setAlert({ visible: true, message: t('password_min_6_chars') || 'Password must be at least 6 characters', type: 'danger' });
            return;
        }

        setIsLoading(true);

        try {
            // 1) Find the education_program role (or create a generic service_provider role)
            let educationProgramRole = roles.find((role) => role.name === 'education_program');

            // If no specific role exists, try to use service_provider or entertainment_company role as fallback
            if (!educationProgramRole) {
                educationProgramRole = roles.find((role) => role.name === 'service_provider' || role.name === 'entertainment_company');
            }

            if (!educationProgramRole) {
                throw new Error(t('role_not_found') || 'Role not found');
            }

            // 2) Create user account
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.user_email.trim(),
                password: formData.user_password,
                options: {
                    data: {
                        full_name: formData.name.trim(),
                    },
                },
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Failed to create user account');

            // 3) Create user profile
            const { data: userData, error: profileError } = await supabase
                .from('users')
                .insert([
                    {
                        full_name: formData.name.trim(),
                        email: formData.user_email.trim(),
                        role_id: educationProgramRole.id,
                        auth_user_id: authData.user.id,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    },
                ])
                .select()
                .single();

            if (profileError) throw profileError;
            if (!userData) throw new Error('User profile creation failed');

            // 4) Create education program
            const { data: programData, error: insertError } = await supabase
                .from('education_programs')
                .insert([
                    {
                        name: formData.name.trim(),
                        description: formData.description.trim() || null,
                        price: formData.price,
                        status: formData.status,
                        image: formData.image || null,
                        user_id: userData.id,
                    },
                ])
                .select()
                .single();

            if (insertError) throw insertError;
            if (!programData) throw new Error('Program creation failed');

            setAlert({
                visible: true,
                message: t('education_program_added_successfully') || 'Education program added successfully',
                type: 'success',
            });

            // Redirect to edit page after success
            setTimeout(() => {
                router.push(`/education-programs/edit/${programData.id}`);
            }, 1500);
        } catch (error) {
            console.error('Error adding education program:', error);
            setAlert({
                visible: true,
                message: t('error_adding_education_program') || 'Error adding education program',
                type: 'danger',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <PageBreadcrumb
                section="education-programs"
                backUrl="/education-programs"
                items={[
                    { label: t('home') || 'Home', href: '/' },
                    { label: t('education_programs') || 'Education Programs', href: '/education-programs' },
                    { label: t('add_education_program') || 'Add Education Program' },
                ]}
            />

            <div className="mb-5">
                <h1 className="text-2xl font-bold">{t('add_education_program') || 'Add Education Program'}</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('add_education_program_description') || 'Create a new education program with services and pricing'}</p>
            </div>

            {alert.visible && (
                <div className="fixed top-20 ltr:right-4 rtl:left-4 z-50 min-w-80 max-w-md">
                    <Alert
                        type={alert.type}
                        title={alert.type === 'success' ? t('success') || 'Success' : t('error') || 'Error'}
                        message={alert.message}
                        onClose={() => setAlert({ ...alert, visible: false })}
                    />
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="panel p-0">
                    <Tab.Group>
                        <Tab.List className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 px-5 pt-5">
                            <Tab as={Fragment}>
                                {({ selected }) => (
                                    <button
                                        type="button"
                                        className={`px-5 py-3 font-semibold transition-all -mb-px ${
                                            selected ? 'border-b-2 border-primary text-primary' : 'text-gray-600 dark:text-gray-400 hover:text-primary'
                                        }`}
                                    >
                                        {t('basic_information') || 'Basic Information'}
                                    </button>
                                )}
                            </Tab>
                            <Tab as={Fragment}>
                                {({ selected }) => (
                                    <button
                                        type="button"
                                        className={`px-5 py-3 font-semibold transition-all -mb-px ${
                                            selected ? 'border-b-2 border-primary text-primary' : 'text-gray-600 dark:text-gray-400 hover:text-primary'
                                        }`}
                                    >
                                        {t('services_provided') || 'Services Provided'}
                                    </button>
                                )}
                            </Tab>
                        </Tab.List>

                        <Tab.Panels>
                            {/* Basic Information Tab */}
                            <Tab.Panel>
                                <div className="p-5">
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label htmlFor="name" className="block text-sm font-medium mb-2">
                                                    {t('program_name') || 'Program Name'} <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    id="name"
                                                    name="name"
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    placeholder={t('enter_program_name') || 'Enter program name'}
                                                    className="form-input"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="price" className="block text-sm font-medium mb-2">
                                                    {t('base_price') || 'Base Price'} (₪)
                                                </label>
                                                <input
                                                    id="price"
                                                    name="price"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={formData.price}
                                                    onChange={handleInputChange}
                                                    placeholder="0.00"
                                                    className="form-input"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="description" className="block text-sm font-medium mb-2">
                                                {t('description') || 'Description'}
                                            </label>
                                            <textarea
                                                id="description"
                                                name="description"
                                                rows={4}
                                                value={formData.description}
                                                onChange={handleInputChange}
                                                placeholder={t('enter_description') || 'Enter description'}
                                                className="form-textarea"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label htmlFor="image" className="block text-sm font-medium mb-2">
                                                    {t('image') || 'Image'}
                                                </label>
                                                <ImageUpload
                                                    bucket="education-programs"
                                                    userId="temp"
                                                    url={formData.image || null}
                                                    onUploadComplete={(url) => setFormData((prev) => ({ ...prev, image: url }))}
                                                    onError={(error) => setAlert({ visible: true, message: error, type: 'danger' })}
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="status" className="block text-sm font-medium mb-2">
                                                    {t('status') || 'Status'}
                                                </label>
                                                <select id="status" name="status" value={formData.status} onChange={handleInputChange} className="form-select">
                                                    <option value="active">{t('active') || 'Active'}</option>
                                                    <option value="inactive">{t('inactive') || 'Inactive'}</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-5 mt-5">
                                            <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
                                                <IconMail className="w-5 h-5 text-primary" />
                                                {t('user_account_details') || 'User Account Details'}
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div>
                                                    <label htmlFor="user_email" className="block text-sm font-medium mb-2">
                                                        {t('email') || 'Email'} <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        id="user_email"
                                                        name="user_email"
                                                        type="email"
                                                        value={formData.user_email}
                                                        onChange={handleInputChange}
                                                        placeholder={t('enter_email') || 'Enter email'}
                                                        className="form-input"
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label htmlFor="user_password" className="block text-sm font-medium mb-2">
                                                        {t('password') || 'Password'} <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            id="user_password"
                                                            name="user_password"
                                                            type={showPassword ? 'text' : 'password'}
                                                            value={formData.user_password}
                                                            onChange={handleInputChange}
                                                            placeholder={t('enter_password') || 'Enter password'}
                                                            className="form-input"
                                                            required
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 text-gray-400 hover:text-gray-600"
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
                                                                        d="M9.88 9.88C9.33 10.43 9 11.17 9 12C9 13.66 10.34 15 12 15C12.83 15 13.57 14.67 14.12 14.12"
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
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Tab.Panel>

                            {/* Services Tab */}
                            <Tab.Panel>
                                <div className="p-5">
                                    <div className="flex items-center justify-center py-16">
                                        <div className="text-center max-w-md">
                                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-info/10 flex items-center justify-center">
                                                <IconStar className="w-10 h-10 text-info" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                                {t('services_available_after_creation') || 'Sub-Services Available After Creation'}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                                {t('services_available_after_creation_desc') ||
                                                    'You will be able to add sub-services and their icons after creating the education program. Click "Save" below to create the program first.'}
                                            </p>
                                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-info/10 text-info rounded-lg text-sm">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>{t('redirected_after_save') || 'You will be redirected to the edit page after saving'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Tab.Panel>
                        </Tab.Panels>
                    </Tab.Group>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3">
                    <Link href="/education-programs" className="btn btn-outline-danger">
                        {t('cancel') || 'Cancel'}
                    </Link>
                    <button type="submit" disabled={isLoading} className="btn btn-primary gap-2">
                        <IconSave className="w-5 h-5" />
                        {isLoading ? t('saving') || 'Saving...' : t('save_education_program') || 'Save Education Program'}
                    </button>
                </div>
            </form>
        </div>
    );
}
