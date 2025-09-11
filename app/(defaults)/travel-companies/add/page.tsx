'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import IconBuilding from '@/components/icon/icon-building';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconPlus from '@/components/icon/icon-plus';
import IconUser from '@/components/icon/icon-user';
import IconCar from '@/components/icon/icon-car';
import supabase from '@/lib/supabase';
import { getTranslation } from '@/i18n';
import Link from 'next/link';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import CustomSelect, { SelectOption } from '@/components/elements/custom-select';

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
}

interface PricingData {
    [vehicleType: string]: {
        [area: string]: number;
    };
}

const AddTravelCompany = () => {
    const { t } = getTranslation();
    const router = useRouter();
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
    });

    const [pricingData, setPricingData] = useState<PricingData>({});

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
    const areas = ['الجولان وضواحيها', 'حيفا وضواحيها', 'الناصره وضواحيها', 'المثلث', 'المركز', 'الجنوب', 'العربة', 'البحر الميت', 'ايلات'];

    const areaLabels: Record<string, string> = {
        'الجولان وضواحيها': t('area_golan'),
        'حيفا وضواحيها': t('area_haifa'),
        'الناصره وضواحيها': t('area_nazareth'),
        المثلث: t('area_triangle'),
        المركز: t('area_center'),
        الجنوب: t('area_south'),
        العربة: t('area_arava'),
        'البحر الميت': t('area_dead_sea'),
        ايلات: t('area_eilat'),
    };

    const handleInputChange = (name: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handlePricingChange = (vehicleType: string, area: string, price: string) => {
        const numericPrice = parseFloat(price) || 0;
        setPricingData((prev) => ({
            ...prev,
            [vehicleType]: {
                ...prev[vehicleType],
                [area]: numericPrice,
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateBasicInfo()) {
            setActiveTab(0); // Switch to basic info tab if validation fails
            return;
        }

        try {
            setLoading(true);
            setAlert(null);

            const { data, error } = await supabase
                .from('travel_companies')
                .insert([
                    {
                        ...formData,
                        pricing_data: pricingData,
                    },
                ])
                .select()
                .single();

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
                                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-medium min-w-[120px]">{t('vehicle_type')}</th>
                                    {areas.map((area) => (
                                        <th key={area} className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center font-medium min-w-[100px] text-xs">
                                            {areaLabels[area]}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {vehicleTypes.map((vehicleType) => (
                                    <tr key={vehicleType} className="">
                                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-medium text-right bg-gray-50 dark:bg-gray-800">
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
                                        </td>
                                        {areas.map((area) => (
                                            <td key={area} className="border border-gray-300 dark:border-gray-600 p-1 hover:bg-primary/30 dark:hover:bg-primary/60">
                                                <input
                                                    type="number"
                                                    className="w-full px-2 py-1 text-center border-0 bg-transparent focus:ring-1 focus:ring-primary rounded text-sm"
                                                    placeholder="0"
                                                    value={pricingData[vehicleType]?.[area] || ''}
                                                    onChange={(e) => handlePricingChange(vehicleType, area, e.target.value)}
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

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <IconBuilding className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-semibold dark:text-white-light">{t('add_travel_company')}</h1>
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
