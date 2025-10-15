'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import supabase from '@/lib/supabase';

// Components
import IconPlus from '@/components/icon/icon-plus';
import IconLock from '@/components/icon/icon-lock';
import IconPhone from '@/components/icon/icon-phone';
import IconMail from '@/components/icon/icon-mail';
import IconBuilding from '@/components/icon/icon-building';
import IconCreditCard from '@/components/icon/icon-credit-card';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconEye from '@/components/icon/icon-eye';
import IconUser from '@/components/icon/icon-user';
import IconInfoCircle from '@/components/icon/icon-info-circle';
import PageBreadcrumb from '@/components/layouts/page-breadcrumb';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import CustomSelect from '@/components/elements/custom-select';
import { getTranslation } from '@/i18n';

interface SelectOption {
    value: string;
    label: string;
}

interface SecurityCompanyForm {
    name: string;
    tax_number: string;
    phone: string;
    email: string;
    address: string;
    license_types: string;
    weapon_types: string;
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

const AddSecurityCompany = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [roles, setRoles] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState(0);
    const [formData, setFormData] = useState<SecurityCompanyForm>({
        name: '',
        tax_number: '',
        phone: '',
        email: '',
        address: '',
        license_types: '',
        weapon_types: '',
        hourly_rate: 50,
        daily_rate: 400,
        regional_rate: 600,
        overnight_rate: 500,
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
                setAlert({ message: t('security_company_name_required'), type: 'danger' });
                return;
            }

            if (!formData.tax_number.trim()) {
                setAlert({ message: t('security_tax_number_required'), type: 'danger' });
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

            // Find the security company role
            const securityRole = roles.find((role) => role.name === 'security_company');
            if (!securityRole) {
                setAlert({ message: t('security_company_role_not_found'), type: 'danger' });
                return;
            }

            // Create user account first
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.user_email,
                password: formData.user_password,
                options: {
                    data: {
                        full_name: formData.name, // Use company name as full name
                    },
                },
            });

            if (authError) throw authError;

            if (!authData.user) {
                throw new Error('User creation failed - no user data returned');
            }

            // Create user profile in database and get the user ID
            const { data: userData, error: profileError } = await supabase
                .from('users')
                .insert({
                    email: formData.user_email,
                    full_name: formData.name, // Use company name as full name
                    phone: formData.phone,
                    role_id: securityRole.id,
                    is_active: formData.status === 'active',
                    auth_user_id: authData.user.id,
                })
                .select()
                .single();

            if (profileError) throw profileError;

            if (!userData) {
                throw new Error('User profile creation failed - no user data returned');
            }

            // Prepare security company data (excluding user account fields) and link to user
            const { user_email, user_password, ...securityCompanyData } = formData;

            const { error } = await supabase.from('security_companies').insert([
                {
                    ...securityCompanyData,
                    user_id: userData.id, // Link to public.users record
                },
            ]);

            if (error) {
                throw error;
            }

            setAlert({ message: t('security_company_added_successfully'), type: 'success' });

            // Redirect to security companies list after a short delay
            setTimeout(() => {
                router.push('/security-companies');
            }, 500);
        } catch (error: any) {
            console.error('Error adding security company:', error);
            setAlert({ message: error.message || t('error_adding_security_company'), type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            {/* Header */}
            <PageBreadcrumb
                section="security-companies"
                backUrl="/security-companies"
                items={[{ label: t('home'), href: '/' }, { label: t('security_companies'), href: '/security-companies' }, { label: t('add_security_company') }]}
            />

            <div className="mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <IconLock className="w-8 h-8 text-primary" />
                    {t('add_new_security_company')}
                </h1>
            </div>

            {alert && (
                <div className="fixed top-4 right-4 z-50 min-w-80 max-w-md">
                    <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert(null)} />
                </div>
            )}

            {/* Form Container */}
            <div className="panel">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Tab Navigation */}
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="flex gap-4 overflow-x-auto">
                            <button
                                type="button"
                                onClick={() => setActiveTab(0)}
                                className={`px-4 py-3 font-semibold transition-colors border-b-2 whitespace-nowrap ${
                                    activeTab === 0 ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <IconInfoCircle className="w-5 h-5" />
                                    {t('basic_information')}
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab(1)}
                                className={`px-4 py-3 font-semibold transition-colors border-b-2 whitespace-nowrap ${
                                    activeTab === 1 ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <IconPhone className="w-5 h-5" />
                                    {t('contact_information')}
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab(2)}
                                className={`px-4 py-3 font-semibold transition-colors border-b-2 whitespace-nowrap ${
                                    activeTab === 2 ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <IconLock className="w-5 h-5" />
                                    {t('security_pricing')}
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab(3)}
                                className={`px-4 py-3 font-semibold transition-colors border-b-2 whitespace-nowrap ${
                                    activeTab === 3 ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <IconUser className="w-5 h-5" />
                                    {t('user_account_creation')}
                                </div>
                            </button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="py-6">
                        {/* Tab 0: Basic Information */}
                        {activeTab === 0 && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Company Name */}
                                    <div className="space-y-2">
                                        <label htmlFor="name" className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                            <IconBuilding className="w-5 h-5 text-primary" />
                                            {t('security_company_name')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="form-input"
                                            placeholder={t('enter_security_company_name')}
                                            required
                                        />
                                    </div>

                                    {/* Tax Number */}
                                    <div className="space-y-2">
                                        <label htmlFor="tax_number" className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                            <IconCreditCard className="w-5 h-5 text-primary" />
                                            {t('security_tax_number')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="tax_number"
                                            name="tax_number"
                                            value={formData.tax_number}
                                            onChange={handleInputChange}
                                            className="form-input"
                                            placeholder={t('enter_security_tax_number')}
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
                                            placeholder={t('select_status')}
                                            clearable={false}
                                            searchable={false}
                                        />
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="space-y-2">
                                    <label htmlFor="notes" className="block text-sm font-bold text-gray-700 dark:text-white">
                                        {t('notes')}
                                    </label>
                                    <textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} className="form-textarea" placeholder={t('enter_notes')} rows={4} />
                                </div>
                            </div>
                        )}

                        {/* Tab 1: Contact Information */}
                        {activeTab === 1 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Phone */}
                                <div className="space-y-2">
                                    <label htmlFor="phone" className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                        <IconPhone className="w-5 h-5 text-primary" />
                                        {t('phone')}
                                    </label>
                                    <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} className="form-input" placeholder={t('enter_phone_number')} />
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                        <IconMail className="w-5 h-5 text-primary" />
                                        {t('email')}
                                    </label>
                                    <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} className="form-input" placeholder={t('enter_email')} />
                                </div>

                                {/* Address */}
                                <div className="space-y-2 md:col-span-2">
                                    <label htmlFor="address" className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                        <IconMapPin className="w-5 h-5 text-primary" />
                                        {t('address')}
                                    </label>
                                    <input type="text" id="address" name="address" value={formData.address} onChange={handleInputChange} className="form-input" placeholder={t('enter_address')} />
                                </div>
                            </div>
                        )}

                        {/* Tab 2: Security & Pricing */}
                        {activeTab === 2 && (
                            <div className="space-y-6">
                                {/* Security Information */}
                                <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                                    <h3 className="text-lg font-semibold mb-4">{t('security_information')}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* License Types */}
                                        <div className="space-y-2">
                                            <label htmlFor="license_types" className="block text-sm font-bold text-gray-700 dark:text-white">
                                                {t('license_types')}
                                            </label>
                                            <input
                                                type="text"
                                                id="license_types"
                                                name="license_types"
                                                value={formData.license_types}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                placeholder={t('enter_license_types')}
                                            />
                                        </div>

                                        {/* Weapon Types */}
                                        <div className="space-y-2">
                                            <label htmlFor="weapon_types" className="block text-sm font-bold text-gray-700 dark:text-white">
                                                {t('weapon_types')}
                                            </label>
                                            <input
                                                type="text"
                                                id="weapon_types"
                                                name="weapon_types"
                                                value={formData.weapon_types}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                placeholder={t('enter_weapon_types')}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing Information */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">{t('pricing_information')}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Hourly Rate */}
                                        <div className="space-y-2">
                                            <label htmlFor="hourly_rate" className="block text-sm font-bold text-gray-700 dark:text-white">
                                                {t('hourly_rate')} (₪)
                                            </label>
                                            <input
                                                type="number"
                                                id="hourly_rate"
                                                name="hourly_rate"
                                                value={formData.hourly_rate}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                placeholder={t('enter_hourly_rate')}
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>

                                        {/* Daily Rate */}
                                        <div className="space-y-2">
                                            <label htmlFor="daily_rate" className="block text-sm font-bold text-gray-700 dark:text-white">
                                                {t('daily_rate')} (₪)
                                            </label>
                                            <input
                                                type="number"
                                                id="daily_rate"
                                                name="daily_rate"
                                                value={formData.daily_rate}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                placeholder={t('enter_daily_rate')}
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>

                                        {/* Regional Rate */}
                                        <div className="space-y-2">
                                            <label htmlFor="regional_rate" className="block text-sm font-bold text-gray-700 dark:text-white">
                                                {t('regional_rate')} (₪)
                                            </label>
                                            <input
                                                type="number"
                                                id="regional_rate"
                                                name="regional_rate"
                                                value={formData.regional_rate}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                placeholder={t('enter_regional_rate')}
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>

                                        {/* Overnight Rate */}
                                        <div className="space-y-2">
                                            <label htmlFor="overnight_rate" className="block text-sm font-bold text-gray-700 dark:text-white">
                                                {t('overnight_rate')} (₪)
                                            </label>
                                            <input
                                                type="number"
                                                id="overnight_rate"
                                                name="overnight_rate"
                                                value={formData.overnight_rate}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                placeholder={t('enter_overnight_rate')}
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 3: User Account Creation */}
                        {activeTab === 3 && (
                            <div className="space-y-4">
                                <p className="text-gray-600 dark:text-gray-400">{t('user_account_description')}</p>
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
                        )}
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
                                    {t('add_security_company')}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddSecurityCompany;
