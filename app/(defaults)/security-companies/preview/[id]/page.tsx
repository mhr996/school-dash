'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';

// Components
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconEdit from '@/components/icon/icon-edit';
import IconLock from '@/components/icon/icon-lock';
import IconPhone from '@/components/icon/icon-phone';
import IconMail from '@/components/icon/icon-mail';
import IconBuilding from '@/components/icon/icon-building';
import IconCreditCard from '@/components/icon/icon-credit-card';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconCalendar from '@/components/icon/icon-calendar';
import IconClipboardText from '@/components/icon/icon-clipboard-text';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import ServiceBalanceTab from '@/components/service-balance/service-balance-tab';
import { getServiceProfilePictureUrlWithFallback } from '@/utils/service-profile-picture';

import { getTranslation } from '@/i18n';

interface SecurityCompany {
    id: string;
    created_at: string;
    updated_at: string;
    name: string;
    tax_number?: string;
    phone?: string;
    email?: string;
    address?: string;
    license_types?: string;
    weapon_types?: string;
    status?: string;
    notes?: string;
    profile_picture_path?: string | null;
}

const SecurityCompanyPreview = () => {
    const { t } = getTranslation();
    const params = useParams();
    const companyId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [company, setCompany] = useState<SecurityCompany | null>(null);
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

    const supabase = createClientComponentClient();

    useEffect(() => {
        const fetchSecurityCompany = async () => {
            try {
                setLoading(true);

                const { data, error } = await supabase.from('security_companies').select('*').eq('id', companyId).single();

                if (error) {
                    console.error('Error fetching security company:', error);
                    setAlert({ message: t('error_loading_security_company'), type: 'danger' });
                    return;
                }

                setCompany(data);
            } catch (error) {
                console.error('Error fetching security company:', error);
                setAlert({ message: t('error_loading_security_company'), type: 'danger' });
            } finally {
                setLoading(false);
            }
        };

        if (companyId) {
            fetchSecurityCompany();
        }
    }, [companyId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!company) {
        return (
            <div className="container mx-auto p-6">
                <div className="panel">
                    <div className="text-center py-12">
                        <IconLock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <h2 className="text-xl font-semibold text-gray-600 mb-2">{t('security_company_not_found')}</h2>
                        <p className="text-gray-500 mb-6">{t('security_company_not_found_description')}</p>
                        <Link href="/security-companies" className="btn btn-primary">
                            {t('back_to_security_companies')}
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
                <Link href="/security-companies" className="text-primary hover:text-primary/80">
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
                        <Link href="/security-companies" className="text-primary hover:underline">
                            {t('security_companies')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <span>{company.name}</span>
                    </li>
                </ul>
            </div>

            {/* Title and Action */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <IconLock className="w-8 h-8 text-primary" />
                        {company.name}
                    </h1>
                    <p className="text-gray-500 mt-2">{t('security_company_details')}</p>
                </div>
                <Link href={`/security-companies/edit/${company.id}`} className="btn btn-primary flex items-center gap-2">
                    <IconEdit className="w-4 h-4" />
                    {t('edit_security_company')}
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
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <IconBuilding className="w-5 h-5 text-primary" />
                                {t('basic_information')}
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">{t('security_company_name')}</label>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">{company.name}</div>
                                </div>

                                {company.tax_number && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">{t('security_tax_number')}</label>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">{company.tax_number}</div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">{t('status')}</label>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <span className={`badge ${company.status === 'active' ? 'badge-outline-success' : 'badge-outline-danger'}`}>
                                            {company.status === 'active' ? t('active') : t('inactive')}
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
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">{company.phone || t('not_specified')}</div>
                                </div>

                                {company.address && (
                                    <div>
                                        <label className="text-sm font-bold text-gray-700 dark:text-white mb-2 flex items-center gap-2">
                                            <IconMapPin className="w-4 h-4 text-primary" />
                                            {t('address')}
                                        </label>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">{company.address}</div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-gray-700 dark:text-white mb-2 flex items-center gap-2">
                                        <IconMail className="w-4 h-4 text-primary" />
                                        {t('email')}
                                    </label>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">{company.email || t('not_specified')}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Information */}
                    <div className="panel">
                        <div className="mb-5">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <IconLock className="w-5 h-5 text-primary" />
                                {t('security_information')}
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">{t('license_types')}</label>
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <span className="text-blue-600 dark:text-blue-300 font-semibold">{company.license_types || t('not_specified')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">{t('weapon_types')}</label>
                                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                        <span className="text-orange-600 dark:text-orange-300 font-semibold">{company.weapon_types || t('not_specified')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {company.notes && (
                        <div className="panel">
                            <div className="mb-5">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <IconClipboardText className="w-5 h-5 text-primary" />
                                    {t('notes')}
                                </h3>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">{company.notes}</div>
                        </div>
                    )}

                    {/* Balance Section */}
                    <div>
                        <ServiceBalanceTab serviceType="security_companies" serviceId={company.id} />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Profile Picture */}
                    <div className="panel">
                        <div className="mb-5">
                            <h3 className="text-lg font-semibold">{t('profile_picture')}</h3>
                        </div>
                        <div className="flex justify-center">
                            <Image
                                src={getServiceProfilePictureUrlWithFallback(company.profile_picture_path, 'security_companies')}
                                alt={company.name}
                                width={200}
                                height={200}
                                className="rounded-lg object-cover"
                            />
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
                                <div className="text-sm font-semibold">{new Date(company.created_at).toLocaleDateString('tr-TR')}</div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('last_updated')}</label>
                                <div className="text-sm font-semibold">{new Date(company.updated_at).toLocaleDateString('tr-TR')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecurityCompanyPreview;
