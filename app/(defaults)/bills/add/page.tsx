'use client';
import React, { useState, useEffect } from 'react';
import { getTranslation } from '@/i18n';
import supabase from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconSave from '@/components/icon/icon-save';
import IconPlus from '@/components/icon/icon-plus';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconReceipt from '@/components/icon/icon-receipt';
import IconDollarSign from '@/components/icon/icon-dollar-sign';
import CustomSelect from '@/components/elements/custom-select';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';

interface BookingOption {
    id: string;
    booking_reference: string;
    customer_name: string;
    total_amount: number;
    trip_date: string;
    destination_name: string;
}

interface PaymentMethod {
    id: string;
    type: string;
    details: string;
    amount: number;
}

interface TaxInvoice {
    id: string;
    bill_number: string;
    total_amount: number;
    status: string;
}

export default function AddBill() {
    const { t } = getTranslation();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [bookings, setBookings] = useState<BookingOption[]>([]);
    const [selectedBooking, setSelectedBooking] = useState<string>('');
    const [selectedBookingDetails, setSelectedBookingDetails] = useState<BookingOption | null>(null);
    const [taxInvoice, setTaxInvoice] = useState<TaxInvoice | null>(null);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([{ id: '1', type: 'cash', details: '', amount: 0 }]);
    const [notes, setNotes] = useState('');
    const [alert, setAlert] = useState<{
        visible: boolean;
        message: string;
        type: 'success' | 'danger';
    }>({
        visible: false,
        message: '',
        type: 'success',
    });

    // Payment method options
    const paymentMethodOptions = [
        { value: 'cash', label: t('cash') },
        { value: 'bank_transfer', label: t('bank_transfer') },
        { value: 'credit_card', label: t('credit_card') },
        { value: 'check', label: t('check') },
        { value: 'other', label: t('other') },
    ];

    useEffect(() => {
        const fetchConfirmedBookings = async () => {
            try {
                const { data, error } = await supabase
                    .from('bookings')
                    .select(
                        `
                        id,
                        booking_reference,
                        customer_name,
                        total_amount,
                        trip_date,
                        destination:destinations(name)
                    `,
                    )
                    .eq('status', 'confirmed')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching bookings:', error);
                    setAlert({
                        visible: true,
                        message: t('error_loading_bookings'),
                        type: 'danger',
                    });
                    return;
                }

                const formattedBookings: BookingOption[] = data.map((booking: any) => ({
                    id: booking.id,
                    booking_reference: booking.booking_reference,
                    customer_name: booking.customer_name || 'Unknown Customer',
                    total_amount: booking.total_amount || 0,
                    trip_date: booking.trip_date,
                    destination_name: booking.destination?.name || 'Unknown Destination',
                }));

                setBookings(formattedBookings);
            } catch (error) {
                console.error('Error fetching confirmed bookings:', error);
                setAlert({
                    visible: true,
                    message: t('error_loading_bookings'),
                    type: 'danger',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchConfirmedBookings();
    }, []);

    const handleBookingSelection = async (bookingId: string) => {
        setSelectedBooking(bookingId);
        const booking = bookings.find((b) => b.id === bookingId);
        setSelectedBookingDetails(booking || null);

        if (booking) {
            // Fetch the tax invoice for this booking
            try {
                const { data: taxInvoiceData, error } = await supabase.from('bills').select('*').eq('booking_id', bookingId).eq('bill_type', 'tax_invoice').single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching tax invoice:', error);
                } else if (taxInvoiceData) {
                    setTaxInvoice({
                        id: taxInvoiceData.id,
                        bill_number: taxInvoiceData.bill_number,
                        total_amount: taxInvoiceData.total_amount,
                        status: taxInvoiceData.status,
                    });
                } else {
                    setTaxInvoice(null);
                }
            } catch (error) {
                console.error('Error fetching tax invoice:', error);
                setTaxInvoice(null);
            }
        }
    };

    const addPaymentMethod = () => {
        const newId = (Math.max(...paymentMethods.map((p) => parseInt(p.id))) + 1).toString();
        setPaymentMethods([...paymentMethods, { id: newId, type: 'cash', details: '', amount: 0 }]);
    };

    const removePaymentMethod = (id: string) => {
        if (paymentMethods.length > 1) {
            setPaymentMethods(paymentMethods.filter((p) => p.id !== id));
        }
    };

    const updatePaymentMethod = (id: string, field: keyof Omit<PaymentMethod, 'id'>, value: any) => {
        setPaymentMethods(paymentMethods.map((p) => (p.id === id ? { ...p, [field]: field === 'amount' ? parseFloat(value) || 0 : value } : p)));
    };

    const calculateTotal = () => {
        return paymentMethods.reduce((total, payment) => total + payment.amount, 0);
    };

    const handleSave = async () => {
        if (!selectedBooking || !selectedBookingDetails) {
            setAlert({
                visible: true,
                message: t('please_select_booking'),
                type: 'danger',
            });
            return;
        }

        if (paymentMethods.length === 0 || paymentMethods.every((p) => p.amount === 0)) {
            setAlert({
                visible: true,
                message: t('please_add_payment_amounts'),
                type: 'danger',
            });
            return;
        }

        setSaving(true);
        try {
            const total = calculateTotal();

            // Generate bill number for receipt
            const { data: billNumber, error: billNumberError } = await supabase.rpc('generate_bill_number', {
                bill_type_param: 'receipt',
            });

            if (billNumberError) {
                throw new Error('Failed to generate bill number');
            }

            // Determine receipt status based on amount coverage
            const receiptStatus = total >= selectedBookingDetails.total_amount ? 'complete' : 'incomplete';

            // Create receipt
            const receiptData = {
                bill_number: billNumber,
                bill_type: 'receipt',
                booking_id: selectedBooking,
                customer_name: selectedBookingDetails.customer_name,
                subtotal: total,
                tax_amount: 0, // Receipts don't have tax
                total_amount: total,
                tax_rate: 0,
                status: receiptStatus,
                issue_date: new Date().toISOString().split('T')[0],
                description: `Receipt for Booking ${selectedBookingDetails.booking_reference}`,
                notes: notes,
                auto_generated: false,
                parent_bill_id: taxInvoice?.id || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            const { data: receipt, error: receiptError } = await supabase.from('bills').insert([receiptData]).select().single();

            if (receiptError) {
                throw new Error('Failed to create receipt');
            }

            // Create bill items for each payment method
            const billItems = paymentMethods.map((payment) => ({
                bill_id: receipt.id,
                service_type: 'payment',
                service_name: `${t(payment.type)} ${payment.details ? `- ${payment.details}` : ''}`,
                quantity: 1,
                days: 1,
                unit_price: payment.amount,
                line_total: payment.amount,
            }));

            const { error: itemsError } = await supabase.from('bill_items').insert(billItems);

            if (itemsError) {
                // Clean up receipt if items failed
                await supabase.from('bills').delete().eq('id', receipt.id);
                throw new Error('Failed to create payment items');
            }

            // Update tax invoice status if receipt total covers the booking amount
            if (taxInvoice && total >= selectedBookingDetails.total_amount) {
                const { error: taxInvoiceUpdateError } = await supabase
                    .from('bills')
                    .update({
                        status: 'paid',
                        paid_date: new Date().toISOString().split('T')[0],
                    })
                    .eq('id', taxInvoice.id);

                if (taxInvoiceUpdateError) {
                    console.error('Error updating tax invoice status:', taxInvoiceUpdateError);
                }
            }

            setAlert({
                visible: true,
                message: `${t('receipt_created_successfully')}: ${receipt.bill_number}`,
                type: 'success',
            });

            // Redirect to receipt details after short delay
            setTimeout(() => {
                router.push(`/bills/${receipt.id}`);
            }, 1500);
        } catch (error) {
            console.error('Error creating receipt:', error);
            setAlert({
                visible: true,
                message: t('error_creating_receipt'),
                type: 'danger',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            {/* Header */}
            <div className="flex items-center gap-5 mb-6">
                <Link href="/bills" className="text-primary hover:text-primary/80">
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
                        <Link href="/bills" className="text-primary hover:underline">
                            {t('bills')}
                        </Link>
                    </li>
                    <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                        <span>{t('add_receipt')}</span>
                    </li>
                </ul>
            </div>

            {/* Title and Actions */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <IconReceipt className="w-8 h-8 text-green-600" />
                        {t('add_receipt')}
                    </h1>
                    <p className="text-gray-500 mt-2">{t('create_manual_receipt_description')}</p>
                </div>
                <button onClick={handleSave} disabled={saving || !selectedBooking} className="btn btn-primary flex items-center gap-2">
                    <IconSave className="w-4 h-4" />
                    {saving ? t('creating') : t('create_receipt')}
                </button>
            </div>

            {/* Alert */}
            {alert.visible && (
                <div className="fixed top-4 right-4 z-50 min-w-80 max-w-md">
                    <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert({ ...alert, visible: false })} />
                </div>
            )}

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Booking Selection */}
                    <div className="panel">
                        <div className="mb-5">
                            <h3 className="text-lg font-semibold">{t('select_booking')}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('select_confirmed_booking_for_receipt')}</p>
                        </div>

                        <div className="space-y-4">
                            <CustomSelect
                                options={bookings.map((booking) => ({
                                    value: booking.id,
                                    label: `${booking.booking_reference} - ${booking.customer_name} (${booking.destination_name})`,
                                }))}
                                value={selectedBooking}
                                onChange={(value) => handleBookingSelection(Array.isArray(value) ? value[0] : value)}
                                placeholder={t('select_booking')}
                            />

                            {/* Selected Booking Details */}
                            {selectedBookingDetails && (
                                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">{t('booking_details')}</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">{t('customer')}:</span>
                                            <span className="ml-2 font-medium">{selectedBookingDetails.customer_name}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">{t('amount')}:</span>
                                            <span className="ml-2 font-medium">{selectedBookingDetails.total_amount.toLocaleString()} ₪</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">{t('trip_date')}:</span>
                                            <span className="ml-2 font-medium">{selectedBookingDetails.trip_date}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">{t('destination')}:</span>
                                            <span className="ml-2 font-medium">{selectedBookingDetails.destination_name}</span>
                                        </div>
                                    </div>

                                    {/* Tax Invoice Info */}
                                    {taxInvoice && (
                                        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">{t('tax_invoice')}:</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{taxInvoice.bill_number}</span>
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            taxInvoice.status === 'paid'
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                        }`}
                                                    >
                                                        {t(taxInvoice.status)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="panel">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">{t('payment_methods')}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('add_payment_methods_description')}</p>
                            </div>
                            <button onClick={addPaymentMethod} className="btn btn-success btn-sm flex items-center gap-2">
                                <IconPlus className="w-4 h-4" />
                                {t('add_payment')}
                            </button>
                        </div>

                        <div className="space-y-4">
                            {paymentMethods.map((payment, index) => (
                                <div key={payment.id} className="relative group bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                                    <div className="flex items-start justify-between mb-4">
                                        <h4 className="font-medium text-gray-900 dark:text-white">
                                            {t('payment')} #{index + 1}
                                        </h4>
                                        {paymentMethods.length > 1 && (
                                            <button onClick={() => removePaymentMethod(payment.id)} className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <IconTrashLines className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('payment_method')}</label>
                                            <CustomSelect
                                                options={paymentMethodOptions}
                                                value={payment.type}
                                                onChange={(value) => updatePaymentMethod(payment.id, 'type', Array.isArray(value) ? value[0] : value)}
                                                placeholder={t('select_payment_method')}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('payment_details')}</label>
                                            <input
                                                type="text"
                                                value={payment.details}
                                                onChange={(e) => updatePaymentMethod(payment.id, 'details', e.target.value)}
                                                className="form-input"
                                                placeholder={t('payment_details_placeholder')}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{t('amount')} (₪)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={payment.amount}
                                                onChange={(e) => updatePaymentMethod(payment.id, 'amount', e.target.value)}
                                                className="form-input"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="panel">
                        <div className="mb-5">
                            <h3 className="text-lg font-semibold">{t('notes')}</h3>
                        </div>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="form-textarea" rows={4} placeholder={t('receipt_notes_placeholder')} />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Summary */}
                    <div className="panel">
                        <div className="mb-5">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <IconDollarSign className="w-5 h-5 text-green-600" />
                                {t('receipt_summary')}
                            </h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                                <span className="text-gray-600 dark:text-gray-400">{t('payment_methods')}:</span>
                                <span className="font-medium">{paymentMethods.length}</span>
                            </div>

                            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                                <span className="text-gray-600 dark:text-gray-400">{t('total_amount')}:</span>
                                <span className="font-bold text-lg text-green-600">{calculateTotal().toLocaleString()} ₪</span>
                            </div>

                            {selectedBookingDetails && (
                                <>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                                        <span className="text-gray-600 dark:text-gray-400">{t('booking_amount')}:</span>
                                        <span className="font-medium">{selectedBookingDetails.total_amount.toLocaleString()} ₪</span>
                                    </div>

                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-gray-600 dark:text-gray-400">{t('remaining_balance')}:</span>
                                        <span className={`font-bold ${selectedBookingDetails.total_amount - calculateTotal() <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                                            {(selectedBookingDetails.total_amount - calculateTotal()).toLocaleString()} ₪
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        {selectedBookingDetails && calculateTotal() >= selectedBookingDetails.total_amount && (
                            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                                <p className="text-green-800 dark:text-green-200 text-sm font-medium">✅ {t('booking_will_be_marked_as_paid')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
