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
import IconEdit from '@/components/icon/icon-edit';
import IconCashBanknotes from '@/components/icon/icon-cash-banknotes';
import IconStar from '@/components/icon/icon-star';
import IconInfoCircle from '@/components/icon/icon-info-circle';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getTranslation } from '@/i18n';
import Link from 'next/link';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import ServiceBalanceTab from '@/components/service-balance/service-balance-tab';
import RatingsDisplay from '@/components/ratings/ratings-display';
import { getServiceProfilePictureUrlWithFallback } from '@/utils/service-profile-picture';
import Image from 'next/image';
import { Tab } from '@headlessui/react';

interface TravelCompany {
    id: string;
    name: string;
    code: string;
    services_offered: string;
    vehicle_count: number;
    vehicle_availability: string;
    accounting_methods: string;
    address: string;
    email: string;
    phone: string;
    pricing_data: Record<string, Record<string, number>>;
    status: string;
    notes: string;
    created_at: string;
    updated_at: string;
    profile_picture_url?: string | null;
}

const PreviewTravelCompany = ({ params }: { params: { id: string } }) => {
    const { t } = getTranslation();
    const router = useRouter();
    const supabase = createClientComponentClient();
    const [loading, setLoading] = useState(true);
    const [travelCompany, setTravelCompany] = useState<TravelCompany | null>(null);
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);
    type Zone = { id: string; name: string; is_active: boolean };
    const [zones, setZones] = useState<Zone[]>([]);
    const [zonesLoading, setZonesLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);

    // Fetch travel company data
    useEffect(() => {
        const fetchTravelCompany = async () => {
            try {
                setLoading(true);
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

                setTravelCompany(data);
            } catch (error) {
                console.error('Error fetching travel company:', error);
                setAlert({
                    message: t('error_loading_travel_company'),
                    type: 'danger',
                });
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchTravelCompany();
        }
    }, [params.id]); // Removed 't' from dependencies to prevent infinite loop

    // Fetch active zones for pricing matrix rows
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

    const getStatusBadge = (status: string) => {
        if (status === 'active') {
            return <span className="badge bg-success">{t('active')}</span>;
        }
        return <span className="badge bg-danger">{t('inactive')}</span>;
    };

    const getAvailabilityBadge = (availability: string) => {
        switch (availability) {
            case 'available':
                return <span className="badge bg-success">{t('available')}</span>;
            case 'busy':
                return <span className="badge bg-warning">{t('busy')}</span>;
            case 'maintenance':
                return <span className="badge bg-danger">{t('maintenance')}</span>;
            default:
                return <span className="badge bg-secondary">{availability}</span>;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!travelCompany) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">{t('travel_company_not_found')}</h2>
                    <Link href="/travel-companies" className="btn btn-primary">
                        {t('back_to_travel_companies')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <IconBuilding className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-semibold dark:text-white-light">{t('travel_company_details')}</h1>
                </div>
                <div className="flex gap-3">
                    <Link href={`/travel-companies/edit/${travelCompany.id}`} className="btn btn-outline-warning gap-2">
                        <IconEdit />
                        {t('edit')}
                    </Link>
                    <Link href="/travel-companies" className="btn btn-outline-primary gap-2">
                        <IconArrowLeft />
                        {t('back_to_travel_companies')}
                    </Link>
                </div>
            </div>

            {alert && (
                <div className="mb-4">
                    <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
                </div>
            )}

            {/* Profile Picture Card */}
            <div className="panel mb-6">
                <div className="flex flex-col items-center gap-4">
                    <Image
                        src={getServiceProfilePictureUrlWithFallback(travelCompany.profile_picture_url, 'travel_companies')}
                        alt={travelCompany.name}
                        width={150}
                        height={150}
                        className="rounded-full object-cover border-4 border-primary/20"
                    />
                    <div className="text-center">
                        <h2 className="text-2xl font-bold dark:text-white-light mb-1">{travelCompany.name}</h2>
                        <p className="text-gray-500 dark:text-gray-400">{travelCompany.code}</p>
                        <div className="mt-2">{getStatusBadge(travelCompany.status)}</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="panel">
                <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
                    <Tab.List className="flex flex-wrap border-b border-white-light dark:border-[#191e3a] mb-5">
                        <Tab as="div" className="flex-1">
                            {({ selected }) => (
                                <button
                                    className={`${
                                        selected ? 'text-primary !border-primary' : 'border-transparent'
                                    } flex items-center justify-center gap-2 border-b-2 p-4 font-semibold hover:text-primary w-full transition-colors`}
                                >
                                    <IconInfoCircle className="w-5 h-5" />
                                    <span>{t('basic_information')}</span>
                                </button>
                            )}
                        </Tab>
                        <Tab as="div" className="flex-1">
                            {({ selected }) => (
                                <button
                                    className={`${
                                        selected ? 'text-primary !border-primary' : 'border-transparent'
                                    } flex items-center justify-center gap-2 border-b-2 p-4 font-semibold hover:text-primary w-full transition-colors`}
                                >
                                    <IconCashBanknotes className="w-5 h-5" />
                                    <span>{t('pricing')}</span>
                                </button>
                            )}
                        </Tab>
                        <Tab as="div" className="flex-1">
                            {({ selected }) => (
                                <button
                                    className={`${
                                        selected ? 'text-primary !border-primary' : 'border-transparent'
                                    } flex items-center justify-center gap-2 border-b-2 p-4 font-semibold hover:text-primary w-full transition-colors`}
                                >
                                    <IconBuilding className="w-5 h-5" />
                                    <span>{t('payouts')}</span>
                                </button>
                            )}
                        </Tab>
                        <Tab as="div" className="flex-1">
                            {({ selected }) => (
                                <button
                                    className={`${
                                        selected ? 'text-primary !border-primary' : 'border-transparent'
                                    } flex items-center justify-center gap-2 border-b-2 p-4 font-semibold hover:text-primary w-full transition-colors`}
                                >
                                    <IconStar className="w-5 h-5" />
                                    <span>{t('ratings')}</span>
                                </button>
                            )}
                        </Tab>
                    </Tab.List>

                    <Tab.Panels>
                        {/* Tab 1: Basic Information */}
                        <Tab.Panel>
                            <div className="space-y-6">
                                {/* Basic Information */}
                                <div>
                                    <h5 className="text-lg font-semibold dark:text-white-light mb-4 flex items-center gap-2">
                                        <IconBuilding className="h-5 w-5 text-primary" />
                                        {t('company_details')}
                                    </h5>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('travel_company_name')}</label>
                                            <p className="text-base font-medium dark:text-white-light">{travelCompany.name}</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('travel_company_code')}</label>
                                            <p className="text-base font-medium dark:text-white-light">{travelCompany.code}</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('status')}</label>
                                            <div>{getStatusBadge(travelCompany.status)}</div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('created_at')}</label>
                                            <p className="text-base dark:text-white-light">{formatDate(travelCompany.created_at)}</p>
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-white-light dark:border-[#1b2e4b]" />

                                {/* Contact Information */}
                                <div>
                                    <h5 className="text-lg font-semibold dark:text-white-light mb-4 flex items-center gap-2">
                                        <IconUser className="h-5 w-5 text-primary" />
                                        {t('contact_information')}
                                    </h5>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('travel_company_phone')}</label>
                                            <div className="flex items-center gap-2">
                                                <IconPhone className="h-4 w-4 text-gray-400" />
                                                <p className="text-base dark:text-white-light">{travelCompany.phone}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('travel_company_email')}</label>
                                            <div className="flex items-center gap-2">
                                                <IconMail className="h-4 w-4 text-gray-400" />
                                                <p className="text-base dark:text-white-light">{travelCompany.email}</p>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('travel_company_address')}</label>
                                            <div className="flex items-start gap-2">
                                                <IconMapPin className="h-4 w-4 text-gray-400 mt-1" />
                                                <p className="text-base dark:text-white-light">{travelCompany.address}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-white-light dark:border-[#1b2e4b]" />

                                {/* Vehicle Information */}
                                <div>
                                    <h5 className="text-lg font-semibold dark:text-white-light mb-4 flex items-center gap-2">
                                        <IconCar className="h-5 w-5 text-primary" />
                                        {t('vehicles_information')}
                                    </h5>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('vehicle_count')}</label>
                                            <p className="text-base font-medium dark:text-white-light">{travelCompany.vehicle_count}</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('vehicle_availability')}</label>
                                            <div>{getAvailabilityBadge(travelCompany.vehicle_availability)}</div>
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-white-light dark:border-[#1b2e4b]" />

                                {/* Services and Business Information */}
                                <div>
                                    <h5 className="text-lg font-semibold dark:text-white-light mb-4 flex items-center gap-2">
                                        <IconBuilding className="h-5 w-5 text-primary" />
                                        {t('services_and_business')}
                                    </h5>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('services_offered')}</label>
                                            <p className="text-base dark:text-white-light">{travelCompany.services_offered || t('not_specified')}</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('accounting_methods')}</label>
                                            <p className="text-base dark:text-white-light">{travelCompany.accounting_methods || t('not_specified')}</p>
                                        </div>

                                        {travelCompany.notes && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('notes')}</label>
                                                <p className="text-base dark:text-white-light">{travelCompany.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <hr className="border-white-light dark:border-[#1b2e4b]" />

                                {/* Timestamps */}
                                <div>
                                    <h5 className="text-lg font-semibold dark:text-white-light mb-4 flex items-center gap-2">
                                        <IconUser className="h-5 w-5 text-primary" />
                                        {t('record_information')}
                                    </h5>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('created_at')}</label>
                                            <p className="text-base dark:text-white-light">{formatDate(travelCompany.created_at)}</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('updated_at')}</label>
                                            <p className="text-base dark:text-white-light">{formatDate(travelCompany.updated_at)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Tab.Panel>

                        {/* Tab 2: Pricing */}
                        <Tab.Panel>
                            <div>
                                <h5 className="text-lg font-semibold dark:text-white-light mb-4 flex items-center gap-2">
                                    <IconCar className="h-5 w-5 text-primary" />
                                    {t('pricing_matrix')}
                                </h5>

                                {(() => {
                                    // Check if pricing_data exists and has content
                                    const hasPricingData = travelCompany.pricing_data && typeof travelCompany.pricing_data === 'object' && Object.keys(travelCompany.pricing_data).length > 0;

                                    if (!hasPricingData) {
                                        return (
                                            <div className="text-center py-8">
                                                <p className="text-gray-500 dark:text-gray-400 mb-2">{t('no_pricing_data_available')}</p>
                                                <p className="text-sm text-gray-400 dark:text-gray-500">{t('edit_company_to_add_pricing')}</p>
                                            </div>
                                        );
                                    }

                                    const vehicleTypes = ['خاصة', 'فان', 'باص 40', 'باص 50', 'مينيبوس 18', 'مينيبوس 24'];

                                    return (
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
                                                    {zonesLoading ? (
                                                        <tr>
                                                            <td colSpan={1 + vehicleTypes.length} className="text-center py-4">
                                                                {t('loading')}
                                                            </td>
                                                        </tr>
                                                    ) : zones.length > 0 ? (
                                                        // Use zones from database
                                                        zones.map((zone) => (
                                                            <tr key={zone.id}>
                                                                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-semibold text-right bg-gray-50 dark:bg-gray-800">
                                                                    {zone.name}
                                                                </td>
                                                                {vehicleTypes.map((vehicleType) => {
                                                                    const price = travelCompany.pricing_data?.[vehicleType]?.[zone.name];
                                                                    return (
                                                                        <td key={vehicleType} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">
                                                                            {price ? `₪${Number(price).toFixed(2)}` : '-'}
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        // Fallback: derive zone names from pricing_data keys
                                                        (() => {
                                                            const derivedZones = new Set<string>();
                                                            vehicleTypes.forEach((vType) => {
                                                                const zones = Object.keys(travelCompany.pricing_data?.[vType] || {});
                                                                zones.forEach((z) => derivedZones.add(z));
                                                            });

                                                            const zonesList = Array.from(derivedZones);

                                                            if (zonesList.length === 0) {
                                                                return (
                                                                    <tr>
                                                                        <td colSpan={1 + vehicleTypes.length} className="text-center py-4 text-gray-500 dark:text-gray-400">
                                                                            {t('no_pricing_data_available')}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            }

                                                            return zonesList.map((zoneName) => (
                                                                <tr key={zoneName}>
                                                                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-semibold text-right bg-gray-50 dark:bg-gray-800">
                                                                        {zoneName}
                                                                    </td>
                                                                    {vehicleTypes.map((vehicleType) => {
                                                                        const price = travelCompany.pricing_data?.[vehicleType]?.[zoneName];
                                                                        return (
                                                                            <td key={vehicleType} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">
                                                                                {price ? `₪${Number(price).toFixed(2)}` : '-'}
                                                                            </td>
                                                                        );
                                                                    })}
                                                                </tr>
                                                            ));
                                                        })()
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })()}
                            </div>
                        </Tab.Panel>

                        {/* Tab 3: Payouts */}
                        <Tab.Panel>
                            <ServiceBalanceTab serviceType="travel_companies" serviceId={travelCompany.id} />
                        </Tab.Panel>

                        {/* Tab 4: Ratings */}
                        <Tab.Panel>
                            <RatingsDisplay serviceType="travel_companies" serviceId={travelCompany.id} t={t} />
                        </Tab.Panel>
                    </Tab.Panels>
                </Tab.Group>
            </div>
        </div>
    );
};

export default PreviewTravelCompany;
