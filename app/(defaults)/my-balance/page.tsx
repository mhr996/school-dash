'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import supabase from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'mantine-datatable';
import IconShekelSign from '@/components/icon/icon-shekel-sign';
import IconCashBanknotes from '@/components/icon/icon-cash-banknotes';
import IconCalendar from '@/components/icon/icon-calendar';
import IconDownload from '@/components/icon/icon-download';
import {
    calculateServiceProviderBalance,
    getServiceProviderBookings,
    getServiceProviderPayouts,
    ServiceType,
    ServiceProviderBalance,
    ServiceBooking,
    ServicePayout,
} from '@/utils/service-balance-manager';

interface ServiceProviderInfo {
    serviceType: ServiceType;
    serviceId: string;
    serviceName: string;
    serviceEmail: string;
}

const MyBalance = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [providerInfo, setProviderInfo] = useState<ServiceProviderInfo | null>(null);
    const [balance, setBalance] = useState<ServiceProviderBalance | null>(null);
    const [bookings, setBookings] = useState<ServiceBooking[]>([]);
    const [payouts, setPayouts] = useState<ServicePayout[]>([]);
    const [bookingsPage, setBookingsPage] = useState(1);
    const [payoutsPage, setPayoutsPage] = useState(1);
    const pageSize = 10;

    const showAlert = (icon: 'success' | 'error' | 'warning', title: string, text: string) => {
        // Using browser alert as fallback - you can integrate Swal if available
        alert(`${title}\n\n${text}`);
    };

    useEffect(() => {
        fetchServiceProviderInfo();
    }, []);

    useEffect(() => {
        if (providerInfo) {
            fetchBalanceData();
        }
    }, [providerInfo]);

    const fetchServiceProviderInfo = async () => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                showAlert('error', t('error'), t('not_authenticated'));
                return;
            }

            // Check each service type table for user_id match
            const serviceTypes: ServiceType[] = ['guides', 'paramedics', 'security_companies', 'external_entertainment_companies', 'travel_companies', 'education_programs'];

            for (const serviceType of serviceTypes) {
                const { data, error } = await supabase.from(serviceType).select('id, name, email').eq('user_id', user.id).single();

                if (data && !error) {
                    setProviderInfo({
                        serviceType,
                        serviceId: data.id,
                        serviceName: data.name,
                        serviceEmail: data.email,
                    });
                    break;
                }
            }

            if (!providerInfo) {
                showAlert('warning', t('no_service_account'), t('no_service_account_linked'));
            }
        } catch (error) {
            console.error('Error fetching service provider info:', error);
            showAlert('error', t('error'), t('error_loading_data'));
        } finally {
            setLoading(false);
        }
    };

    const fetchBalanceData = async () => {
        if (!providerInfo) return;

        try {
            // Fetch balance
            const balanceData = await calculateServiceProviderBalance(providerInfo.serviceType, providerInfo.serviceId);
            if (balanceData) {
                setBalance(balanceData);
            }

            // Fetch bookings
            const bookingsData = await getServiceProviderBookings(providerInfo.serviceType, providerInfo.serviceId);
            setBookings(bookingsData);

            // Fetch payouts
            const payoutsData = await getServiceProviderPayouts(providerInfo.serviceType, providerInfo.serviceId);
            setPayouts(payoutsData);
        } catch (error) {
            console.error('Error fetching balance data:', error);
            showAlert('error', t('error'), t('error_loading_balance'));
        }
    };

    const exportBookingsToCSV = () => {
        const headers = ['Booking Reference', 'Trip Date', 'Quantity', 'Days', 'Rate', 'Total Earned', 'Status'];
        const rows = bookings.map((booking) => [
            booking.bookingReference,
            new Date(booking.tripDate).toLocaleDateString(),
            booking.quantity,
            booking.days,
            `₪${booking.bookedPrice.toLocaleString()}`,
            `₪${booking.totalAmount.toLocaleString()}`,
            booking.bookingStatus,
        ]);

        const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my-bookings-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const exportPayoutsToCSV = () => {
        const headers = ['Payment Date', 'Amount', 'Payment Method', 'Reference Number', 'Notes'];
        const rows = payouts.map((payout) => [
            new Date(payout.paymentDate).toLocaleDateString(),
            `₪${payout.amount.toLocaleString()}`,
            payout.paymentMethod,
            payout.referenceNumber || '',
            payout.notes || '',
        ]);

        const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my-payouts-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (!providerInfo) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">{t('no_service_account')}</h2>
                    <p className="text-gray-500">{t('no_service_account_linked')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{t('my_balance')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {providerInfo.serviceName} - {providerInfo.serviceType.replace(/_/g, ' ')}
                    </p>
                </div>
            </div>

            {/* Balance Summary Cards */}
            {balance && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Earned */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="panel relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full -mr-16 -mt-16"></div>
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex-1">
                                <h5 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">{t('total_earned')}</h5>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-500">₪{balance.totalEarned.toLocaleString()}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {balance.bookingCount} {t('bookings')}
                                </p>
                            </div>
                            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                <IconShekelSign className="w-7 h-7 text-green-600 dark:text-green-500" />
                            </div>
                        </div>
                    </motion.div>

                    {/* Total Paid Out */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="panel relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-16 -mt-16"></div>
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex-1">
                                <h5 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">{t('total_paid_out')}</h5>
                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-500">₪{balance.totalPaidOut.toLocaleString()}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {balance.payoutCount} {t('payouts')}
                                </p>
                            </div>
                            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                <IconCashBanknotes className="w-7 h-7 text-blue-600 dark:text-blue-500" />
                            </div>
                        </div>
                    </motion.div>

                    {/* Net Balance */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="panel relative overflow-hidden">
                        <div
                            className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${
                                balance.netBalance > 0 ? 'from-purple-500/10' : 'from-gray-500/10'
                            } to-transparent rounded-full -mr-16 -mt-16`}
                        ></div>
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex-1">
                                <h5 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">{t('current_balance')}</h5>
                                <p
                                    className={`text-3xl font-bold ${
                                        balance.netBalance > 0 ? 'text-purple-600 dark:text-purple-500' : balance.netBalance < 0 ? 'text-red-600 dark:text-red-500' : 'text-gray-600 dark:text-gray-500'
                                    }`}
                                >
                                    ₪{balance.netBalance.toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">{balance.netBalance > 0 ? t('amount_due_to_you') : balance.netBalance < 0 ? t('overpaid') : t('settled')}</p>
                            </div>
                            <div
                                className={`w-14 h-14 rounded-full flex items-center justify-center ${
                                    balance.netBalance > 0 ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-gray-100 dark:bg-gray-900/30'
                                }`}
                            >
                                <IconShekelSign className={`w-7 h-7 ${balance.netBalance > 0 ? 'text-purple-600 dark:text-purple-500' : 'text-gray-600 dark:text-gray-500'}`} />
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Bookings History */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="panel">
                <div className="flex items-center justify-between mb-5">
                    <h5 className="text-lg font-semibold">{t('booking_history')}</h5>
                    <button type="button" onClick={exportBookingsToCSV} className="btn btn-outline-primary btn-sm">
                        <IconDownload className="w-4 h-4 mr-2" />
                        {t('export')}
                    </button>
                </div>
                <DataTable
                    records={bookings.slice((bookingsPage - 1) * pageSize, bookingsPage * pageSize)}
                    columns={[
                        {
                            accessor: 'bookingReference',
                            title: t('booking_reference'),
                            render: (row: ServiceBooking) => <div className="font-medium">{row.bookingReference}</div>,
                        },
                        {
                            accessor: 'tripDate',
                            title: t('trip_date'),
                            render: (row: ServiceBooking) => (
                                <div className="flex items-center gap-2">
                                    <IconCalendar className="w-4 h-4 text-gray-500" />
                                    {new Date(row.tripDate).toLocaleDateString()}
                                </div>
                            ),
                        },
                        {
                            accessor: 'quantity',
                            title: t('quantity'),
                            render: (row: ServiceBooking) => <div className="text-center">{row.quantity}</div>,
                        },
                        {
                            accessor: 'days',
                            title: t('days'),
                            render: (row: ServiceBooking) => <div className="text-center">{row.days}</div>,
                        },
                        {
                            accessor: 'bookedPrice',
                            title: t('rate'),
                            render: (row: ServiceBooking) => <div className="font-medium">₪{row.bookedPrice.toLocaleString()}</div>,
                        },
                        {
                            accessor: 'totalAmount',
                            title: t('total_earned'),
                            render: (row: ServiceBooking) => <div className="font-bold text-green-600">₪{row.totalAmount.toLocaleString()}</div>,
                        },
                        {
                            accessor: 'bookingStatus',
                            title: t('status'),
                            render: (row: ServiceBooking) => (
                                <span
                                    className={`badge ${
                                        row.bookingStatus === 'completed' ? 'badge-outline-success' : row.bookingStatus === 'confirmed' ? 'badge-outline-info' : 'badge-outline-warning'
                                    }`}
                                >
                                    {t(row.bookingStatus)}
                                </span>
                            ),
                        },
                    ]}
                    totalRecords={bookings.length}
                    recordsPerPage={pageSize}
                    page={bookingsPage}
                    onPageChange={setBookingsPage}
                    minHeight={200}
                    noRecordsText={t('no_bookings_found')}
                />
            </motion.div>

            {/* Payouts History */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="panel">
                <div className="flex items-center justify-between mb-5">
                    <h5 className="text-lg font-semibold">{t('payout_history')}</h5>
                    <button type="button" onClick={exportPayoutsToCSV} className="btn btn-outline-primary btn-sm">
                        <IconDownload className="w-4 h-4 mr-2" />
                        {t('export')}
                    </button>
                </div>
                <DataTable
                    records={payouts.slice((payoutsPage - 1) * pageSize, payoutsPage * pageSize)}
                    columns={[
                        {
                            accessor: 'paymentDate',
                            title: t('payment_date'),
                            render: (row: ServicePayout) => (
                                <div className="flex items-center gap-2">
                                    <IconCalendar className="w-4 h-4 text-gray-500" />
                                    {new Date(row.paymentDate).toLocaleDateString()}
                                </div>
                            ),
                        },
                        {
                            accessor: 'amount',
                            title: t('amount'),
                            render: (row: ServicePayout) => <div className="font-bold text-blue-600">₪{row.amount.toLocaleString()}</div>,
                        },
                        {
                            accessor: 'paymentMethod',
                            title: t('payment_method'),
                            render: (row: ServicePayout) => (
                                <span
                                    className={`badge ${
                                        row.paymentMethod === 'bank_transfer'
                                            ? 'badge-outline-primary'
                                            : row.paymentMethod === 'cash'
                                              ? 'badge-outline-success'
                                              : row.paymentMethod === 'credit_card'
                                                ? 'badge-outline-info'
                                                : 'badge-outline-warning'
                                    }`}
                                >
                                    {t(row.paymentMethod)}
                                </span>
                            ),
                        },
                        {
                            accessor: 'referenceNumber',
                            title: t('reference_number'),
                            render: (row: ServicePayout) => <div className="text-gray-600">{row.referenceNumber || '-'}</div>,
                        },
                        {
                            accessor: 'notes',
                            title: t('notes'),
                            render: (row: ServicePayout) => <div className="text-gray-500 truncate max-w-xs">{row.notes || '-'}</div>,
                        },
                    ]}
                    totalRecords={payouts.length}
                    recordsPerPage={pageSize}
                    page={payoutsPage}
                    onPageChange={setPayoutsPage}
                    minHeight={200}
                    noRecordsText={t('no_payouts_found')}
                />
            </motion.div>
        </div>
    );
};

export default MyBalance;
