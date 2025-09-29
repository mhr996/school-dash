'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUserWithRole } from '@/lib/auth';
import { getTranslation } from '@/i18n';
import AccountPendingPage from '@/components/auth/account-pending';
import supabase from '@/lib/supabase';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';

// Icons
import IconUser from '@/components/icon/icon-user';
import IconMail from '@/components/icon/icon-mail';
import IconPhone from '@/components/icon/icon-phone';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconSave from '@/components/icon/icon-save';
import IconDollarSign from '@/components/icon/icon-dollar-sign';
import IconCreditCard from '@/components/icon/icon-credit-card';
import IconOpenBook from '@/components/icon/icon-open-book';
import IconHeart from '@/components/icon/icon-heart';
import IconLock from '@/components/icon/icon-lock';
import IconCar from '@/components/icon/icon-car';
import IconStar from '@/components/icon/icon-star';

interface User {
    id: string;
    full_name: string;
    email: string;
    is_active: boolean;
    user_roles?: {
        name: string;
        description: string;
    };
}

interface ServiceProviderData {
    [key: string]: any;
}

interface FormErrors {
    [key: string]: string;
}

interface AccountData {
    email: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

const ServiceProviderProfile = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [serviceData, setServiceData] = useState<ServiceProviderData>({});
    const [originalData, setOriginalData] = useState<ServiceProviderData>({});
    const [accountData, setAccountData] = useState<AccountData>({
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({
        visible: false,
        message: '',
        type: 'success',
    });

    useEffect(() => {
        const initializeProfile = async () => {
            try {
                const { user: userData, error } = await getCurrentUserWithRole();

                if (error || !userData) {
                    router.push('/auth/signin');
                    return;
                }

                setUser(userData);
                setAccountData((prev) => ({
                    ...prev,
                    email: userData.email,
                }));

                // Check if user is active
                if (!userData.is_active) {
                    setIsLoading(false);
                    return;
                }

                // Fetch service provider data based on role
                await fetchServiceProviderData(userData);
            } catch (error) {
                console.error('Error initializing profile:', error);
                router.push('/auth/signin');
            } finally {
                setIsLoading(false);
            }
        };

        initializeProfile();
    }, [router]);

    const fetchServiceProviderData = async (userData: User) => {
        const roleName = userData.user_roles?.name;
        let tableName = '';

        switch (roleName) {
            case 'guide':
                tableName = 'guides';
                break;
            case 'paramedic':
                tableName = 'paramedics';
                break;
            case 'security_company':
                tableName = 'security_companies';
                break;
            case 'travel_company':
                tableName = 'travel_companies';
                break;
            case 'entertainment_company':
                tableName = 'external_entertainment_companies';
                break;
            default:
                return;
        }

        try {
            const { data, error } = await supabase.from(tableName).select('*').eq('user_id', userData.id).single();

            if (!error && data) {
                setServiceData(data);
                setOriginalData(data);
            }
        } catch (error) {
            console.error(`Error fetching ${tableName} data:`, error);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!serviceData.name?.trim()) {
            newErrors.name = t('name_required');
        }

        if (serviceData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(serviceData.email)) {
            newErrors.email = t('invalid_email');
        }

        if (serviceData.phone && !/^\+?[\d\s\-\(\)]+$/.test(serviceData.phone)) {
            newErrors.phone = t('invalid_phone_number');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSaving(true);

        try {
            const roleName = user?.user_roles?.name;
            let tableName = '';

            switch (roleName) {
                case 'guide':
                    tableName = 'guides';
                    break;
                case 'paramedic':
                    tableName = 'paramedics';
                    break;
                case 'security_company':
                    tableName = 'security_companies';
                    break;
                case 'travel_company':
                    tableName = 'travel_companies';
                    break;
                case 'entertainment_company':
                    tableName = 'external_entertainment_companies';
                    break;
                default:
                    throw new Error('Invalid role');
            }

            // Remove non-updatable fields
            const updateData = { ...serviceData };
            delete updateData.id;
            delete updateData.user_id;
            delete updateData.created_at;
            delete updateData.updated_at;

            const { error } = await supabase.from(tableName).update(updateData).eq('user_id', user?.id);

            if (error) throw error;

            setOriginalData({ ...serviceData });

            setAlert({
                visible: true,
                message: t('profile_updated_successfully'),
                type: 'success',
            });
        } catch (error) {
            console.error('Error updating profile:', error);

            setAlert({
                visible: true,
                message: t('error_updating_profile'),
                type: 'danger',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleEmailUpdate = async () => {
        setIsUpdatingEmail(true);

        try {
            // Validate email
            if (!accountData.email || !accountData.email.includes('@')) {
                throw new Error('Please enter a valid email address');
            }

            // Check if email is different from current
            if (accountData.email === user?.email) {
                throw new Error('New email must be different from current email');
            }

            // First, get current user to ensure we have the right auth user
            const {
                data: { user: authUser },
                error: getUserError,
            } = await supabase.auth.getUser();
            if (getUserError || !authUser) {
                throw new Error('Authentication error. Please sign in again.');
            }

            // For email updates, we need to handle this differently due to confirmation requirements
            // First update the users table directly, then handle auth separately
            const { error: dbError } = await supabase.from('users').update({ email: accountData.email }).eq('auth_user_id', authUser.id);

            if (dbError) throw dbError;

            // Try to update auth email with simplified approach
            const { data, error: authError } = await supabase.auth.updateUser({
                email: accountData.email,
            });

            if (authError) {
                // If auth update fails due to rate limit or confirmation requirement, still show success
                if (authError.message.includes('For security purposes') || authError.message.includes('rate limit') || authError.message.includes('Too Many Requests')) {
                    console.log('Auth rate limited, but profile updated:', authError.message);
                    setAlert({
                        visible: true,
                        message: 'Profile email updated successfully. Auth system rate limited - try again in 30 seconds for full sync.',
                        type: 'success',
                    });
                } else {
                    console.error('Auth update error:', authError);
                    setAlert({
                        visible: true,
                        message: 'Profile updated, but auth email update failed. Contact support if needed.',
                        type: 'danger',
                    });
                }
            } else {
                // Update local user state
                if (user) {
                    setUser((prev) => (prev ? { ...prev, email: accountData.email } : null));
                }

                setAlert({
                    visible: true,
                    message: t('email_updated_successfully'),
                    type: 'success',
                });
            }
        } catch (error: any) {
            console.error('Error updating email:', error);
            setAlert({
                visible: true,
                message: error.message || t('error_updating_email'),
                type: 'danger',
            });
        } finally {
            setIsUpdatingEmail(false);
        }
    };

    const handlePasswordUpdate = async () => {
        setIsUpdatingPassword(true);

        try {
            // Validate password
            if (!accountData.currentPassword) {
                throw new Error(t('current_password') + ' is required');
            }
            if (!accountData.newPassword || accountData.newPassword.length < 6) {
                throw new Error(t('min_password_length'));
            }
            if (accountData.newPassword !== accountData.confirmPassword) {
                throw new Error(t('password_mismatch'));
            }

            // Update password in Supabase auth
            const { error } = await supabase.auth.updateUser({
                password: accountData.newPassword,
            });

            if (error) {
                if (error.message.includes('Invalid login credentials')) {
                    throw new Error(t('invalid_current_password'));
                }
                throw error;
            }

            // Clear password fields
            setAccountData((prev) => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            }));

            setAlert({
                visible: true,
                message: t('password_updated_successfully'),
                type: 'success',
            });
        } catch (error: any) {
            console.error('Error updating password:', error);
            setAlert({
                visible: true,
                message: error.message || t('error_updating_password'),
                type: 'danger',
            });
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setServiceData((prev) => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const getServiceIcon = () => {
        const roleName = user?.user_roles?.name;
        switch (roleName) {
            case 'guide':
                return <IconOpenBook className="w-6 h-6" />;
            case 'paramedic':
                return <IconHeart className="w-6 h-6" />;
            case 'security_company':
                return <IconLock className="w-6 h-6" />;
            case 'travel_company':
                return <IconCar className="w-6 h-6" />;
            case 'entertainment_company':
                return <IconStar className="w-6 h-6" />;
            default:
                return <IconUser className="w-6 h-6" />;
        }
    };

    const getServiceTitle = () => {
        const roleName = user?.user_roles?.name;
        switch (roleName) {
            case 'guide':
                return t('guide_profile');
            case 'paramedic':
                return t('paramedic_profile');
            case 'security_company':
                return t('security_company_profile');
            case 'travel_company':
                return t('travel_company_profile');
            case 'entertainment_company':
                return t('entertainment_company_profile');
            default:
                return t('service_profile');
        }
    };

    const renderAccountSection = () => {
        return (
            <div className="panel mb-8">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <IconLock className="w-5 h-5" />
                        {t('account_information')}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{t('account_info_description')}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Email Update Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('update_email')}</h3>
                        <div>
                            <label htmlFor="current_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <IconMail className="w-4 h-4 inline mr-2" />
                                {t('current_email')}
                            </label>
                            <input id="current_email" type="email" className="form-input" value={user?.email || ''} disabled />
                        </div>
                        <div>
                            <label htmlFor="new_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <IconMail className="w-4 h-4 inline mr-2" />
                                {t('new_email')}
                            </label>
                            <input
                                id="new_email"
                                type="email"
                                className="form-input"
                                value={accountData.email}
                                onChange={(e) => setAccountData((prev) => ({ ...prev, email: e.target.value }))}
                                placeholder={t('new_email')}
                            />
                        </div>
                        <button type="button" onClick={handleEmailUpdate} disabled={isUpdatingEmail || accountData.email === user?.email} className="btn btn-primary">
                            {isUpdatingEmail ? t('saving') : t('update_email')}
                        </button>
                    </div>

                    {/* Password Update Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('change_password')}</h3>
                        <div>
                            <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <IconLock className="w-4 h-4 inline mr-2" />
                                {t('current_password')}
                            </label>
                            <input
                                id="current_password"
                                type="password"
                                className="form-input"
                                value={accountData.currentPassword}
                                onChange={(e) => setAccountData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                                placeholder={t('current_password')}
                            />
                        </div>
                        <div>
                            <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <IconLock className="w-4 h-4 inline mr-2" />
                                {t('new_password')}
                            </label>
                            <input
                                id="new_password"
                                type="password"
                                className="form-input"
                                value={accountData.newPassword}
                                onChange={(e) => setAccountData((prev) => ({ ...prev, newPassword: e.target.value }))}
                                placeholder={t('new_password')}
                            />
                        </div>
                        <div>
                            <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <IconLock className="w-4 h-4 inline mr-2" />
                                {t('confirm_new_password')}
                            </label>
                            <input
                                id="confirm_password"
                                type="password"
                                className="form-input"
                                value={accountData.confirmPassword}
                                onChange={(e) => setAccountData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                                placeholder={t('confirm_new_password')}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handlePasswordUpdate}
                            disabled={isUpdatingPassword || !accountData.currentPassword || !accountData.newPassword || !accountData.confirmPassword}
                            className="btn btn-primary"
                        >
                            {isUpdatingPassword ? t('saving') : 'Update Password'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderServiceSection = () => {
        const roleName = user?.user_roles?.name;

        return (
            <div className="panel">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <IconUser className="w-5 h-5" />
                        {t('service_information')}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{t('service_info_description')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Common Fields */}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <IconUser className="w-4 h-4 inline mr-2" />
                                {t('name')} <span className="text-red-500">*</span>
                            </label>
                            <input id="name" type="text" className="form-input" value={serviceData.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} />
                            {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
                        </div>

                        {roleName !== 'entertainment_company' && (
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <IconPhone className="w-4 h-4 inline mr-2" />
                                    {t('phone')}
                                </label>
                                <input id="phone" type="text" className="form-input" value={serviceData.phone || ''} onChange={(e) => handleInputChange('phone', e.target.value)} />
                                {errors.phone && <span className="text-red-500 text-sm">{errors.phone}</span>}
                            </div>
                        )}

                        {roleName !== 'entertainment_company' && (
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <IconMail className="w-4 h-4 inline mr-2" />
                                    {t('email')} ({t('contact')})
                                </label>
                                <input id="email" type="email" className="form-input" value={serviceData.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} />
                                {errors.email && <span className="text-red-500 text-sm">{errors.email}</span>}
                            </div>
                        )}

                        {/* Role-specific fields */}
                        {(roleName === 'guide' || roleName === 'paramedic') && (
                            <div>
                                <label htmlFor="identity_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <IconCreditCard className="w-4 h-4 inline mr-2" />
                                    {t('identity_number')}
                                </label>
                                <input
                                    id="identity_number"
                                    type="text"
                                    className="form-input"
                                    value={serviceData.identity_number || ''}
                                    onChange={(e) => handleInputChange('identity_number', e.target.value)}
                                />
                            </div>
                        )}

                        {roleName === 'security_company' && (
                            <div>
                                <label htmlFor="tax_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <IconCreditCard className="w-4 h-4 inline mr-2" />
                                    {t('tax_number')}
                                </label>
                                <input id="tax_number" type="text" className="form-input" value={serviceData.tax_number || ''} onChange={(e) => handleInputChange('tax_number', e.target.value)} />
                            </div>
                        )}

                        {roleName === 'travel_company' && (
                            <div>
                                <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <IconCreditCard className="w-4 h-4 inline mr-2" />
                                    {t('company_code')}
                                </label>
                                <input id="code" type="text" className="form-input" value={serviceData.code || ''} onChange={(e) => handleInputChange('code', e.target.value)} />
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        {/* Address field for companies */}
                        {(roleName === 'security_company' || roleName === 'travel_company') && (
                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <IconMapPin className="w-4 h-4 inline mr-2" />
                                    {t('address')}
                                </label>
                                <textarea id="address" className="form-textarea" rows={3} value={serviceData.address || ''} onChange={(e) => handleInputChange('address', e.target.value)} />
                            </div>
                        )}

                        {/* Rates for guides, paramedics, security companies */}
                        {(roleName === 'guide' || roleName === 'paramedic' || roleName === 'security_company') && (
                            <>
                                <div>
                                    <label htmlFor="hourly_rate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        <IconDollarSign className="w-4 h-4 inline mr-2" />
                                        {t('hourly_rate')}
                                    </label>
                                    <input
                                        id="hourly_rate"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="form-input"
                                        value={serviceData.hourly_rate || ''}
                                        onChange={(e) => handleInputChange('hourly_rate', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="daily_rate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        <IconDollarSign className="w-4 h-4 inline mr-2" />
                                        {t('daily_rate')}
                                    </label>
                                    <input
                                        id="daily_rate"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="form-input"
                                        value={serviceData.daily_rate || ''}
                                        onChange={(e) => handleInputChange('daily_rate', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            </>
                        )}

                        {/* Travel company specific fields */}
                        {roleName === 'travel_company' && (
                            <>
                                <div>
                                    <label htmlFor="services_offered" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t('services_offered')}
                                    </label>
                                    <textarea
                                        id="services_offered"
                                        className="form-textarea"
                                        rows={3}
                                        value={serviceData.services_offered || ''}
                                        onChange={(e) => handleInputChange('services_offered', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="vehicle_count" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t('vehicle_count')}
                                    </label>
                                    <input
                                        id="vehicle_count"
                                        type="number"
                                        min="0"
                                        className="form-input"
                                        value={serviceData.vehicle_count || ''}
                                        onChange={(e) => handleInputChange('vehicle_count', parseInt(e.target.value) || 0)}
                                    />
                                </div>
                            </>
                        )}

                        {/* Entertainment company description */}
                        {roleName === 'entertainment_company' && (
                            <>
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t('description')}
                                    </label>
                                    <textarea
                                        id="description"
                                        className="form-textarea"
                                        rows={4}
                                        value={serviceData.description || ''}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        <IconDollarSign className="w-4 h-4 inline mr-2" />
                                        {t('price')}
                                    </label>
                                    <input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="form-input"
                                        value={serviceData.price || ''}
                                        onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            </>
                        )}

                        {/* Security company specific fields */}
                        {roleName === 'security_company' && (
                            <>
                                <div>
                                    <label htmlFor="license_types" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t('license_types')}
                                    </label>
                                    <textarea
                                        id="license_types"
                                        className="form-textarea"
                                        rows={2}
                                        value={serviceData.license_types || ''}
                                        onChange={(e) => handleInputChange('license_types', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="weapon_types" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t('weapon_types')}
                                    </label>
                                    <textarea
                                        id="weapon_types"
                                        className="form-textarea"
                                        rows={2}
                                        value={serviceData.weapon_types || ''}
                                        onChange={(e) => handleInputChange('weapon_types', e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        {/* Notes field for all */}
                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('notes')}
                            </label>
                            <textarea id="notes" className="form-textarea" rows={3} value={serviceData.notes || ''} onChange={(e) => handleInputChange('notes', e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button type="button" onClick={handleSave} disabled={isSaving} className="btn btn-primary gap-2">
                        <IconSave className="w-4 h-4" />
                        {isSaving ? t('saving') : t('save_changes')}
                    </button>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Show pending approval page if account is inactive
    if (user && !user.is_active) {
        return <AccountPendingPage />;
    }

    return (
        <div className="space-y-8">
            {/* Alert */}
            {alert.visible && (
                <div className="fixed top-4 right-4 z-50 min-w-80 max-w-md">
                    <Alert type={alert.type} title={alert.type === 'success' ? 'Success' : 'Error'} message={alert.message} onClose={() => setAlert((prev) => ({ ...prev, visible: false }))} />
                </div>
            )}

            {/* Header */}
            <div className="panel border-white-light px-0 dark:border-[#1b2e4b]">
                <div className="px-6 py-7">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center text-white">{getServiceIcon()}</div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{getServiceTitle()}</h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                {t('profile_settings')} - {serviceData.name || user?.full_name}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Sections */}
            {renderAccountSection()}
            {renderServiceSection()}
        </div>
    );
};

export default ServiceProviderProfile;
