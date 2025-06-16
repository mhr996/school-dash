'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import supabase from '@/lib/supabase';
import { getTranslation } from '@/i18n';
import IconDollarSign from '@/components/icon/icon-dollar-sign';
import IconUser from '@/components/icon/icon-user';
import IconMenuWidgets from '@/components/icon/menu/icon-menu-widgets';
import IconEdit from '@/components/icon/icon-edit';
import IconPrinter from '@/components/icon/icon-printer';

interface Deal {
    id: string;
    title: string;
    deal_type: string;
    amount: number;
    customer_id: string;
    customer?: {
        name: string;
        phone: string;
        identity_number: string;
    };
    car_id: string;
    car?: {
        title: string;
        brand: string;
        year: number;
    };
}

interface Bill {
    id: string;
    deal_id: string;
    bill_type: string;
    customer_name: string;
    amount: number;
    commission: number;
    tax_amount: number;
    total_amount: number;
    status: string;
    created_at: string;
    bill_data: any;
    deal?: Deal;
}

const BillPreview = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const params = useParams();
    const billId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [bill, setBill] = useState<Bill | null>(null);

    useEffect(() => {
        fetchBill();
    }, [billId]);

    const fetchBill = async () => {
        try {
            const { data, error } = await supabase
                .from('bills')
                .select(
                    `
                    *,
                    deal:deals(
                        *,
                        customer:customers(*),
                        car:cars(*)
                    )
                `,
                )
                .eq('id', billId)
                .single();

            if (error) throw error;
            setBill(data);
        } catch (error) {
            console.error('Error fetching bill:', error);
        } finally {
            setLoading(false);
        }
    };

    const getBillTypeLabel = (type: string) => {
        switch (type) {
            case 'tax_invoice':
                return t('tax_invoice_only');
            case 'receipt_only':
                return t('receipt_only');
            case 'tax_invoice_receipt':
                return t('tax_invoice_and_receipt');
            default:
                return type;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
                return 'text-green-600 bg-green-100';
            case 'pending':
                return 'text-yellow-600 bg-yellow-100';
            case 'overdue':
                return 'text-red-600 bg-red-100';
            default:
                return 'text-blue-600 bg-blue-100';
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!bill) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600">{t('bill_not_found')}</h1>
                    <Link href="/bills" className="btn btn-primary mt-4">
                        {t('back_to_bills')}
                    </Link>
                </div>
            </div>
        );
    }

    const invoiceData = bill.bill_data?.invoice;
    const receiptData = bill.bill_data?.receipt;

    return (
        <div className="container mx-auto p-6">
            {/* Header - Hide when printing */}
            <div className="print:hidden mb-6">
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
                            <Link href="/bills" className="text-primary hover:underline">
                                {t('bills')}
                            </Link>
                        </li>
                        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                            <span>{t('bill_preview')}</span>
                        </li>
                    </ul>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">{t('bill_preview')}</h1>
                        <p className="text-gray-500">{t('view_bill_details')}</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handlePrint} className="btn btn-outline-primary gap-2">
                            <IconPrinter className="w-4 h-4" />
                            {t('print')}
                        </button>
                        <Link href={`/bills/edit/${bill.id}`} className="btn btn-primary gap-2">
                            <IconEdit className="w-4 h-4" />
                            {t('edit')}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Bill Content */}
            <div className="space-y-6">
                {/* Bill Header */}
                <div className="panel">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h2 className="text-xl font-bold text-primary mb-4">{t('bill_information')}</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('bill_id')}:</span>
                                    <span className="font-medium">#{bill.id.slice(-8).toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('bill_type')}:</span>
                                    <span className="badge badge-outline-info">{getBillTypeLabel(bill.bill_type)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('status')}:</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>{t(`bill_status_${bill.status}`)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('created_at')}:</span>
                                    <span className="font-medium">{new Date(bill.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-primary mb-4">{t('associated_deal')}</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('deal_title')}:</span>
                                    <span className="font-medium">{bill.deal?.title}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('deal_type')}:</span>
                                    <span className="font-medium">{t(`deal_type_${bill.deal?.deal_type}`)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('customer')}:</span>
                                    <span className="font-medium">{bill.deal?.customer?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('car')}:</span>
                                    <span className="font-medium">
                                        {bill.deal?.car?.brand} {bill.deal?.car?.title}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="panel">
                    <h2 className="text-xl font-bold text-primary mb-4">{t('financial_summary')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                                {new Intl.NumberFormat('ar-AE', {
                                    style: 'currency',
                                    currency: 'AED',
                                }).format(bill.amount)}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{t('base_amount')}</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                                {new Intl.NumberFormat('ar-AE', {
                                    style: 'currency',
                                    currency: 'AED',
                                }).format(bill.commission || 0)}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{t('commission')}</div>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-600">
                                {new Intl.NumberFormat('ar-AE', {
                                    style: 'currency',
                                    currency: 'AED',
                                }).format(bill.tax_amount)}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{t('tax_amount')}</div>
                        </div>
                        <div className="text-center p-4 bg-primary/10 rounded-lg">
                            <div className="text-2xl font-bold text-primary">
                                {new Intl.NumberFormat('ar-AE', {
                                    style: 'currency',
                                    currency: 'AED',
                                }).format(bill.total_amount)}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{t('total_amount')}</div>
                        </div>
                    </div>
                </div>

                {/* Tax Invoice Details */}
                {invoiceData && (
                    <div className="panel">
                        <div className="mb-5 flex items-center gap-3">
                            <IconUser className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-bold text-primary">{t('tax_invoice_details')}</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('customer_name')}</label>
                                <p className="text-sm text-gray-900 dark:text-white">{invoiceData.customer_name}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('identity_number')}</label>
                                <p className="text-sm text-gray-900 dark:text-white">{invoiceData.identity_number || t('not_provided')}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('phone')}</label>
                                <p className="text-sm text-gray-900 dark:text-white">{invoiceData.phone || t('not_provided')}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('date')}</label>
                                <p className="text-sm text-gray-900 dark:text-white">{new Date(invoiceData.date).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('car_details')}</label>
                                <p className="text-sm text-gray-900 dark:text-white">{invoiceData.car_details}</p>
                            </div>
                            {invoiceData.free_text && (
                                <div className="md:col-span-2 lg:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('free_text')}</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{invoiceData.free_text}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Receipt Details */}
                {receiptData && receiptData.payment_type && (
                    <div className="panel">
                        <div className="mb-5 flex items-center gap-3">
                            <IconDollarSign className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-bold text-primary">{t('receipt_details')}</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('payment_type')}</label>
                                <p className="text-sm text-gray-900 dark:text-white">{t(receiptData.payment_type)}</p>
                            </div>

                            {receiptData.payment_type === 'visa' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('visa_amount')}</label>
                                        <p className="text-sm text-gray-900 dark:text-white">
                                            {new Intl.NumberFormat('ar-AE', {
                                                style: 'currency',
                                                currency: 'AED',
                                            }).format(parseFloat(receiptData.visa_amount) || 0)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('visa_installments')}</label>
                                        <p className="text-sm text-gray-900 dark:text-white">{receiptData.visa_installments}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('visa_card_type')}</label>
                                        <p className="text-sm text-gray-900 dark:text-white">{receiptData.visa_card_type}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('visa_last_four')}</label>
                                        <p className="text-sm text-gray-900 dark:text-white">****{receiptData.visa_last_four}</p>
                                    </div>
                                </>
                            )}

                            {receiptData.payment_type === 'bank_transfer' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('bank_amount')}</label>
                                        <p className="text-sm text-gray-900 dark:text-white">
                                            {new Intl.NumberFormat('ar-AE', {
                                                style: 'currency',
                                                currency: 'AED',
                                            }).format(parseFloat(receiptData.bank_amount) || 0)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('bank_name')}</label>
                                        <p className="text-sm text-gray-900 dark:text-white">{receiptData.bank_name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('bank_branch')}</label>
                                        <p className="text-sm text-gray-900 dark:text-white">{receiptData.bank_branch}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('account_number')}</label>
                                        <p className="text-sm text-gray-900 dark:text-white">{receiptData.account_number}</p>
                                    </div>
                                </>
                            )}

                            {receiptData.payment_type === 'check' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('check_amount')}</label>
                                        <p className="text-sm text-gray-900 dark:text-white">
                                            {new Intl.NumberFormat('ar-AE', {
                                                style: 'currency',
                                                currency: 'AED',
                                            }).format(parseFloat(receiptData.check_amount) || 0)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('check_number')}</label>
                                        <p className="text-sm text-gray-900 dark:text-white">{receiptData.check_number}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('check_bank_name')}</label>
                                        <p className="text-sm text-gray-900 dark:text-white">{receiptData.check_bank_name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('check_holder_name')}</label>
                                        <p className="text-sm text-gray-900 dark:text-white">{receiptData.check_holder_name}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BillPreview;
