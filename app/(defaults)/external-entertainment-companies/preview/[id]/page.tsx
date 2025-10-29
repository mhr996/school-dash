'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Components
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconEdit from '@/components/icon/icon-edit';
import IconCalendar from '@/components/icon/icon-calendar';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import ServiceBalanceTab from '@/components/service-balance/service-balance-tab';
import EntertainmentCompanyTabs from '@/components/entertainment/entertainment-company-tabs';
import RatingsDisplay from '@/components/ratings/ratings-display';

import { getTranslation } from '@/i18n';

interface EntertainmentCompany {
    id: string;
    created_at: string;
    updated_at: string;
    name: string;
    image?: string;
    description?: string;
    price?: number;
    status?: string;
}

// Helper function to get proper image URL
const getImageUrl = (image: string | undefined, supabase: any): string => {
    if (!image) return '/assets/images/img-placeholder-fallback.webp';

    // If it's already a full URL (starts with http), return as is
    if (image.startsWith('http')) return image;

    // If it starts with /entertainment-companies/, it's an old relative path
    if (image.startsWith('/entertainment-companies/')) {
        const path = image.replace('/entertainment-companies/', '');
        const {
            data: { publicUrl },
        } = supabase.storage.from('entertainment-companies').getPublicUrl(path);
        return publicUrl;
    }

    // Otherwise assume it's a direct path in the bucket
    const {
        data: { publicUrl },
    } = supabase.storage.from('entertainment-companies').getPublicUrl(image);
    return publicUrl;
};

const EntertainmentCompanyPreview = () => {
    const { t } = getTranslation();
    const params = useParams();
    const companyId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [company, setCompany] = useState<EntertainmentCompany | null>(null);
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

    const supabase = createClientComponentClient();

    useEffect(() => {
        const fetchEntertainmentCompany = async () => {
            try {
                setLoading(true);

                const { data, error } = await supabase.from('external_entertainment_companies').select('*').eq('id', companyId).single();

                if (error) {
                    console.error('Error fetching entertainment company:', error);
                    setAlert({ message: t('error_loading_entertainment_company'), type: 'danger' });
                    return;
                }

                setCompany(data as EntertainmentCompany);
            } catch (error) {
                console.error('Error fetching entertainment company:', error);
                setAlert({ message: t('error_loading_entertainment_company'), type: 'danger' });
            } finally {
                setLoading(false);
            }
        };

        if (companyId) {
            fetchEntertainmentCompany();
        }
    }, [companyId]);

    const handleCompanyUpdate = () => {
        // Re-fetch the company data when tabs update it
        const fetchEntertainmentCompany = async () => {
            try {
                const { data, error } = await supabase.from('external_entertainment_companies').select('*').eq('id', companyId).single();

                if (error) {
                    console.error('Error fetching entertainment company:', error);
                    return;
                }

                setCompany(data as EntertainmentCompany);
            } catch (error) {
                console.error('Error fetching entertainment company:', error);
            }
        };

        fetchEntertainmentCompany();
    };

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
                        <h2 className="text-xl font-semibold text-gray-600 mb-2">{t('no_entertainment_companies_found')}</h2>
                        <Link href="/external-entertainment-companies" className="btn btn-primary">
                            {t('external_entertainment_companies')}
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
                <Link href="/external-entertainment-companies" className="text-primary hover:text-primary/80">
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
                        <Link href="/external-entertainment-companies" className="text-primary hover:underline">
                            {t('external_entertainment_companies')}
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
                    <h1 className="text-3xl font-bold">{company.name}</h1>
                </div>
            </div>

            {alert && (
                <div className="fixed top-4 right-4 z-50 min-w-80 max-w-md">
                    <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert(null)} />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - Tabbed Interface */}
                <div className="lg:col-span-2 space-y-6">
                    <EntertainmentCompanyTabs
                        companyId={companyId}
                        companyData={{
                            name: company.name,
                            description: company.description || '',
                            price: company.price || 0,
                            image: company.image || '',
                            status: company.status || 'active',
                        }}
                        onUpdate={handleCompanyUpdate}
                        isServiceProvider={false}
                    />

                    {/* Balance Section */}
                    <div>
                        <ServiceBalanceTab serviceType="external_entertainment_companies" serviceId={company.id} />
                    </div>

                    {/* Ratings Section */}
                    <div className="panel">
                        <RatingsDisplay serviceType="external_entertainment_companies" serviceId={company.id} t={t} />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
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

export default EntertainmentCompanyPreview;
