'use client';
import React, { useState, useEffect } from 'react';
import { getTranslation } from '@/i18n';
import supabase from '@/lib/supabase';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconPrinter from '@/components/icon/icon-printer';
import IconDownload from '@/components/icon/icon-download';
import IconEdit from '@/components/icon/icon-edit';
import IconCalendar from '@/components/icon/icon-calendar';
import IconDocument from '@/components/icon/icon-document';
import IconDollarSign from '@/components/icon/icon-dollar-sign';
import IconUser from '@/components/icon/icon-user';
import IconPhone from '@/components/icon/icon-phone';
import IconMail from '@/components/icon/icon-mail';

interface BookingService {
    id: string;
    service_type: string;
    service_id: string;
    quantity: number;
    days: number;
    booked_price: number;
    rate_type: string;
    service_details?: {
        name: string;
    };
}

interface BillDetails {
    id: string;
    bill_number: string;
    bill_type: 'tax_invoice' | 'receipt';
    booking_id: string;
    customer_name: string;
    customer_email: string | null;
    customer_phone: string | null;
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    tax_rate: number;
    status: 'draft' | 'issued' | 'paid' | 'cancelled' | 'complete' | 'incomplete';
    issue_date: string;
    due_date: string | null;
    paid_date: string | null;
    description: string | null;
    notes: string | null;
    payment_method: string | null;
    auto_generated: boolean;
    parent_bill_id: string | null;
    created_at: string;
    updated_at: string;
    booking: {
        booking_reference: string;
        total_amount: number;
        destination: {
            name: string;
            address: string;
        };
        trip_date: string;
    };
    payments?: Array<{
        id: string;
        amount: number;
        payment_type: 'cash' | 'bank_transfer' | 'credit_card' | 'check';
        payment_date: string;
        notes?: string;
        // Bank transfer details
        account_number?: string;
        account_holder_name?: string;
        bank_name?: string;
        transaction_number?: string;
        // Credit card details
        card_number?: string; // Last 4 digits
        card_holder_name?: string;
        // Check details
        check_number?: string;
        check_bank_name?: string;
        payer_name?: string;
    }>;
}

export default function BillDetailsPage() {
    const { t } = getTranslation();
    const params = useParams();
    const router = useRouter();
    const billId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [bill, setBill] = useState<BillDetails | null>(null);
    const [bookingServices, setBookingServices] = useState<BookingService[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBill = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('bills')
                    .select(
                        `
                        *,
                        booking:bookings(
                            booking_reference,
                            trip_date,
                            total_amount,
                            destination:destinations(name, address)
                        ),
                        payments (
                            id,
                            amount,
                            payment_type,
                            payment_date,
                            notes,
                            account_number,
                            account_holder_name,
                            bank_name,
                            transaction_number,
                            card_number,
                            card_holder_name,
                            check_number,
                            check_bank_name,
                            payer_name
                        )
                    `,
                    )
                    .eq('id', billId)
                    .single();

                if (error) {
                    console.error('Error fetching bill:', error);
                    setError(t('error_loading_bill'));
                    return;
                }

                setBill(data as BillDetails);

                // Fetch booking services if this is a tax invoice
                if (data && data.bill_type === 'tax_invoice' && data.booking_id) {
                    const { data: servicesData, error: servicesError } = await supabase.from('booking_services').select('*').eq('booking_id', data.booking_id);

                    if (servicesError) {
                        console.error('Error fetching booking services:', servicesError);
                    } else if (servicesData) {
                        // Fetch service details for each service
                        const servicesWithDetails = await Promise.all(
                            servicesData.map(async (service) => {
                                let serviceName = '';
                                try {
                                    const { data: serviceDetail } = await supabase.from(service.service_type).select('name').eq('id', service.service_id).single();

                                    if (serviceDetail) {
                                        serviceName = serviceDetail.name;
                                    }
                                } catch (e) {
                                    console.error(`Error fetching service details for ${service.service_type}:`, e);
                                }

                                return {
                                    ...service,
                                    service_details: { name: serviceName || t('unknown_service') },
                                };
                            }),
                        );
                        setBookingServices(servicesWithDetails);
                    }
                }
            } catch (error) {
                console.error('Unexpected error:', error);
                setError(t('error_loading_bill'));
            } finally {
                setLoading(false);
            }
        };

        if (billId) {
            fetchBill();
        }
    }, [billId]);

    const getBillTypeColor = (type: string) => {
        switch (type) {
            case 'tax_invoice':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'receipt':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const getBillTypeName = (type: string) => {
        switch (type) {
            case 'tax_invoice':
                return t('tax_invoice');
            case 'receipt':
                return t('receipt');
            default:
                return type;
        }
    };

    // Calculate status based on bill type (same logic as main page)
    const getBillStatus = (bill: BillDetails) => {
        if (bill.bill_type === 'tax_invoice') {
            // For tax invoices: paid or unpaid
            return bill.status === 'paid' ? 'paid' : 'unpaid';
        } else if (bill.bill_type === 'receipt') {
            // For receipts: complete or incomplete (based on receipt amount vs booking amount)
            const bookingAmount = bill.booking?.total_amount || 0;
            const receiptAmount = bill.total_amount;
            return receiptAmount >= bookingAmount ? 'complete' : 'incomplete';
        }
        // Default fallback
        return bill.status === 'paid' ? 'paid' : 'unpaid';
    };

    const getStatusColor = (bill: BillDetails) => {
        const status = getBillStatus(bill);
        switch (status) {
            case 'paid':
            case 'complete':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'unpaid':
            case 'incomplete':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(amount);
    };

    const renderPaymentDetails = (payment: NonNullable<BillDetails['payments']>[number]) => {
        if (!payment) return null;

        return (
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs">
                <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">{t('payment_details')}:</div>
                <div className="space-y-1">
                    <div>
                        <span className="text-gray-600 dark:text-gray-400">{t('payment_type')}:</span> <span className="text-gray-900 dark:text-white">{t(payment.payment_type)}</span>
                    </div>
                    <div>
                        <span className="text-gray-600 dark:text-gray-400">{t('amount')}:</span> <span className="text-gray-900 dark:text-white">{formatCurrency(payment.amount)}</span>
                    </div>
                    <div>
                        <span className="text-gray-600 dark:text-gray-400">{t('payment_date')}:</span>{' '}
                        <span className="text-gray-900 dark:text-white">{new Date(payment.payment_date).toLocaleDateString('tr-TR')}</span>
                    </div>

                    {payment.payment_type === 'bank_transfer' && (
                        <>
                            {payment.account_number && (
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">{t('account_number')}:</span> <span className="text-gray-900 dark:text-white">{payment.account_number}</span>
                                </div>
                            )}
                            {payment.account_holder_name && (
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">{t('account_holder_name')}:</span>{' '}
                                    <span className="text-gray-900 dark:text-white">{payment.account_holder_name}</span>
                                </div>
                            )}
                            {payment.bank_name && (
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">{t('bank_name')}:</span> <span className="text-gray-900 dark:text-white">{payment.bank_name}</span>
                                </div>
                            )}
                            {payment.transaction_number && (
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">{t('transaction_number')}:</span>{' '}
                                    <span className="text-gray-900 dark:text-white">{payment.transaction_number}</span>
                                </div>
                            )}
                        </>
                    )}
                    {payment.payment_type === 'credit_card' && (
                        <>
                            {payment.card_number && (
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">{t('card_number_last_4')}:</span>{' '}
                                    <span className="text-gray-900 dark:text-white">****{payment.card_number}</span>
                                </div>
                            )}
                            {payment.card_holder_name && (
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">{t('card_holder_name')}:</span> <span className="text-gray-900 dark:text-white">{payment.card_holder_name}</span>
                                </div>
                            )}
                        </>
                    )}
                    {payment.payment_type === 'check' && (
                        <>
                            {payment.check_number && (
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">{t('check_number')}:</span> <span className="text-gray-900 dark:text-white">{payment.check_number}</span>
                                </div>
                            )}
                            {payment.check_bank_name && (
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">{t('check_bank_name')}:</span> <span className="text-gray-900 dark:text-white">{payment.check_bank_name}</span>
                                </div>
                            )}
                            {payment.payer_name && (
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">{t('payer_name')}:</span> <span className="text-gray-900 dark:text-white">{payment.payer_name}</span>
                                </div>
                            )}
                        </>
                    )}
                    {payment.notes && (
                        <div>
                            <span className="text-gray-600 dark:text-gray-400">{t('notes')}:</span> <span className="text-gray-900 dark:text-white">{payment.notes}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !bill) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 p-6">
                <div className="container mx-auto">
                    <div className="text-center py-12">
                        <div className="text-red-500 text-xl mb-4">{error || t('bill_not_found')}</div>
                        <Link href="/bills" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                            {t('back_to_bills')}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 p-6" dir={t('direction') || 'rtl'}>
            <div className="container mx-auto">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/bills"
                                className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg border border-white/30 dark:border-slate-700/40 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300"
                            >
                                <IconArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300 ltr:rotate-180" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('bill_details')}</h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">{bill.bill_number}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Edit button - only for receipts */}
                            {bill.bill_type === 'receipt' && (
                                <Link href={`/bills/${bill.id}/edit`} className="btn btn-outline-primary gap-2">
                                    <IconEdit className="w-4 h-4" />
                                    {t('add_payments')}
                                </Link>
                            )}
                            <button
                                onClick={() => {
                                    // TODO: Implement download functionality
                                    console.log('Download bill:', bill.id);
                                }}
                                className="btn btn-outline-info gap-2"
                            >
                                <IconDownload className="w-4 h-4" />
                                {t('download')}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBillTypeColor(bill.bill_type)}`}>{getBillTypeName(bill.bill_type)}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(bill)}`}>{t(getBillStatus(bill))}</span>
                        {bill.auto_generated && (
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">{t('auto_generated')}</span>
                        )}
                    </div>
                </motion.div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Bill Information */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/30 dark:border-slate-700/40"
                    >
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <IconDocument className="w-5 h-5 text-blue-500" />
                            {t('bill_information')}
                        </h2>

                        {/* Payments (for receipts) */}
                        {bill.bill_type === 'receipt' && bill.payments && bill.payments.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('payments')}</h3>
                                <div className="space-y-3">
                                    {bill.payments.map((payment) => (
                                        <div key={payment.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {t(payment.payment_type)} - {formatCurrency(payment.amount)}
                                                </span>
                                                <span className="text-sm text-gray-600 dark:text-gray-400">{new Date(payment.payment_date).toLocaleDateString('tr-TR')}</span>
                                            </div>
                                            {renderPaymentDetails(payment)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Booking Services (for tax invoices) */}
                        {bill.bill_type === 'tax_invoice' && bookingServices.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('booking_services')}</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-100 dark:bg-gray-800">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('service_type')}</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('service_name')}</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('quantity')}</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('days')}</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('price')}</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('total')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                            {bookingServices.map((service) => (
                                                <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                            {t(`service_${service.service_type}`)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-900 dark:text-white">{service.service_details?.name || t('unknown_service')}</td>
                                                    <td className="px-4 py-3 text-center text-gray-900 dark:text-white">{service.quantity}</td>
                                                    <td className="px-4 py-3 text-center text-gray-900 dark:text-white">{service.days}</td>
                                                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{formatCurrency(service.booked_price)}</td>
                                                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                                                        {formatCurrency(service.booked_price * service.quantity * service.days)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Financial Summary */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <IconDollarSign className="w-5 h-5 text-green-500" />
                                {t('financial_summary')}
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-700 dark:text-gray-300">{t('subtotal')}:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(bill.subtotal)}</span>
                                </div>
                                {bill.tax_amount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-700 dark:text-gray-300">
                                            {t('tax')} ({bill.tax_rate}%):
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(bill.tax_amount)}</span>
                                    </div>
                                )}
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                                    <div className="flex justify-between">
                                        <span className="text-lg font-semibold text-gray-900 dark:text-white">{t('total_amount')}:</span>
                                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(bill.total_amount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description and Notes */}
                        {(bill.description || bill.notes) && (
                            <div className="mt-6 space-y-4">
                                {bill.description && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('description')}</h3>
                                        <p className="text-gray-900 dark:text-white">{bill.description}</p>
                                    </div>
                                )}
                                {bill.notes && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('notes')}</h3>
                                        <p className="text-gray-900 dark:text-white">{bill.notes}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Customer Information */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/30 dark:border-slate-700/40"
                        >
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <IconUser className="w-5 h-5 text-blue-500" />
                                {t('customer_information')}
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('name')}</label>
                                    <p className="text-gray-900 dark:text-white">{bill.customer_name}</p>
                                </div>
                                {bill.customer_email && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('email')}</label>
                                        <div className="flex items-center gap-2">
                                            <IconMail className="w-4 h-4 text-gray-500" />
                                            <p className="text-gray-900 dark:text-white">{bill.customer_email}</p>
                                        </div>
                                    </div>
                                )}
                                {bill.customer_phone && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('phone')}</label>
                                        <div className="flex items-center gap-2">
                                            <IconPhone className="w-4 h-4 text-gray-500" />
                                            <p className="text-gray-900 dark:text-white">{bill.customer_phone}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Related Booking */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/30 dark:border-slate-700/40"
                        >
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <IconCalendar className="w-5 h-5 text-green-500" />
                                {t('related_booking')}
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('booking_reference')}</label>
                                    <Link href={`/bookings/${bill.booking_id}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                                        {bill.booking?.booking_reference}
                                    </Link>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('destination')}</label>
                                    <p className="text-gray-900 dark:text-white">{bill.booking?.destination?.name}</p>
                                    {bill.booking?.destination?.address && <p className="text-sm text-gray-500">{bill.booking.destination.address}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('trip_date')}</label>
                                    <p className="text-gray-900 dark:text-white">{new Date(bill.booking?.trip_date).toLocaleDateString('tr-TR')}</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Bill Timeline */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/30 dark:border-slate-700/40"
                        >
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('bill_timeline')}</h2>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{t('bill_created')}</p>
                                        <p className="text-xs text-gray-500">{new Date(bill.created_at).toLocaleString('tr-TR')}</p>
                                    </div>
                                </div>
                                {bill.issue_date && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{t('bill_issued')}</p>
                                            <p className="text-xs text-gray-500">{new Date(bill.issue_date).toLocaleDateString('tr-TR')}</p>
                                        </div>
                                    </div>
                                )}
                                {bill.paid_date && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{t('bill_paid')}</p>
                                            <p className="text-xs text-gray-500">{new Date(bill.paid_date).toLocaleDateString('tr-TR')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
