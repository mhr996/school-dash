'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import IconBuilding from '@/components/icon/icon-building';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconUser from '@/components/icon/icon-user';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconPhone from '@/components/icon/icon-phone';
import IconMail from '@/components/icon/icon-mail';
import IconCar from '@/components/icon/icon-car';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getTranslation } from '@/i18n';
import Link from 'next/link';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import CustomSelect, { SelectOption } from '@/components/elements/custom-select';
import ServiceProfilePictureUpload from '@/components/services/ServiceProfilePictureUpload';

interface PricingData {
    [vehicleType: string]: {
        [zoneName: string]: number;
    };
}
import IconSave from '@/components/icon/icon-save';

interface TravelCompanyForm {
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
}

const EditTravelCompany = ({ params }: { params: { id: string } }) => {
    const { t } = getTranslation();
    const router = useRouter();
    const supabase = createClientComponentClient();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [activeTab, setActiveTab] = useState(0);
    const [profilePicturePath, setProfilePicturePath] = useState<string | null>(null);
    const [formData, setFormData] = useState<TravelCompanyForm>({
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
    });
    const [pricingData, setPricingData] = useState<PricingData>({});
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

    const availabilityOptions: SelectOption[] = [
        {
            value: 'available',
            label: t('available'),
        },
        {
            value: 'busy',
            label: t('busy'),
        },
        {
            value: 'maintenance',
            label: t('maintenance'),
        },
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

    // Fetch travel company data
    useEffect(() => {
        const fetchTravelCompany = async () => {
            try {
                setFetching(true);
                const { data, error } = await supabase.from('travel_companies').select('*').eq('id', params.id).single();

                if (error) {
                    if (error.code === 'PGRST116') {
                        // Not found
                        setAlert({
                            message: t('travel_company_not_found'),
                            type: 'danger',
                        });
                        return;
                    }
                    throw error;
                }

                setFormData({
                    name: data.name || '',
                    code: data.code || '',
                    services_offered: data.services_offered || '',
                    vehicle_count: data.vehicle_count || 0,
                    vehicle_availability: data.vehicle_availability || 'available',
                    accounting_methods: data.accounting_methods || '',
                    address: data.address || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    status: data.status || 'active',
                    notes: data.notes || '',
                });

                setProfilePicturePath(data.profile_picture_path || null);

                // Set pricing data
                if (data.pricing_data) {
                    setPricingData(data.pricing_data);
                }
            } catch (error) {
                console.error('Error fetching travel company:', error);
                setAlert({
                    message: t('error_loading_travel_company'),
                    type: 'danger',
                });
            } finally {
                setFetching(false);
            }
        };

        if (params.id) {
            fetchTravelCompany();
        }
    }, [params.id]);

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAlert(null);

        // Basic validation
        if (!formData.name.trim()) {
            setAlert({
                message: t('travel_company_name_required'),
                type: 'danger',
            });
            return;
        }

        if (!formData.code.trim()) {
            setAlert({
                message: t('travel_company_code_required'),
                type: 'danger',
            });
            return;
        }

        if (!formData.phone.trim()) {
            setAlert({
                message: t('travel_company_phone_required'),
                type: 'danger',
            });
            return;
        }

        if (!formData.email.trim()) {
            setAlert({
                message: t('travel_company_email_required'),
                type: 'danger',
            });
            return;
        }

        if (!formData.address.trim()) {
            setAlert({
                message: t('travel_company_address_required'),
                type: 'danger',
            });
            return;
        }

        try {
            setLoading(true);

            // Check if code already exists (excluding current record)
            const { data: existingCompany } = await supabase.from('travel_companies').select('id').eq('code', formData.code.trim()).neq('id', params.id).single();

            if (existingCompany) {
                setAlert({
                    message: t('company_code_already_exists'),
                    type: 'danger',
                });
                return;
            }

            const companyData = {
                name: formData.name.trim(),
                code: formData.code.trim(),
                services_offered: formData.services_offered.trim() || null,
                vehicle_count: formData.vehicle_count || 0,
                vehicle_availability: formData.vehicle_availability,
                accounting_methods: formData.accounting_methods.trim() || null,
                address: formData.address.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                status: formData.status,
                notes: formData.notes.trim() || null,
                pricing_data: pricingData,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from('travel_companies').update(companyData).eq('id', params.id);

            if (error) throw error;

            setAlert({
                message: t('travel_company_updated_successfully'),
                type: 'success',
            });

            // Redirect to travel companies list after a delay
            setTimeout(() => {
                router.push('/travel-companies');
            }, 700);
        } catch (error) {
            console.error('Error updating travel company:', error);
            setAlert({
                message: t('error_updating_travel_company'),
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
    ];

    const renderTabContent = () => {
        if (activeTab === 0) {
            return (
                <div className="space-y-6">
                    {/* Profile Picture - At the top */}
                    <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex justify-center">
                            <ServiceProfilePictureUpload
                                serviceType="travel_companies"
                                serviceId={params.id}
                                currentPicturePath={profilePicturePath}
                                onUploadSuccess={(path) => {
                                    setProfilePicturePath(path);
                                    setAlert({ message: t('profile_picture_updated'), type: 'success' });
                                }}
                                onUploadError={(error) => {
                                    setAlert({ message: error, type: 'danger' });
                                }}
                                onRemoveSuccess={() => {
                                    setProfilePicturePath(null);
                                    setAlert({ message: t('profile_picture_removed'), type: 'success' });
                                }}
                                size="lg"
                                label={t('profile_picture')}
                            />
                        </div>
                    </div>

                    {/* Company Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('travel_company_name')} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <IconBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    id="company_name"
                                    type="text"
                                    className="form-input pl-10"
                                    placeholder={t('enter_travel_company_name')}
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="company_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('travel_company_code')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="company_code"
                                type="text"
                                className="form-input"
                                placeholder={t('enter_travel_company_code')}
                                value={formData.code}
                                onChange={(e) => handleInputChange('code', e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('travel_company_phone')} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <IconPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    id="phone"
                                    type="tel"
                                    className="form-input pl-10"
                                    placeholder={t('enter_travel_company_phone')}
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('travel_company_email')} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    id="email"
                                    type="email"
                                    className="form-input pl-10"
                                    placeholder={t('enter_travel_company_email')}
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('travel_company_address')} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <IconMapPin className="absolute left-3 top-3 text-gray-400" />
                                <textarea
                                    id="address"
                                    className="form-textarea pl-10"
                                    rows={3}
                                    placeholder={t('enter_travel_company_address')}
                                    value={formData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Vehicle Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="vehicle_count" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('vehicle_count')}
                            </label>
                            <div className="relative">
                                <IconCar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    id="vehicle_count"
                                    type="number"
                                    className="form-input pl-10"
                                    placeholder={t('enter_vehicle_count')}
                                    value={formData.vehicle_count}
                                    onChange={(e) => handleInputChange('vehicle_count', parseInt(e.target.value) || 0)}
                                    min="0"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('vehicle_availability')}</label>
                            <CustomSelect
                                value={formData.vehicle_availability}
                                onChange={(value) => handleInputChange('vehicle_availability', value)}
                                options={availabilityOptions}
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
                                className="form-textarea"
                                rows={3}
                                placeholder={t('enter_services_offered')}
                                value={formData.services_offered}
                                onChange={(e) => handleInputChange('services_offered', e.target.value)}
                            />
                        </div>

                        <div>
                            <label htmlFor="accounting_methods" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('accounting_methods')}
                            </label>
                            <textarea
                                id="accounting_methods"
                                className="form-textarea"
                                rows={3}
                                placeholder={t('enter_accounting_methods')}
                                value={formData.accounting_methods}
                                onChange={(e) => handleInputChange('accounting_methods', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('status')}</label>
                            <CustomSelect value={formData.status} onChange={(value) => handleInputChange('status', value)} options={statusOptions} placeholder={t('select_status')} />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('notes')}
                            </label>
                            <textarea
                                id="notes"
                                className="form-textarea"
                                rows={3}
                                placeholder={t('enter_notes')}
                                value={formData.notes}
                                onChange={(e) => handleInputChange('notes', e.target.value)}
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
                                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold min-w-[140px]">{t('zones')}</th>
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
                                                      : vehicleType === 'مينيبوس 18'
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

        return null;
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <IconBuilding className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-semibold dark:text-white-light">{t('edit_travel_company')}</h1>
                </div>
                <Link href="/travel-companies" className="btn btn-outline-primary gap-2">
                    <IconArrowLeft />
                    {t('back_to_travel_companies')}
                </Link>
            </div>

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

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-4">
                    <Link href="/travel-companies" className="btn btn-outline-danger">
                        {t('cancel')}
                    </Link>
                    <button type="submit" className="btn btn-primary gap-2" disabled={loading}>
                        {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <IconSave />}
                        {loading ? t('updating') : t('update_travel_company')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditTravelCompany;
