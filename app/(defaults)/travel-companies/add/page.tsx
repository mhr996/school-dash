'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import IconBuilding from '@/components/icon/icon-building';
import IconPlus from '@/components/icon/icon-plus';
import IconUser from '@/components/icon/icon-user';
import IconCar from '@/components/icon/icon-car';
import IconMail from '@/components/icon/icon-mail';
import IconEye from '@/components/icon/icon-eye';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getTranslation } from '@/i18n';
import Link from 'next/link';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import CustomSelect, { SelectOption } from '@/components/elements/custom-select';
import PageBreadcrumb from '@/components/layouts/page-breadcrumb';

interface FormData {
    name: string;
    code: string;
    services_offered: string;
    vehicle_count: number;
    vehicle_availability: string;
    accounting_methods: string;
    address: string;
    email: string;
    phone: string;
    status: string;
    notes: string;
    user_email: string;
    user_password: string;
}

interface PricingData {
    [vehicleType: string]: {
        [zoneName: string]: number;
    };
}

const AddTravelCompany = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const supabase = createClientComponentClient();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

    const [formData, setFormData] = useState<FormData>({
        name: '',
        code: '',
        services_offered: '',
        vehicle_count: 0,
        vehicle_availability: 'available',
        accounting_methods: '',
        address: '',
        email: '',
        phone: '',
        status: 'active',
        notes: '',
        user_email: '',
        user_password: '',
    });

    const [pricingData, setPricingData] = useState<PricingData>({});

    // User account creation state
    const [showPassword, setShowPassword] = useState(false);
    const [roles, setRoles] = useState<any[]>([]);

    const vehicleAvailabilityOptions: SelectOption[] = [
        { value: 'available', label: t('available') },
        { value: 'busy', label: t('busy') },
        { value: 'maintenance', label: t('maintenance') },
    ];

    const statusOptions: SelectOption[] = [
        { value: 'active', label: t('active') },
        { value: 'inactive', label: t('inactive') },
    ];

    const vehicleTypes = ['خاصة', 'فان', 'باص 40', 'باص 50', 'مينيبوس 18', 'مينيبوس 24'];
    type Zone = { id: string; name: string; is_active: boolean };
    const [zones, setZones] = useState<Zone[]>([]);
    const [zonesLoading, setZonesLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const { data, error } = await supabase.from('zones').select('id, name, is_active').eq('is_active', true).order('name', { ascending: true });
                if (error) throw error;
                setZones((data || []) as Zone[]);
            } catch (e) {
                console.error('Error fetching zones', e);
            } finally {
                setZonesLoading(false);
            }
        })();
    }, []);

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

    const handleInputChange = (name: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handlePricingChange = (vehicleType: string, zoneName: string, price: string) => {
        const numericPrice = parseFloat(price) || 0;
        setPricingData((prev) => ({
            ...prev,
            [vehicleType]: {
                ...prev[vehicleType],
                [zoneName]: numericPrice,
            },
        }));
    };

    const validateBasicInfo = () => {
        if (!formData.name.trim()) {
            setAlert({ message: t('travel_company_name_required'), type: 'danger' });
            return false;
        }
        if (!formData.code.trim()) {
            setAlert({ message: t('travel_company_code_required'), type: 'danger' });
            return false;
        }
        if (!formData.address.trim()) {
            setAlert({ message: t('travel_company_address_required'), type: 'danger' });
            return false;
        }
        if (!formData.email.trim()) {
            setAlert({ message: t('travel_company_email_required'), type: 'danger' });
            return false;
        }
        if (!formData.phone.trim()) {
            setAlert({ message: t('travel_company_phone_required'), type: 'danger' });
            return false;
        }
        return true;
    };

    const validateUserInfo = () => {
        if (!formData.user_email.trim()) {
            setAlert({ message: t('email_required'), type: 'danger' });
            return false;
        }
        if (!formData.user_password.trim() || formData.user_password.length < 6) {
            setAlert({ message: t('password_min_6_chars'), type: 'danger' });
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateBasicInfo()) {
            setActiveTab(0); // Switch to basic info tab if validation fails
            return;
        }

        if (!validateUserInfo()) {
            setActiveTab(2); // Switch to user account tab if validation fails
            return;
        }

        try {
            setLoading(true);
            setAlert(null);

            // 1) Find the travel_company role
            const travelCompanyRole = roles.find((role) => role.name === 'travel_company');
            if (!travelCompanyRole) {
                throw new Error(t('role_not_found'));
            }

            // 2) Create user account
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.user_email.trim(),
                password: formData.user_password,
                options: {
                    data: {
                        full_name: formData.name.trim(), // Use travel company name as full name
                    },
                },
            });

            if (authError) throw authError;

            if (!authData.user) {
                throw new Error('Failed to create user account');
            }

            // 3) Create user profile with travel_company role
            const { error: profileError } = await supabase.from('users').insert([
                {
                    id: authData.user.id,
                    full_name: formData.name.trim(), // Use travel company name as full name
                    email: formData.user_email.trim(),
                    role_id: travelCompanyRole.id,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
            ]);

            if (profileError) throw profileError;

            // 4) Create travel company record
            const companyData = {
                name: formData.name,
                code: formData.code,
                services_offered: formData.services_offered,
                vehicle_count: formData.vehicle_count,
                vehicle_availability: formData.vehicle_availability,
                accounting_methods: formData.accounting_methods,
                address: formData.address,
                email: formData.email,
                phone: formData.phone,
                status: formData.status,
                notes: formData.notes,
                pricing_data: pricingData,
                user_id: authData.user.id,
            };

            const { data, error } = await supabase.from('travel_companies').insert([companyData]).select().single();

            if (error) {
                if (error.code === '23505') {
                    setAlert({
                        message: t('travel_company_code_exists'),
                        type: 'danger',
                    });
                    return;
                }
                throw error;
            }

            setAlert({
                message: t('travel_company_created_successfully'),
                type: 'success',
            });

            // Navigate to the new travel company's details page
            setTimeout(() => {
                router.push(`/travel-companies/preview/${data.id}`);
            }, 1500);
        } catch (error) {
            console.error('Error creating travel company:', error);
            setAlert({
                message: t('error_creating_travel_company'),
                type: 'danger',
            });
        } finally {
            setLoading(false);
        }
    };

    const tabsData = [
        {
            id: 'basic-info',
            title: t('basic_information_tab'),
        },
        {
            id: 'pricing',
            title: t('pricing_tab'),
        },
        {
            id: 'user-account',
            title: t('user_account_creation'),
        },
    ];

    const renderTabContent = () => {
        if (activeTab === 0) {
            return (
                <div className="space-y-6">
                    {/* Company Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('travel_company_name')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className="form-input"
                                placeholder={t('enter_travel_company_name')}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('travel_company_code')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="code"
                                name="code"
                                value={formData.code}
                                onChange={(e) => handleInputChange('code', e.target.value)}
                                className="form-input"
                                placeholder={t('enter_travel_company_code')}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('travel_company_email')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className="form-input"
                                placeholder={t('enter_travel_company_email')}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('travel_company_phone')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                className="form-input"
                                placeholder={t('enter_travel_company_phone')}
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('travel_company_address')} <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                className="form-textarea"
                                rows={3}
                                placeholder={t('enter_travel_company_address')}
                                required
                            />
                        </div>
                    </div>

                    {/* Vehicle Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="vehicle_count" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('vehicle_count')}
                            </label>
                            <input
                                type="number"
                                id="vehicle_count"
                                name="vehicle_count"
                                value={formData.vehicle_count}
                                onChange={(e) => handleInputChange('vehicle_count', parseInt(e.target.value) || 0)}
                                className="form-input"
                                placeholder={t('enter_vehicle_count')}
                                min="0"
                            />
                        </div>

                        <div>
                            <label htmlFor="vehicle_availability" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('vehicle_availability')}
                            </label>
                            <CustomSelect
                                options={vehicleAvailabilityOptions}
                                value={formData.vehicle_availability}
                                onChange={(value) => handleInputChange('vehicle_availability', value)}
                                placeholder={t('select_availability')}
                            />
                        </div>
                    </div>

                    {/* Business Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="services_offered" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('services_offered')}
                            </label>
                            <textarea
                                id="services_offered"
                                name="services_offered"
                                value={formData.services_offered}
                                onChange={(e) => handleInputChange('services_offered', e.target.value)}
                                className="form-textarea"
                                rows={3}
                                placeholder={t('enter_services_offered')}
                            />
                        </div>

                        <div>
                            <label htmlFor="accounting_methods" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('accounting_methods')}
                            </label>
                            <textarea
                                id="accounting_methods"
                                name="accounting_methods"
                                value={formData.accounting_methods}
                                onChange={(e) => handleInputChange('accounting_methods', e.target.value)}
                                className="form-textarea"
                                rows={3}
                                placeholder={t('enter_accounting_methods')}
                            />
                        </div>

                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('status')}
                            </label>
                            <CustomSelect options={statusOptions} value={formData.status} onChange={(value) => handleInputChange('status', value)} placeholder={t('select_status')} />
                        </div>

                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('notes')}
                            </label>
                            <textarea
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={(e) => handleInputChange('notes', e.target.value)}
                                className="form-textarea"
                                rows={3}
                                placeholder={t('enter_notes')}
                            />
                        </div>
                    </div>
                </div>
            );
        }

        if (activeTab === 1) {
            return (
                <div className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">{t('pricing_matrix')}</h3>
                        <p className="text-sm text-blue-600 dark:text-blue-300">{t('pricing_matrix_description')}</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="table-auto w-full border-collapse border border-gray-300 dark:border-gray-600">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-gray-700">
                                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-medium min-w-[140px]">{t('zones')}</th>
                                    {vehicleTypes.map((vehicleType) => (
                                        <th key={vehicleType} className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center font-semibold min-w-[110px] text-sm">
                                            {vehicleType === 'خاصة'
                                                ? t('vehicle_type_private')
                                                : vehicleType === 'فان'
                                                  ? t('vehicle_type_van')
                                                  : vehicleType === 'باص 40'
                                                    ? t('vehicle_type_bus_40')
                                                    : vehicleType === 'باص 50'
                                                      ? t('vehicle_type_bus_50')
                                                      : vehicleType === 'مينيبוس 18'
                                                        ? t('vehicle_type_minibus_18')
                                                        : vehicleType === 'مينيبوس 24'
                                                          ? t('vehicle_type_minibus_24')
                                                          : vehicleType}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {zonesLoading && (
                                    <tr>
                                        <td colSpan={1 + vehicleTypes.length} className="text-center py-4">
                                            {t('loading')}
                                        </td>
                                    </tr>
                                )}
                                {!zonesLoading && zones.length === 0 && (
                                    <tr>
                                        <td colSpan={1 + vehicleTypes.length} className="text-center py-4">
                                            {t('no_zones_found')}
                                        </td>
                                    </tr>
                                )}
                                {zones.map((zone) => (
                                    <tr key={zone.id}>
                                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-semibold text-right bg-gray-50 dark:bg-gray-800">{zone.name}</td>
                                        {vehicleTypes.map((vehicleType) => (
                                            <td key={vehicleType} className="border border-gray-300 dark:border-gray-600 p-1 hover:bg-primary/30 dark:hover:bg-primary/60">
                                                <input
                                                    type="number"
                                                    className="w-full px-2 py-1 text-center border-0 bg-transparent focus:ring-1 focus:ring-primary rounded text-sm"
                                                    placeholder="0"
                                                    value={pricingData[vehicleType]?.[zone.name] ?? ''}
                                                    onChange={(e) => handlePricingChange(vehicleType, zone.name, e.target.value)}
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }

        if (activeTab === 2) {
            return (
                <div className="space-y-6">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">{t('user_account_creation')}</h3>
                        <p className="text-sm text-green-600 dark:text-green-300">{t('user_account_description')}</p>
                    </div>

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
                                onChange={(e) => handleInputChange('user_email', e.target.value)}
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
                                    onChange={(e) => handleInputChange('user_password', e.target.value)}
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
            );
        }

        return null;
    };

    return (
        <div className="container mx-auto p-6">
            <PageBreadcrumb
                section="travel-companies"
                backUrl="/travel-companies"
                items={[{ label: t('home'), href: '/' }, { label: t('travel_companies'), href: '/travel-companies' }, { label: t('add_travel_company') }]}
            />

            {alert && (
                <div className="mb-4">
                    <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="panel">
                    {/* Tab Navigation */}
                    <div className="flex border-b border-gray-200 dark:border-gray-600 mb-6">
                        {tabsData.map((tab, index) => (
                            <button
                                key={tab.id}
                                type="button"
                                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === index
                                        ? 'border-primary text-primary bg-primary/10'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                                onClick={() => setActiveTab(index)}
                            >
                                {tab.title}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="min-h-[400px]">{renderTabContent()}</div>
                </div>

                <div className="flex gap-4 justify-end">
                    <Link href="/travel-companies" className="btn btn-outline-secondary">
                        {t('cancel')}
                    </Link>
                    <button type="submit" className="btn btn-primary gap-2" disabled={loading}>
                        {loading ? <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-5 h-5"></span> : <IconPlus />}
                        {loading ? t('creating') + '...' : t('create_travel_company')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddTravelCompany;
