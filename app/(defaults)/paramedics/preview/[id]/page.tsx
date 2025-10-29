'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Components
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconEdit from '@/components/icon/icon-edit';
import IconHeart from '@/components/icon/icon-heart';
import IconPhone from '@/components/icon/icon-phone';
import IconMail from '@/components/icon/icon-mail';
import IconCreditCard from '@/components/icon/icon-credit-card';
import IconCalendar from '@/components/icon/icon-calendar';
import IconClipboardText from '@/components/icon/icon-clipboard-text';
import IconShekelSign from '@/components/icon/icon-shekel-sign';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import ServiceBalanceTab from '@/components/service-balance/service-balance-tab';
import RatingsDisplay from '@/components/ratings/ratings-display';

import { getTranslation } from '@/i18n';
import { getServiceProfileUrl } from '@/utils/service-profile-upload';

interface Paramedic {
    id: string;
    created_at: string;
    updated_at: string;
    name: string;
    identity_number: string;
    phone: string;
    email?: string;
    hourly_rate: number;
    daily_rate: number;
    regional_rate: number;
    overnight_rate: number;
    status: string;
    notes?: string;
    profile_picture_url?: string | null;
}

const ParamedicPreview = () => {
    const { t } = getTranslation();
    const params = useParams();
    const paramedicId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [paramedic, setParamedic] = useState<Paramedic | null>(null);
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

    const supabase = createClientComponentClient();

    useEffect(() => {
        const fetchParamedic = async () => {
            try {
                setLoading(true);

                const { data, error } = await supabase.from('paramedics').select('*').eq('id', paramedicId).single();

                if (error) {
                    console.error('Error fetching paramedic:', error);
                    setAlert({ message: t('error_loading_paramedic'), type: 'danger' });
                    return;
                }

                setParamedic(data);
            } catch (error) {
                console.error('Error fetching paramedic:', error);
                setAlert({ message: t('error_loading_paramedic'), type: 'danger' });
            } finally {
                setLoading(false);
            }
        };

        if (paramedicId) {
            fetchParamedic();
        }
    }, [paramedicId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!paramedic) {
        return (
            <div className="container mx-auto p-6">
                <div className="panel">
                    <div className="text-center py-12">
                        <IconHeart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <h2 className="text-xl font-semibold text-gray-600 mb-2">{t('paramedic_not_found')}</h2>
                        <p className="text-gray-500 mb-6">{t('paramedic_not_found_description')}</p>
                        <Link href="/paramedics" className="btn btn-primary">
                            {t('back_to_paramedics')}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            {/* Header */}
            <div className="flex items-center gap-5 mb-6">
                <Link href="/paramedics" className="text-primary hover:text-primary/80">
                    <IconArrowLeft className="h-7 w-7" />
                </Link>

                {/* Breadcrumb Navigation */}
                <ul className="flex space-x-2 rtl:space-x-reverse">
                    <li>
                        <Link href="/" className="text-primary hover:underline">
                            {t('home')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <Link href="/paramedics" className="text-primary hover:underline">
                            {t('paramedics')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <span>{paramedic.name}</span>
                    </li>
                </ul>
            </div>

            {/* Title and Action */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold">{paramedic.name}</h1>
                    <p className="text-gray-500 mt-2">{t('paramedic_details')}</p>
                </div>
                <Link href={`/paramedics/edit/${paramedic.id}`} className="btn btn-primary flex items-center gap-2">
                    <IconEdit className="w-4 h-4" />
                    {t('edit_paramedic')}
                </Link>
            </div>

            {alert && (
                <div className="fixed top-4 right-4 z-50 min-w-80 max-w-md">
                    <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert(null)} />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Information */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Information */}
                    <div className="panel">
                        <div className="mb-5">
                            <h3 className="text-lg font-semibold">{t('basic_information')}</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">{t('paramedic_name')}</label>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">{paramedic.name}</div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">{t('identity_number')}</label>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">{paramedic.identity_number}</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">{t('status')}</label>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <span className={`badge ${paramedic.status === 'active' ? 'badge-outline-success' : 'badge-outline-danger'}`}>
                                            {paramedic.status === 'active' ? t('active') : t('inactive')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="panel">
                        <div className="mb-5">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <IconPhone className="w-5 h-5 text-primary" />
                                {t('contact_information')}
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-gray-700 dark:text-white mb-2 flex items-center gap-2">
                                        <IconPhone className="w-4 h-4 text-primary" />
                                        {t('phone')}
                                    </label>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">{paramedic.phone}</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-gray-700 dark:text-white mb-2 flex items-center gap-2">
                                        <IconMail className="w-4 h-4 text-primary" />
                                        {t('email')}
                                    </label>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">{paramedic.email || t('not_specified')}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pricing Information */}
                    <div className="panel">
                        <div className="mb-5">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <IconShekelSign className="w-5 h-5 text-primary" />
                                {t('pricing_information')}
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">{t('hourly_rate')}</label>
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <span className="text-lg font-bold text-blue-600">{paramedic.hourly_rate}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">{t('daily_rate')}</label>
                                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <span className="text-lg font-bold text-green-600">{paramedic.daily_rate}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">{t('regional_rate')}</label>
                                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                        <span className="text-lg font-bold text-orange-600">{paramedic.regional_rate}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">{t('overnight_rate')}</label>
                                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                        <span className="text-lg font-bold text-purple-600">{paramedic.overnight_rate}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {paramedic.notes && (
                        <div className="panel">
                            <div className="mb-5">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <IconClipboardText className="w-5 h-5 text-primary" />
                                    {t('notes')}
                                </h3>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">{paramedic.notes}</div>
                        </div>
                    )}

                    {/* Balance Section */}
                    <div>
                        <ServiceBalanceTab serviceType="paramedics" serviceId={paramedic.id} />
                    </div>

                    {/* Ratings Section */}
                    <div className="panel">
                        <RatingsDisplay serviceType="paramedics" serviceId={paramedic.id} t={t} />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Profile Picture */}
                    <div className="panel">
                        <div className="flex flex-col items-center">
                            <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-lg">
                                <img src={getServiceProfileUrl(paramedic.profile_picture_url)} alt={paramedic.name} className="w-full h-full object-cover" />
                            </div>
                            <h2 className="mt-4 text-xl font-bold text-center">{paramedic.name}</h2>
                            <p className="text-gray-500 dark:text-gray-400">{t('paramedic')}</p>
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="panel">
                        <div className="mb-5">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <IconCalendar className="w-5 h-5 text-primary" />
                                {t('record_information')}
                            </h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('created_at')}</label>
                                <div className="text-sm font-semibold">{new Date(paramedic.created_at).toLocaleDateString('tr-TR')}</div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('last_updated')}</label>
                                <div className="text-sm font-semibold">{new Date(paramedic.updated_at).toLocaleDateString('tr-TR')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParamedicPreview;
