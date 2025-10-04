'use client';
import React, { useState, useEffect } from 'react';
import { getTranslation } from '@/i18n';
import supabase from '@/lib/supabase';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconSave from '@/components/icon/icon-save';
import IconPlus from '@/components/icon/icon-plus';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconReceipt from '@/components/icon/icon-receipt';
import IconDollarSign from '@/components/icon/icon-dollar-sign';
import CustomSelect from '@/components/elements/custom-select';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';

interface PaymentMethod {
    id: string;
    type: 'cash' | 'bank_transfer' | 'credit_card' | 'check';
    amount: number;
    // Bank transfer details
    accountNumber?: string;
    accountHolderName?: string;
    bankName?: string;
    transactionNumber?: string;
    // Credit card details
    cardNumber?: string; // Last 4 digits only
    cardHolderName?: string;
    // Check details
    checkNumber?: string;
    checkBankName?: string;
    payerName?: string;
}

interface ExistingPayment {
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
    card_number?: string;
    card_holder_name?: string;
    // Check details
    check_number?: string;
    check_bank_name?: string;
    payer_name?: string;
}

interface BillDetails {
    id: string;
    bill_number: string;
    bill_type: 'tax_invoice' | 'receipt';
    booking_id: string;
    customer_name: string;
    total_amount: number;
    status: string;
    booking: {
        booking_reference: string;
        total_amount: number;
        destination: {
            name: string;
        };
        customer?: {
            full_name: string;
            email: string | null;
            phone: string | null;
        };
    };
    payments: ExistingPayment[];
}

export default function EditReceiptPage() {
    const { t } = getTranslation();
    const params = useParams();
    const router = useRouter();
    const billId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [bill, setBill] = useState<BillDetails | null>(null);
    const [newPayments, setNewPayments] = useState<PaymentMethod[]>([]);
    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({
        visible: false,
        message: '',
        type: 'success',
    });

    const paymentTypes = [
        { value: 'cash', label: t('cash') },
        { value: 'bank_transfer', label: t('bank_transfer') },
        { value: 'credit_card', label: t('credit_card') },
        { value: 'check', label: t('check') },
    ];

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
                            total_amount,
                            destination:destinations(name),
                            customer:users!customer_id(full_name, email, phone)
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
                    setAlert({ visible: true, message: t('error_loading_bill'), type: 'danger' });
                    return;
                }

                // Check if it's a receipt
                if (data.bill_type !== 'receipt') {
                    setAlert({ visible: true, message: t('only_receipts_can_be_edited'), type: 'danger' });
                    setTimeout(() => router.push(`/bills/${billId}`), 2000);
                    return;
                }

                setBill(data as BillDetails);
            } catch (error) {
                console.error('Unexpected error:', error);
                setAlert({ visible: true, message: t('error_loading_bill'), type: 'danger' });
            } finally {
                setLoading(false);
            }
        };

        if (billId) {
            fetchBill();
        }
    }, [billId, router]);

    const addNewPayment = () => {
        const newPayment: PaymentMethod = {
            id: `new_${Date.now()}`,
            type: 'cash',
            amount: 0,
        };
        setNewPayments([...newPayments, newPayment]);
    };

    const removeNewPayment = (id: string) => {
        setNewPayments(newPayments.filter((payment) => payment.id !== id));
    };

    const updateNewPayment = (id: string, field: string, value: any) => {
        setNewPayments((payments) => payments.map((payment) => (payment.id === id ? { ...payment, [field]: value } : payment)));
    };

    const calculateNewPaymentsTotal = () => {
        return newPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    };

    const calculateExistingPaymentsTotal = () => {
        return bill?.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    };

    const calculateGrandTotal = () => {
        return calculateExistingPaymentsTotal() + calculateNewPaymentsTotal();
    };

    const validatePaymentDetails = () => {
        for (const payment of newPayments) {
            if (payment.amount <= 0) {
                return { valid: false, message: t('payment_amount_required') };
            }

            if (payment.type === 'bank_transfer') {
                if (!payment.accountNumber || !payment.accountHolderName || !payment.bankName) {
                    return { valid: false, message: t('bank_transfer_details_required') };
                }
            } else if (payment.type === 'credit_card') {
                if (!payment.cardNumber || !payment.cardHolderName) {
                    return { valid: false, message: t('credit_card_details_required') };
                }
            } else if (payment.type === 'check') {
                if (!payment.checkNumber || !payment.checkBankName || !payment.payerName) {
                    return { valid: false, message: t('check_details_required') };
                }
            }
        }
        return { valid: true };
    };

    const handleSubmit = async () => {
        if (newPayments.length === 0) {
            setAlert({ visible: true, message: t('no_new_payments_to_add'), type: 'danger' });
            return;
        }

        const validation = validatePaymentDetails();
        if (!validation.valid) {
            setAlert({ visible: true, message: validation.message || t('please_fill_required_fields'), type: 'danger' });
            return;
        }

        setSaving(true);
        try {
            const newTotal = calculateGrandTotal();

            // Create new payments
            const paymentsData = newPayments.map((payment) => {
                const paymentData: any = {
                    bill_id: billId,
                    amount: payment.amount,
                    payment_type: payment.type,
                    payment_date: new Date().toISOString().split('T')[0],
                };

                // Add type-specific fields
                if (payment.type === 'bank_transfer') {
                    paymentData.account_number = payment.accountNumber || null;
                    paymentData.account_holder_name = payment.accountHolderName || null;
                    paymentData.bank_name = payment.bankName || null;
                    paymentData.transaction_number = payment.transactionNumber || null;
                } else if (payment.type === 'credit_card') {
                    paymentData.card_number = payment.cardNumber || null;
                    paymentData.card_holder_name = payment.cardHolderName || null;
                } else if (payment.type === 'check') {
                    paymentData.check_number = payment.checkNumber || null;
                    paymentData.check_bank_name = payment.checkBankName || null;
                    paymentData.payer_name = payment.payerName || null;
                }

                return paymentData;
            });

            const { error: paymentsError } = await supabase.from('payments').insert(paymentsData);

            if (paymentsError) {
                throw new Error('Failed to add new payments');
            }

            // Update receipt status and total
            const receiptStatus = newTotal >= (bill?.booking.total_amount || 0) ? 'complete' : 'incomplete';

            const { error: updateError } = await supabase
                .from('bills')
                .update({
                    total_amount: newTotal,
                    subtotal: newTotal,
                    status: receiptStatus,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', billId);

            if (updateError) {
                console.error('Error updating receipt:', updateError);
                // Don't fail the operation, just log the error
            }

            setAlert({ visible: true, message: t('payments_added_successfully'), type: 'success' });

            // Redirect back to bill details after delay
            setTimeout(() => {
                router.push(`/bills/${billId}`);
            }, 1500);
        } catch (error) {
            console.error('Error adding payments:', error);
            setAlert({ visible: true, message: t('error_adding_payments'), type: 'danger' });
        } finally {
            setSaving(false);
        }
    };

    const renderPaymentFields = (payment: PaymentMethod) => {
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('payment_type')} <span className="text-red-500">*</span>
                        </label>
                        <CustomSelect value={payment.type} onChange={(value) => updateNewPayment(payment.id, 'type', value)} options={paymentTypes} placeholder={t('select_payment_type')} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('amount')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={payment.amount}
                            onChange={(e) => updateNewPayment(payment.id, 'amount', parseFloat(e.target.value) || 0)}
                            className="form-input"
                            placeholder={t('enter_amount')}
                        />
                    </div>
                </div>

                {/* Payment type specific fields */}
                {payment.type === 'bank_transfer' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('account_number')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={payment.accountNumber || ''}
                                onChange={(e) => updateNewPayment(payment.id, 'accountNumber', e.target.value)}
                                className="form-input"
                                placeholder={t('enter_account_number')}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('account_holder_name')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={payment.accountHolderName || ''}
                                onChange={(e) => updateNewPayment(payment.id, 'accountHolderName', e.target.value)}
                                className="form-input"
                                placeholder={t('enter_account_holder_name')}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('bank_name')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={payment.bankName || ''}
                                onChange={(e) => updateNewPayment(payment.id, 'bankName', e.target.value)}
                                className="form-input"
                                placeholder={t('enter_bank_name')}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('transaction_number')}</label>
                            <input
                                type="text"
                                value={payment.transactionNumber || ''}
                                onChange={(e) => updateNewPayment(payment.id, 'transactionNumber', e.target.value)}
                                className="form-input"
                                placeholder={t('enter_transaction_number')}
                            />
                        </div>
                    </div>
                )}

                {payment.type === 'credit_card' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('card_number_last_4')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                maxLength={4}
                                value={payment.cardNumber || ''}
                                onChange={(e) => updateNewPayment(payment.id, 'cardNumber', e.target.value)}
                                className="form-input"
                                placeholder={t('enter_last_4_digits')}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('card_holder_name')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={payment.cardHolderName || ''}
                                onChange={(e) => updateNewPayment(payment.id, 'cardHolderName', e.target.value)}
                                className="form-input"
                                placeholder={t('enter_card_holder_name')}
                            />
                        </div>
                    </div>
                )}

                {payment.type === 'check' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('check_number')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={payment.checkNumber || ''}
                                onChange={(e) => updateNewPayment(payment.id, 'checkNumber', e.target.value)}
                                className="form-input"
                                placeholder={t('enter_check_number')}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('check_bank_name')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={payment.checkBankName || ''}
                                onChange={(e) => updateNewPayment(payment.id, 'checkBankName', e.target.value)}
                                className="form-input"
                                placeholder={t('enter_check_bank_name')}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('payer_name')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={payment.payerName || ''}
                                onChange={(e) => updateNewPayment(payment.id, 'payerName', e.target.value)}
                                className="form-input"
                                placeholder={t('enter_payer_name')}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!bill) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 p-6">
                <div className="container mx-auto">
                    <div className="text-center py-12">
                        <div className="text-red-500 text-xl mb-4">{t('bill_not_found')}</div>
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
                {/* Alert */}
                {alert.visible && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                        <Alert message={alert.message} type={alert.type} onClose={() => setAlert({ ...alert, visible: false })} />
                    </motion.div>
                )}

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <Link
                                href={`/bills/${billId}`}
                                className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg border border-white/30 dark:border-slate-700/40 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300"
                            >
                                <IconArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300 ltr:rotate-180" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('edit_receipt')}</h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">{bill.bill_number}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button onClick={handleSubmit} disabled={saving || newPayments.length === 0} className="btn btn-primary gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                <IconSave className="w-4 h-4" />
                                {saving ? t('saving') : t('save_payments')}
                            </button>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 space-y-6">
                        {/* Existing Payments */}
                        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/30 dark:border-slate-700/40">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <IconReceipt className="w-5 h-5 text-green-500" />
                                {t('existing_payments')} ({bill.payments.length})
                            </h2>

                            {bill.payments.length > 0 ? (
                                <div className="space-y-3">
                                    {bill.payments.map((payment, index) => (
                                        <div key={payment.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-700">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    #{index + 1} - {t(payment.payment_type)} - {formatCurrency(payment.amount)}
                                                </span>
                                                <span className="text-sm text-gray-600 dark:text-gray-400 bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">{t('protected')}</span>
                                            </div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                                {t('payment_date')}: {new Date(payment.payment_date).toLocaleDateString('tr-TR')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-600 dark:text-gray-400">{t('no_existing_payments')}</p>
                            )}
                        </div>

                        {/* New Payments */}
                        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/30 dark:border-slate-700/40">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <IconPlus className="w-5 h-5 text-blue-500" />
                                    {t('new_payments')} ({newPayments.length})
                                </h2>
                                <button onClick={addNewPayment} className="btn btn-outline-primary btn-sm gap-2">
                                    <IconPlus className="w-4 h-4" />
                                    {t('add_payment')}
                                </button>
                            </div>

                            {newPayments.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">{t('no_new_payments_added')}</p>
                                    <button onClick={addNewPayment} className="btn btn-primary gap-2">
                                        <IconPlus className="w-4 h-4" />
                                        {t('add_first_payment')}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {newPayments.map((payment, index) => (
                                        <div key={payment.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-medium text-gray-900 dark:text-white">
                                                    {t('payment')} #{index + 1}
                                                </h3>
                                                <button onClick={() => removeNewPayment(payment.id)} className="text-red-500 hover:text-red-700 p-1">
                                                    <IconTrashLines className="w-4 h-4" />
                                                </button>
                                            </div>
                                            {renderPaymentFields(payment)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Bill Summary */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/30 dark:border-slate-700/40"
                        >
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <IconDollarSign className="w-5 h-5 text-green-500" />
                                {t('payment_summary')}
                            </h2>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-700 dark:text-gray-300">{t('booking_total')}:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(bill.booking.total_amount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-700 dark:text-gray-300">{t('existing_payments')}:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(calculateExistingPaymentsTotal())}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-700 dark:text-gray-300">{t('new_payments')}:</span>
                                    <span className="font-medium text-blue-600 dark:text-blue-400">{formatCurrency(calculateNewPaymentsTotal())}</span>
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                                    <div className="flex justify-between">
                                        <span className="text-lg font-semibold text-gray-900 dark:text-white">{t('total_paid')}:</span>
                                        <span className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(calculateGrandTotal())}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-700 dark:text-gray-300">{t('remaining')}:</span>
                                    <span className={`font-medium ${calculateGrandTotal() >= bill.booking.total_amount ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {formatCurrency(Math.max(0, bill.booking.total_amount - calculateGrandTotal()))}
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Booking Information */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/30 dark:border-slate-700/40"
                        >
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('booking_information')}</h2>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('booking_reference')}</label>
                                    <p className="text-gray-900 dark:text-white">{bill.booking.booking_reference}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('destination')}</label>
                                    <p className="text-gray-900 dark:text-white">{bill.booking.destination.name}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('customer')}</label>
                                    <p className="text-gray-900 dark:text-white">{bill.customer_name}</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
