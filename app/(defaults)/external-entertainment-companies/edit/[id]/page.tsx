'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import supabase from '@/lib/supabase';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import { getTranslation } from '@/i18n';
import EntertainmentCompanyTabs from '@/components/entertainment/entertainment-company-tabs';

interface EntertainmentCompanyForm {
    name: string;
    image: string;
    description: string;
    price: number;
    status: string;
}

export default function EditEntertainmentCompany() {
    const { t } = getTranslation();
    const router = useRouter();
    const params = useParams();
    const companyId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [companyData, setCompanyData] = useState<EntertainmentCompanyForm>({
        name: '',
        image: '',
        description: '',
        price: 0,
        status: 'active',
    });

    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({
        visible: false,
        message: '',
        type: 'success',
    });

    useEffect(() => {
        const fetchEntertainmentCompany = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase.from('external_entertainment_companies').select('*').eq('id', companyId).single();

                if (error) {
                    console.error('Error fetching entertainment company:', error);
                    setAlert({ visible: true, message: t('error_loading_entertainment_company'), type: 'danger' });
                    return;
                }

                if (data) {
                    setCompanyData({
                        name: data.name || '',
                        image: data.image || '',
                        description: data.description || '',
                        price: data.price || 0,
                        status: data.status || 'active',
                    });
                }
            } catch (error) {
                console.error('Error fetching entertainment company:', error);
                setAlert({ visible: true, message: t('error_loading_entertainment_company'), type: 'danger' });
            } finally {
                setLoading(false);
            }
        };

        if (companyId) {
            fetchEntertainmentCompany();
        }
    }, [companyId]);

    const handleCompanyUpdate = async () => {
        // Re-fetch the company data when tabs update it
        try {
            const { data, error } = await supabase.from('external_entertainment_companies').select('*').eq('id', companyId).single();

            if (error) {
                console.error('Error fetching entertainment company:', error);
                return;
            }

            if (data) {
                setCompanyData({
                    name: data.name || '',
                    image: data.image || '',
                    description: data.description || '',
                    price: data.price || 0,
                    status: data.status || 'active',
                });
            }
        } catch (error) {
            console.error('Error fetching entertainment company:', error);
        }
    };

    if (loading) {
        return (
            <div className="panel border-white-light px-0 dark:border-[#1b2e4b]">
                <div className="px-5 py-10 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="mt-4 text-gray-500">{t('loading')}</p>
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
                        <span>{t('edit_entertainment_company')}</span>
                    </li>
                </ul>
            </div>

            {/* Title */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold">{t('edit_entertainment_company')}</h1>
                <p className="text-gray-500 mt-2">{t('edit_entertainment_company_description')}</p>
            </div>

            {/* Alerts */}
            {alert.visible && (
                <div className="fixed top-4 right-4 z-50 min-w-80 max-w-md">
                    <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert({ ...alert, visible: false })} />
                </div>
            )}

            {/* Tabbed Interface */}
            <EntertainmentCompanyTabs companyId={companyId} companyData={companyData} onUpdate={handleCompanyUpdate} isServiceProvider={false} />
        </div>
    );
}
