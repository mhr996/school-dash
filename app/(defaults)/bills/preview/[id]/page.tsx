'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import supabase from '@/lib/supabase';
import { getTranslation } from '@/i18n';
import IconDollarSign from '@/components/icon/icon-dollar-sign';
import IconUser from '@/components/icon/icon-user';
import IconEdit from '@/components/icon/icon-edit';
import IconDownload from '@/components/icon/icon-download';
import { generateBillPDF } from '@/utils/pdf-generator';

interface Deal {
    id: string;
    title: string;
    deal_type: string;
    amount: number;
    customer_id: string;
    customer?: {
        name: string;
        phone: string;
        id_number: string;
    };
    car_id: string;
    car?: {
        id: number;
        title: string;
        brand: string;
        year: number;
        car_number?: string;
        buy_price?: number;
        sale_price?: number;
    };  
}

interface Bill {
    id: string;
    deal_id: string;
    bill_type: string;
    status: string;
    customer_name: string;
    phone?: string;
    date?: string;
    car_details?: string;
    sale_price?: number;
    commission?: number;
    free_text?: string;
    total?: number;
    tax_amount?: number;
    total_with_tax?: number;
    payment_type?: string;
    visa_amount?: number;
    visa_installments?: number;
    visa_card_type?: string;
    visa_last_four?: string;
    bank_amount?: number;
    bank_name?: string;
    bank_branch?: string;
    account_number?: string;
    transfer_number?: string;
    transfer_holder_name?: string;
    transfer_amount?: number;
    transfer_bank_name?: string;
    transfer_branch?: string;
    transfer_account_number?: string;
    transfer_branch_number?: string;
    check_amount?: number;
    check_bank_name?: string;
    check_branch_number?: string;
    check_account_number?: string;
    check_number?: string;
    check_holder_name?: string;
    check_branch?: string;
    created_at: string;
    deal?: Deal;
}

const BillPreview = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const params = useParams();
    const billId = params?.id as string;
    const [loading, setLoading] = useState(true);
    const [bill, setBill] = useState<Bill | null>(null);
    const [downloadingPDF, setDownloadingPDF] = useState(false);

    useEffect(() => {
        fetchBill();
    }, [billId]);

    const fetchBill = async () => {
        try {
            const { data, error } = await supabase
                .from('bills')
                .select(
                    `
                    *,                    deal:deals(
                        *,
                        customer:customers!deals_customer_id_fkey(*),
                        car:cars!deals_car_id_fkey(*)
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

    const handleDownloadPDF = async () => {
        if (!bill) return;

        setDownloadingPDF(true);
        try {
            await generateBillPDF(bill, {
                filename: `bill-${bill.id}-${bill.customer_name.replace(/\s+/g, '-').toLowerCase()}.pdf`,
            });
        } catch (error) {
            console.error('Error generating PDF:', error);
            // You might want to show an error notification here
        } finally {
            setDownloadingPDF(false);
        }
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
                        <button onClick={handleDownloadPDF} disabled={downloadingPDF} className="btn btn-outline-primary gap-2">
                            <IconDownload className="w-4 h-4" />
                            {downloadingPDF ? t('generating_pdf') : t('download_pdf')}
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
                                    <span className="font-medium">#{bill.id}</span>
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
                {/* Deal Summary Table (تفاصيل الفاتورة الضريبية) */}
                {bill.deal && bill.deal.car && (
                    <div className="panel">
                        <div className="mb-5 flex items-center gap-3">
                            <IconDollarSign className="w-5 h-5 text-primary" />
                            <h5 className="text-lg font-semibold dark:text-white-light">تفاصيل الفاتورة الضريبية</h5>
                        </div>
                        <div className="bg-transparent rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            {/* Table Header */}
                            <div className="grid grid-cols-4 gap-4 mb-4 pb-2 border-b border-gray-300 dark:border-gray-600">
                                <div className="text-sm font-bold text-gray-700 dark:text-white text-right">{t('deal_item')}</div>
                                <div className="text-sm font-bold text-gray-700 dark:text-white text-center">{t('deal_price')}</div>
                                <div className="text-sm font-bold text-gray-700 dark:text-white text-center">{t('deal_quantity')}</div>
                                <div className="text-sm font-bold text-gray-700 dark:text-white text-center">{t('deal_total')}</div>
                            </div>

                            {/* Render table based on deal type */}
                            {(bill.deal.deal_type === 'new_used_sale' || bill.deal.deal_type === 'new_used_sale_tax_inclusive') && (
                                <>
                                    {/* Row 1: Car for Sale */}
                                    <div className="grid grid-cols-4 gap-4 mb-3 py-2">
                                        <div className="text-sm text-gray-700 dark:text-gray-300 text-right">
                                            <div className="font-medium">{t('car_for_sale')}</div>
                                            <div className="text-xs text-gray-500">
                                                {bill.deal.car.brand} {bill.deal.car.title} - {bill.deal.car.year}
                                                {bill.deal.car.car_number && ` - ${bill.deal.car.car_number}`} - #{bill.deal.car.id}
                                            </div>
                                        </div>
                                        <div className="text-center">-</div>
                                        <div className="text-center">-</div>
                                        <div className="text-center">-</div>
                                    </div>

                                    {/* Row 2: Buy Price */}
                                    <div className="grid grid-cols-4 gap-4 mb-3 py-2">
                                        <div className="text-sm text-gray-700 dark:text-gray-300 text-right">{t('buy_price_auto')}</div>
                                        <div className="text-center">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">${bill.deal.car.buy_price?.toFixed(2) || '0.00'}</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">1</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">${bill.deal.car.buy_price?.toFixed(2) || '0.00'}</span>
                                        </div>
                                    </div>

                                    {/* Row 3: Selling Price */}
                                    <div className="grid grid-cols-4 gap-4 mb-3 py-2">
                                        <div className="text-sm text-gray-700 dark:text-gray-300 text-right">{t('selling_price_manual')}</div>
                                        <div className="text-center">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">${bill.deal.amount?.toFixed(2) || '0.00'}</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">1</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">${bill.deal.amount?.toFixed(2) || '0.00'}</span>
                                        </div>
                                    </div>

                                    {/* Row 4: Loss */}
                                    <div className="grid grid-cols-4 gap-4 mb-3 py-2">
                                        <div className="text-sm text-gray-700 dark:text-gray-300 text-right">{t('loss_amount')}</div>
                                        <div className="text-center">-</div>
                                        <div className="text-center">-</div>
                                        <div className="text-center">
                                            <span className="text-sm text-red-600 dark:text-red-400">${Math.max(0, (bill.deal.car.buy_price || 0) - (bill.deal.amount || 0)).toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* Row 5: Profit Commission */}
                                    <div className="grid grid-cols-4 gap-4 mb-4 py-2">
                                        <div className="text-sm text-gray-700 dark:text-gray-300 text-right">{t('profit_commission')}</div>
                                        <div className="text-center">-</div>
                                        <div className="text-center">-</div>
                                        <div className="text-center">
                                            <span className="text-sm text-green-600 dark:text-green-400">${Math.max(0, (bill.deal.amount || 0) - (bill.deal.car.buy_price || 0)).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </>
                            )}

                            {bill.deal.deal_type === 'intermediary' && (
                                <>
                                    {/* Row 1: Car Brokerage Commission */}
                                    <div className="grid grid-cols-4 gap-4 mb-3 py-2">
                                        <div className="text-sm text-gray-700 dark:text-gray-300 text-right">
                                            <div className="font-medium">{t('intermediary_car_commission')}</div>
                                            <div className="text-xs text-gray-500">
                                                {bill.deal.car.brand} {bill.deal.car.title} - {bill.deal.car.year}
                                                {bill.deal.car.car_number && ` - ${bill.deal.car.car_number}`} - #{bill.deal.car.id}
                                            </div>
                                        </div>
                                        <div className="text-center">-</div>
                                        <div className="text-center">-</div>
                                        <div className="text-center">-</div>
                                    </div>

                                    {/* Row 2: Profit Commission */}
                                    <div className="grid grid-cols-4 gap-4 mb-4 py-2">
                                        <div className="text-sm text-gray-700 dark:text-gray-300 text-right">{t('profit_commission')}</div>
                                        <div className="text-center">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">${bill.deal.amount?.toFixed(2) || '0.00'}</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">1</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-sm text-green-600 dark:text-green-400">${bill.deal.amount?.toFixed(2) || '0.00'}</span>
                                        </div>
                                    </div>
                                </>
                            )}

                            {bill.deal.deal_type === 'financing_assistance_intermediary' && (
                                <>
                                    {/* Row 1: Financing Assistance Commission */}
                                    <div className="grid grid-cols-4 gap-4 mb-3 py-2">
                                        <div className="text-sm text-gray-700 dark:text-gray-300 text-right">
                                            <div className="font-medium">{t('financing_assistance_commission')}</div>
                                            <div className="text-xs text-gray-500">
                                                {bill.deal.car.brand} {bill.deal.car.title} - {bill.deal.car.year}
                                                {bill.deal.car.car_number && ` - ${bill.deal.car.car_number}`} - #{bill.deal.car.id}
                                            </div>
                                        </div>
                                        <div className="text-center">-</div>
                                        <div className="text-center">-</div>
                                        <div className="text-center">-</div>
                                    </div>

                                    {/* Row 2: Commission */}
                                    <div className="grid grid-cols-4 gap-4 mb-4 py-2">
                                        <div className="text-sm text-gray-700 dark:text-gray-300 text-right">{t('commission_editable')}</div>
                                        <div className="text-center">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">${bill.deal.amount?.toFixed(2) || '0.00'}</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">1</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-sm text-green-600 dark:text-green-400">${bill.deal.amount?.toFixed(2) || '0.00'}</span>
                                        </div>
                                    </div>
                                </>
                            )}

                            {bill.deal.deal_type === 'exchange' && (
                                <>
                                    {/* Row 1: Car for Sale */}
                                    <div className="grid grid-cols-4 gap-4 mb-3 py-2">
                                        <div className="text-sm text-gray-700 dark:text-gray-300 text-right">
                                            <div className="font-medium">{t('car_for_sale')}</div>
                                            <div className="text-xs text-gray-500">
                                                {bill.deal.car.brand} {bill.deal.car.title} - {bill.deal.car.year}
                                                {bill.deal.car.car_number && ` - ${bill.deal.car.car_number}`} - #{bill.deal.car.id}
                                            </div>
                                        </div>
                                        <div className="text-center">-</div>
                                        <div className="text-center">-</div>
                                        <div className="text-center">-</div>
                                    </div>

                                    {/* Row 2: Buy Price */}
                                    <div className="grid grid-cols-4 gap-4 mb-3 py-2">
                                        <div className="text-sm text-gray-700 dark:text-gray-300 text-right">{t('buy_price_auto')}</div>
                                        <div className="text-center">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">${bill.deal.car.buy_price?.toFixed(2) || '0.00'}</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">1</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">${bill.deal.car.buy_price?.toFixed(2) || '0.00'}</span>
                                        </div>
                                    </div>

                                    {/* Row 3: Selling Price */}
                                    <div className="grid grid-cols-4 gap-4 mb-3 py-2">
                                        <div className="text-sm text-gray-700 dark:text-gray-300 text-right">{t('selling_price_manual')}</div>
                                        <div className="text-center">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">${bill.deal.car.sale_price?.toFixed(2) || '0.00'}</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">1</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">${bill.deal.car.sale_price?.toFixed(2) || '0.00'}</span>
                                        </div>
                                    </div>

                                    {/* Row 4: Customer Car Evaluation */}
                                    <div className="grid grid-cols-4 gap-4 mb-3 py-2">
                                        <div className="text-sm text-gray-700 dark:text-gray-300 text-right">
                                            <div className="font-medium">{t('customer_car_evaluation')}</div>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">${bill.deal.amount?.toFixed(2) || '0.00'}</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">1</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">${bill.deal.amount?.toFixed(2) || '0.00'}</span>
                                        </div>
                                    </div>

                                    {/* Row 5: Additional Customer Amount */}
                                    <div className="grid grid-cols-4 gap-4 mb-4 py-2">
                                        <div className="text-sm text-gray-700 dark:text-gray-300 text-right">{t('additional_customer_amount')}</div>
                                        <div className="text-center">-</div>
                                        <div className="text-center">-</div>
                                        <div className="text-center">
                                            <span className="text-sm text-blue-600 dark:text-blue-400">${Math.max(0, (bill.deal.car.sale_price || 0) - (bill.deal.amount || 0)).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </>
                            )}

                            {bill.deal.deal_type === 'company_commission' && (
                                <>
                                    {/* Row 1: Company Commission */}
                                    <div className="grid grid-cols-4 gap-4 mb-4 py-2">
                                        <div className="text-sm text-gray-700 dark:text-gray-300 text-right">
                                            <div className="font-medium">{t('company_commission')}</div>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">${bill.deal.amount?.toFixed(2) || '0.00'}</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">1</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-sm text-green-600 dark:text-green-400">${bill.deal.amount?.toFixed(2) || '0.00'}</span>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Separator */}
                            <div className="border-t border-gray-300 dark:border-gray-600 my-4"></div>

                            {/* Tax Calculations */}
                            <div className="space-y-3">
                                {/* Price Before Tax - calculated by removing 18% tax from deal amount */}
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('price_before_tax')}</span>
                                    <span className="text-sm text-gray-700 dark:text-gray-300">${((bill.deal.amount || 0) / 1.18).toFixed(2)}</span>
                                </div>

                                {/* Tax - calculated as 18% of the price before tax */}
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('deal_tax')} 18%</span>
                                    <span className="text-sm text-gray-700 dark:text-gray-300">${(((bill.deal.amount || 0) / 1.18) * 0.18).toFixed(2)}</span>
                                </div>

                                {/* Total Including Tax - this is the deal amount which already includes tax */}
                                <div className="flex justify-between items-center pt-2 border-t border-gray-300 dark:border-gray-600">
                                    <span className="text-lg font-bold text-gray-700 dark:text-gray-300">{t('total_including_tax')}</span>
                                    <span className="text-lg font-bold text-primary">${bill.deal.amount?.toFixed(2) || '0.00'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tax Invoice Details */}
                {(bill.bill_type === 'tax_invoice' || bill.bill_type === 'tax_invoice_receipt') && (
                    <div className="panel">
                        <div className="mb-5 flex items-center gap-3">
                            <IconUser className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-bold text-primary">{t('tax_invoice_details')}</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('customer_name')}</label>
                                <p className="text-sm text-gray-900 dark:text-white">{bill.customer_name}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('phone')}</label>
                                <p className="text-sm text-gray-900 dark:text-white">{bill.phone || t('not_provided')}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('date')}</label>
                                <p className="text-sm text-gray-900 dark:text-white">{bill.date ? new Date(bill.date).toLocaleDateString() : t('not_provided')}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('car_details')}</label>
                                <p className="text-sm text-gray-900 dark:text-white">{bill.car_details || t('not_provided')}</p>
                            </div>
                            {bill.free_text && (
                                <div className="md:col-span-2 lg:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('free_text')}</label>
                                    <p className="text-sm text-gray-900 dark:text-white">{bill.free_text}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {/* Receipt Details */}
                {(bill.bill_type === 'receipt_only' || bill.bill_type === 'tax_invoice_receipt') && bill.payment_type && (
                    <div className="panel">
                        <div className="mb-5 flex items-center gap-3">
                            <IconDollarSign className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-bold text-primary">{t('receipt_details')}</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('payment_type')}</label>
                                <p className="text-sm text-gray-900 dark:text-white">{t(bill.payment_type)}</p>
                            </div>

                            {bill.payment_type === 'visa' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('visa_amount')}</label>
                                        <p className="text-sm text-gray-900 dark:text-white">${new Intl.NumberFormat('en-US').format(bill.visa_amount || 0)}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('visa_installments')}</label>
                                        <p className="text-sm text-gray-900 dark:text-white">{bill.visa_installments || t('not_provided')}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('visa_card_type')}</label>
                                        <p className="text-sm text-gray-900 dark:text-white">{bill.visa_card_type || t('not_provided')}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('visa_last_four')}</label>
                                        <p className="text-sm text-gray-900 dark:text-white">{bill.visa_last_four ? `****${bill.visa_last_four}` : t('not_provided')}</p>
                                    </div>
                                </>
                            )}

                            {bill.payment_type === 'bank_transfer' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('bank_amount')}</label>
                                        <p className="text-sm text-gray-900 dark:text-white">${new Intl.NumberFormat('en-US').format(bill.bank_amount || 0)}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('bank_name')}</label>
                                        <p className="text-sm text-gray-900 dark:text-white">{bill.bank_name || t('not_provided')}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('bank_branch')}</label>
                                        <p className="text-sm text-gray-900 dark:text-white">{bill.bank_branch || t('not_provided')}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('account_number')}</label>
                                        <p className="text-sm text-gray-900 dark:text-white">{bill.account_number || t('not_provided')}</p>
                                    </div>
                                </>
                            )}

                            {bill.payment_type === 'check' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('check_amount')}</label>
                                        <p className="text-sm text-gray-900 dark:text-white">${new Intl.NumberFormat('en-US').format(bill.check_amount || 0)}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('check_number')}</label>
                                        <p className="text-sm text-gray-900 dark:text-white">{bill.check_number || t('not_provided')}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('check_bank_name')}</label>
                                        <p className="text-sm text-gray-900 dark:text-white">{bill.check_bank_name || t('not_provided')}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('check_holder_name')}</label>
                                        <p className="text-sm text-gray-900 dark:text-white">{bill.check_holder_name || t('not_provided')}</p>
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
