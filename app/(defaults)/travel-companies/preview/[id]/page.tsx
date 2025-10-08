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
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getTranslation } from '@/i18n';
import Link from 'next/link';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import ServiceBalanceTab from '@/components/service-balance/service-balance-tab';

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

            <div className="space-y-6">
                {/* Basic Information */}
                <div className="panel">
                    <div className="flex items-center gap-3 mb-5">
                        <IconBuilding className="h-5 w-5 text-primary" />
                        <h5 className="text-lg font-semibold dark:text-white-light">{t('basic_information')}</h5>
                    </div>

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

                {/* Contact Information */}
                <div className="panel">
                    <div className="flex items-center gap-3 mb-5">
                        <IconUser className="h-5 w-5 text-primary" />
                        <h5 className="text-lg font-semibold dark:text-white-light">{t('contact_information')}</h5>
                    </div>

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

                {/* Vehicle Information */}
                <div className="panel">
                    <div className="flex items-center gap-3 mb-5">
                        <IconCar className="h-5 w-5 text-primary" />
                        <h5 className="text-lg font-semibold dark:text-white-light">{t('vehicles_information')}</h5>
                    </div>

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

                {/* Pricing Matrix (Vehicles as columns, Zones as rows) */}
                {travelCompany.pricing_data && Object.keys(travelCompany.pricing_data).length > 0 && (
                    <div className="panel">
                        <div className="flex items-center gap-3 mb-5">
                            <IconCar className="h-5 w-5 text-primary" />
                            <h5 className="text-lg font-semibold dark:text-white-light">{t('pricing_matrix')}</h5>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="table-auto w-full border-collapse border border-gray-300 dark:border-gray-600">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-gray-700">
                                        <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold min-w-[140px]">{t('zones')}</th>
                                        {['خاصة', 'فان', 'باص 40', 'باص 50', 'مينيبوس 18', 'مينيبوس 24'].map((vehicleType) => (
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
                                    {/* Loading / Empty states for zones */}
                                    {zonesLoading && (
                                        <tr>
                                            <td colSpan={1 + 6} className="text-center py-4">
                                                {t('loading')}
                                            </td>
                                        </tr>
                                    )}
                                    {!zonesLoading &&
                                        zones.length === 0 &&
                                        // Fallback: derive zone names from pricing_data keys if zones are not available
                                        (() => {
                                            const vehicleTypes = ['خاصة', 'فان', 'باص 40', 'باص 50', 'مينيبوس 18', 'مينيبوس 24'];
                                            const derivedZones = Array.from(new Set(vehicleTypes.flatMap((v) => Object.keys((travelCompany.pricing_data as any)?.[v] || {}))));
                                            if (derivedZones.length === 0) {
                                                return (
                                                    <tr>
                                                        <td colSpan={1 + 6} className="text-center py-4">
                                                            {t('no_zones_found')}
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                            return (
                                                <>
                                                    {derivedZones.map((zoneName) => (
                                                        <tr key={zoneName}>
                                                            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-semibold text-right bg-gray-50 dark:bg-gray-800">{zoneName}</td>
                                                            {vehicleTypes.map((vehicleType) => (
                                                                <td key={vehicleType} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">
                                                                    {(travelCompany.pricing_data as any)?.[vehicleType]?.[zoneName] ?? '-'}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </>
                                            );
                                        })()}
                                    {!zonesLoading && zones.length > 0 && (
                                        <>
                                            {zones.map((zone) => (
                                                <tr key={zone.id}>
                                                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-semibold text-right bg-gray-50 dark:bg-gray-800">{zone.name}</td>
                                                    {['خاصة', 'فان', 'باص 40', 'باص 50', 'مينيبوس 18', 'مينيبوس 24'].map((vehicleType) => (
                                                        <td key={vehicleType} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center">
                                                            {travelCompany.pricing_data?.[vehicleType]?.[zone.name] ?? '-'}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Services and Business Information */}
                <div className="panel">
                    <div className="flex items-center gap-3 mb-5">
                        <IconBuilding className="h-5 w-5 text-primary" />
                        <h5 className="text-lg font-semibold dark:text-white-light">{t('services_and_business')}</h5>
                    </div>

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

                {/* Timestamps */}
                <div className="panel">
                    <div className="flex items-center gap-3 mb-5">
                        <IconUser className="h-5 w-5 text-primary" />
                        <h5 className="text-lg font-semibold dark:text-white-light">{t('record_information')}</h5>
                    </div>

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

                {/* Balance Section */}
                <div>
                    <ServiceBalanceTab serviceType="travel_companies" serviceId={travelCompany.id} />
                </div>
            </div>
        </div>
    );
};

export default PreviewTravelCompany;
