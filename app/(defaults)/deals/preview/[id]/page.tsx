'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import supabase from '@/lib/supabase';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import { getTranslation } from '@/i18n';
import IconEdit from '@/components/icon/icon-edit';
import IconCalendar from '@/components/icon/icon-calendar';
import IconDollarSign from '@/components/icon/icon-dollar-sign';

interface Deal {
    id: string;
    created_at: string;
    deal_type: string;
    title: string;
    description: string;
    amount: number;
    status: string;
    customer_id?: string;
    customer_name?: string;
}

const PreviewDeal = ({ params }: { params: { id: string } }) => {
    const { t } = getTranslation();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [deal, setDeal] = useState<Deal | null>(null);
    const dealId = params.id;

    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({
        visible: false,
        message: '',
        type: 'success',
    });

    useEffect(() => {
        const fetchDeal = async () => {
            try {
                const { data, error } = await supabase.from('deals').select('*').eq('id', dealId).single();

                if (error) throw error;

                if (data) {
                    setDeal(data);
                }
            } catch (error) {
                console.error('Error fetching deal:', error);
                setAlert({ visible: true, message: t('error_loading_data'), type: 'danger' });
            } finally {
                setLoading(false);
            }
        };

        if (dealId) {
            fetchDeal();
        }
    }, [dealId]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const getDealTypeBadgeClass = (type: string) => {
        switch (type) {
            case 'new_used_sale':
                return 'badge-outline-success';
            case 'exchange':
                return 'badge-outline-primary';
            case 'intermediary':
                return 'badge-outline-warning';
            case 'company_commission':
                return 'badge-outline-info';
            default:
                return 'badge-outline-secondary';
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'active':
                return 'badge-outline-success';
            case 'completed':
                return 'badge-outline-primary';
            case 'cancelled':
                return 'badge-outline-danger';
            default:
                return 'badge-outline-secondary';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!deal) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('deal_not_found')}</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">{t('deal_not_found_description')}</p>
                    <Link href="/deals" className="btn btn-primary mt-4">
                        {t('back_to_deals')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center gap-5 mb-6">
                <div onClick={() => router.back()}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mb-4 cursor-pointer text-primary rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </div>
                {/* Breadcrumb Navigation */}
                <ul className="flex space-x-2 rtl:space-x-reverse mb-4">
                    <li>
                        <Link href="/" className="text-primary hover:underline">
                            {t('home')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <Link href="/deals" className="text-primary hover:underline">
                            {t('deals')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <span>{t('deal_details')}</span>
                    </li>
                </ul>
            </div>

            {alert.visible && (
                <div className="mb-6">
                    <Alert
                        type={alert.type}
                        title={alert.type === 'success' ? t('success') : t('error')}
                        message={alert.message}
                        onClose={() => setAlert({ visible: false, message: '', type: 'success' })}
                    />
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">{deal.title}</h1>
                    <p className="text-gray-500">#{deal.id}</p>
                </div>
                <Link href={`/deals/edit/${deal.id}`} className="btn btn-primary gap-2">
                    <IconEdit className="w-4 h-4" />
                    {t('edit_deal')}
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Deal Information */}
                    <div className="panel">
                        <div className="mb-5">
                            <h5 className="text-lg font-semibold dark:text-white-light">{t('deal_information')}</h5>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">{t('deal_type')}</label>
                                <span className={`badge ${getDealTypeBadgeClass(deal.deal_type)} text-lg px-4 py-2`}>{t(`deal_type_${deal.deal_type}`)}</span>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">{t('deal_title')}</label>
                                <p className="text-gray-900 dark:text-white text-lg font-medium">{deal.title}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2">{t('description')}</label>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{deal.description}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Status & Amount */}
                    <div className="panel">
                        <div className="mb-5">
                            <h5 className="text-lg font-semibold dark:text-white-light">{t('deal_summary')}</h5>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-gray-400">{t('status')}</span>
                                <span className={`badge ${getStatusBadgeClass(deal.status)}`}>{t(`status_${deal.status}`)}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-gray-400">{t('amount')}</span>
                                <div className="flex items-center gap-2">
                                    <IconDollarSign className="w-4 h-4 text-success" />
                                    <span className="text-lg font-bold text-success">{formatCurrency(deal.amount)}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-gray-400">{t('created_date')}</span>
                                <div className="flex items-center gap-2">
                                    <IconCalendar className="w-4 h-4 text-primary" />
                                    <span>{new Date(deal.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer Information */}
                    {deal.customer_name && (
                        <div className="panel">
                            <div className="mb-5">
                                <h5 className="text-lg font-semibold dark:text-white-light">{t('customer_information')}</h5>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">{t('customer_name')}</span>
                                    <p className="font-medium">{deal.customer_name}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="panel">
                        <div className="mb-5">
                            <h5 className="text-lg font-semibold dark:text-white-light">{t('actions')}</h5>
                        </div>

                        <div className="space-y-3">
                            <Link href={`/deals/edit/${deal.id}`} className="btn btn-primary w-full gap-2">
                                <IconEdit className="w-4 h-4" />
                                {t('edit_deal')}
                            </Link>
                            <Link href="/deals" className="btn btn-outline-secondary w-full">
                                {t('back_to_deals')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreviewDeal;
