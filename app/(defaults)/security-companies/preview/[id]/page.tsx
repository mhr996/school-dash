'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import supabase from '@/lib/supabase';

// Components
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconLock from '@/components/icon/icon-lock';
import IconEdit from '@/components/icon/icon-edit';
import IconUser from '@/components/icon/icon-user';
import IconPhone from '@/components/icon/icon-phone';
import IconMail from '@/components/icon/icon-mail';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconCalendar from '@/components/icon/icon-calendar';
import IconClock from '@/components/icon/icon-clock';

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
}

const SecurityCompanyPreview = () => {
    const { t } = getTranslation();
    const params = useParams();
    const router = useRouter();
    const [company, setCompany] = useState<SecurityCompany | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSecurityCompany = async () => {
            try {
                if (!params?.id) return;

                const { data, error } = await supabase.from('security_companies').select('*').eq('id', params.id).single();

                if (error) {
                    console.error('Error fetching security company:', error);
                    return;
                }

                setCompany(data as SecurityCompany);
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSecurityCompany();
    }, [params?.id]);

    if (loading) {
        return (
            <div className="panel border-white-light px-0 dark:border-[#1b2e4b]">
                <div className="flex min-h-[400px] items-center justify-center">
                    <div className="animate-spin border-4 border-primary border-l-transparent rounded-full w-10 h-10"></div>
                </div>
            </div>
        );
    }

    if (!company) {
        return (
            <div className="panel border-white-light px-0 dark:border-[#1b2e4b]">
                <div className="flex min-h-[400px] flex-col items-center justify-center">
                    <IconLock className="h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-500 mb-2">{t('security_company_not_found')}</h3>
                    <p className="text-sm text-gray-400 mb-6">{t('security_company_not_found_description')}</p>
                    <Link href="/security-companies" className="btn btn-primary">
                        {t('back_to_security_companies')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="panel border-white-light px-0 dark:border-[#1b2e4b]">
            {/* Header */}
            <div className="mb-5 flex flex-col gap-5 px-5 md:items-start">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <Link href="/security-companies" className="text-primary hover:text-primary/80">
                            <IconArrowLeft className="h-6 w-6" />
                        </Link>
                        <IconLock className="h-6 w-6 text-primary" />
                        <h2 className="text-xl font-bold dark:text-white">{t('security_company_details')}</h2>
                    </div>

                    <Link href={`/security-companies/edit/${company.id}`} className="btn btn-primary gap-2">
                        <IconEdit />
                        {t('edit_security_company')}
                    </Link>
                </div>

                {/* Breadcrumb */}
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Link href="/security-companies" className="text-primary hover:underline">
                        {t('security_companies')}
                    </Link>
                    <span className="mx-2">/</span>
                    <span>{company.name}</span>
                </div>
            </div>

            {/* Content */}
            <div className="px-5 pb-5">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Basic Information Card */}
                    <div className="panel">
                        <h5 className="text-lg font-semibold mb-4">{t('basic_information')}</h5>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <IconUser className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('security_company_name')}</p>
                                    <p className="font-semibold">{company.name}</p>
                                </div>
                            </div>

                            {company.tax_number && (
                                <div className="flex items-start gap-3">
                                    <IconClock className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('security_tax_number')}</p>
                                        <p className="font-semibold">{company.tax_number}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start gap-3">
                                <div className={`h-3 w-3 rounded-full mt-2 ${company.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('status')}</p>
                                    <p className={`font-semibold ${company.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>{company.status === 'active' ? t('active') : t('inactive')}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information Card */}
                    <div className="panel">
                        <h5 className="text-lg font-semibold mb-4">{t('contact_information')}</h5>
                        <div className="space-y-4">
                            {company.phone && (
                                <div className="flex items-start gap-3">
                                    <IconPhone className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('phone')}</p>
                                        <p className="font-semibold">{company.phone}</p>
                                    </div>
                                </div>
                            )}

                            {company.email && (
                                <div className="flex items-start gap-3">
                                    <IconMail className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('email')}</p>
                                        <p className="font-semibold">{company.email}</p>
                                    </div>
                                </div>
                            )}

                            {company.address && (
                                <div className="flex items-start gap-3">
                                    <IconMapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('address')}</p>
                                        <p className="font-semibold">{company.address}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Security Information Card */}
                    <div className="panel lg:col-span-2">
                        <h5 className="text-lg font-semibold mb-4">{t('security_information')}</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {company.license_types && (
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t('license_types')}</p>
                                    <p className="font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-lg">{company.license_types}</p>
                                </div>
                            )}

                            {company.weapon_types && (
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t('weapon_types')}</p>
                                    <p className="font-semibold bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-3 py-2 rounded-lg">{company.weapon_types}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notes Card */}
                    {company.notes && (
                        <div className="panel lg:col-span-2">
                            <h5 className="text-lg font-semibold mb-4">{t('notes')}</h5>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{company.notes}</p>
                        </div>
                    )}

                    {/* Timestamps Card */}
                    <div className="panel lg:col-span-2">
                        <h5 className="text-lg font-semibold mb-4">{t('timestamps')}</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-3">
                                <IconCalendar className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('created_at')}</p>
                                    <p className="font-semibold">
                                        {new Date(company.created_at).toLocaleDateString('tr-TR')} {new Date(company.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <IconClock className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('updated_at')}</p>
                                    <p className="font-semibold">
                                        {new Date(company.updated_at).toLocaleDateString('tr-TR')} {new Date(company.updated_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecurityCompanyPreview;
