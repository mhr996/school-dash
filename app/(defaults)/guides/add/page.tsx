'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import supabase from '@/lib/supabase';

// Components
import IconPlus from '@/components/icon/icon-plus';
import IconPhone from '@/components/icon/icon-phone';
import IconMail from '@/components/icon/icon-mail';
import IconCreditCard from '@/components/icon/icon-credit-card';
import IconEye from '@/components/icon/icon-eye';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import CustomSelect from '@/components/elements/custom-select';
import PageBreadcrumb from '@/components/layouts/page-breadcrumb';

import { getTranslation } from '@/i18n';

interface SelectOption {
    value: string;
    label: string;
}

interface GuideForm {
    name: string;
    identity_number: string;
    phone: string;
    email: string;
    hourly_rate: number;
    daily_rate: number;
    regional_rate: number;
    overnight_rate: number;
    status: string;
    notes: string;
    // User account fields
    user_email: string;
    user_password: string;
}

const AddGuide = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [roles, setRoles] = useState<any[]>([]);
    const [formData, setFormData] = useState<GuideForm>({
        name: '',
        identity_number: '',
        phone: '',
        email: '',
        hourly_rate: 0,
        daily_rate: 0,
        regional_rate: 0,
        overnight_rate: 0,
        status: 'active',
        notes: '',
        // User account fields
        user_email: '',
        user_password: '',
    });
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

    const statusOptions: SelectOption[] = [
        {
            value: 'active',
            label: t('active'),
        },
        {
            value: 'inactive',
            label: t('inactive'),
        },
    ];

    const supabaseClient = createClientComponentClient();

    // Fetch roles on component mount
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const { data: rolesData, error: rolesError } = await supabase.from('user_roles').select('*').order('name');
                if (rolesError) throw rolesError;
                setRoles(rolesData || []);
            } catch (error) {
                console.error('Error fetching roles:', error);
            }
        };
        fetchRoles();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);

            // Validate required fields
            if (!formData.name.trim()) {
                setAlert({ message: t('guide_name_required'), type: 'danger' });
                return;
            }

            if (!formData.identity_number.trim()) {
                setAlert({ message: t('identity_number_required'), type: 'danger' });
                return;
            }

            if (!formData.phone.trim()) {
                setAlert({ message: t('phone_required'), type: 'danger' });
                return;
            }

            // Validate user account fields
            if (!formData.user_email.trim()) {
                setAlert({ message: t('email_required'), type: 'danger' });
                return;
            }

            if (!formData.user_password || formData.user_password.length < 6) {
                setAlert({ message: t('password_required_min_6'), type: 'danger' });
                return;
            }

            // Find the guide role
            const guideRole = roles.find((role) => role.name === 'guide');
            if (!guideRole) {
                setAlert({ message: t('guide_role_not_found'), type: 'danger' });
                return;
            }

            // Create user account first
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.user_email,
                password: formData.user_password,
                options: {
                    data: {
                        full_name: formData.name, // Use guide name as full name
                    },
                },
            });

            if (authError) throw authError;

            if (!authData.user) {
                throw new Error('User creation failed - no user data returned');
            }

            // Create user profile in database
            const { error: profileError } = await supabase.from('users').insert({
                email: formData.user_email,
                full_name: formData.name, // Use guide name as full name
                phone: formData.phone,
                role_id: guideRole.id,
                is_active: formData.status === 'active',
                auth_user_id: authData.user.id,
            });

            if (profileError) throw profileError;

            // Prepare guide data (excluding user account fields)
            const { user_email, user_password, ...guideData } = formData;

            const { error } = await supabase.from('guides').insert([guideData]);

            if (error) {
                if (error.code === '23505') {
                    // Unique constraint violation
                    setAlert({ message: t('identity_number_already_exists'), type: 'danger' });
                    return;
                }
                throw error;
            }

            setAlert({ message: t('guide_added_successfully'), type: 'success' });

            // Redirect to guides list after a short delay
            setTimeout(() => {
                router.push('/guides');
            }, 500);
        } catch (error) {
            console.error('Error adding guide:', error);
            setAlert({
                message: error instanceof Error ? error.message : t('error_adding_guide'),
                type: 'danger',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            {/* Header */}
            <PageBreadcrumb section="guides" backUrl="/guides" items={[{ label: t('home'), href: '/' }, { label: t('guides'), href: '/guides' }, { label: t('add_guide') }]} />

            <div className="mb-6">
                <h1 className="text-3xl font-bold">{t('add_new_guide')}</h1>
                <p className="text-gray-500 mt-2">{t('add_guide_description')}</p>
            </div>

            {alert && (
                <div className="fixed top-4 right-4 z-50 min-w-80 max-w-md">
                    <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert(null)} />
                </div>
            )}

            {/* Form Container */}
            <div className="panel">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                        <h3 className="text-lg font-semibold mb-4">{t('basic_information')}</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Guide Name */}
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-bold text-gray-700 dark:text-white">
                                    {t('guide_name')} <span className="text-red-500">*</span>
                                </label>
                                <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className="form-input" placeholder={t('enter_guide_name')} required />
                            </div>

                            {/* ID Number */}
                            <div className="space-y-2">
                                <label htmlFor="identity_number" className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                    <IconCreditCard className="w-5 h-5 text-primary" />
                                    {t('identity_number')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="identity_number"
                                    name="identity_number"
                                    value={formData.identity_number}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    placeholder={t('enter_identity_number')}
                                    required
                                />
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <label htmlFor="status" className="block text-sm font-bold text-gray-700 dark:text-white">
                                    {t('status')}
                                </label>
                                <CustomSelect
                                    options={statusOptions}
                                    value={formData.status}
                                    onChange={(value: string | string[]) => setFormData({ ...formData, status: Array.isArray(value) ? value[0] : value })}
                                    placeholder={t('Select Status')}
                                    clearable={false}
                                    searchable={false}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                        <h3 className="text-lg font-semibold mb-4">{t('contact_information')}</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Phone */}
                            <div className="space-y-2">
                                <label htmlFor="phone" className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                    <IconPhone className="w-5 h-5 text-primary" />
                                    {t('phone')} <span className="text-red-500">*</span>
                                </label>
                                <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} className="form-input" placeholder={t('enter_phone')} required />
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                    <IconMail className="w-5 h-5 text-primary" />
                                    {t('email')}
                                </label>
                                <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} className="form-input" placeholder={t('enter_email')} />
                            </div>
                        </div>
                    </div>

                    {/* Pricing Information */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                        <h3 className="text-lg font-semibold mb-4">{t('pricing_information')}</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Hourly Rate */}
                            <div className="space-y-2">
                                <label htmlFor="hourly_rate" className="block text-sm font-bold text-gray-700 dark:text-white">
                                    {t('hourly_rate')}
                                </label>
                                <input
                                    type="number"
                                    id="hourly_rate"
                                    name="hourly_rate"
                                    value={formData.hourly_rate}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    min="0"
                                    step="0.01"
                                    placeholder="0"
                                />
                            </div>

                            {/* Daily Rate */}
                            <div className="space-y-2">
                                <label htmlFor="daily_rate" className="block text-sm font-bold text-gray-700 dark:text-white">
                                    {t('daily_rate')}
                                </label>
                                <input
                                    type="number"
                                    id="daily_rate"
                                    name="daily_rate"
                                    value={formData.daily_rate}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    min="0"
                                    step="0.01"
                                    placeholder="0"
                                />
                            </div>

                            {/* Regional Rate */}
                            <div className="space-y-2">
                                <label htmlFor="regional_rate" className="block text-sm font-bold text-gray-700 dark:text-white">
                                    {t('regional_rate')}
                                </label>
                                <input
                                    type="number"
                                    id="regional_rate"
                                    name="regional_rate"
                                    value={formData.regional_rate}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    min="0"
                                    step="0.01"
                                    placeholder="0"
                                />
                            </div>

                            {/* Overnight Rate */}
                            <div className="space-y-2">
                                <label htmlFor="overnight_rate" className="block text-sm font-bold text-gray-700 dark:text-white">
                                    {t('overnight_rate')}
                                </label>
                                <input
                                    type="number"
                                    id="overnight_rate"
                                    name="overnight_rate"
                                    value={formData.overnight_rate}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    min="0"
                                    step="0.01"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label htmlFor="notes" className="block text-sm font-bold text-gray-700 dark:text-white">
                            {t('notes')}
                        </label>
                        <textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} className="form-textarea" placeholder={t('enter_notes')} rows={4} />
                    </div>

                    {/* User Account Creation */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
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

                    {/* Submit Button */}
                    <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button type="submit" disabled={loading} className="btn btn-primary flex items-center gap-2 px-8 py-3">
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    {t('saving')}...
                                </>
                            ) : (
                                <>
                                    <IconPlus className="w-5 h-5" />
                                    {t('add_guide')}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddGuide;
