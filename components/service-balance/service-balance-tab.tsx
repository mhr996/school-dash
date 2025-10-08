'use client';
import { useEffect, useState } from 'react';
import { DataTable } from 'mantine-datatable';
import IconDollarSign from '@/components/icon/icon-dollar-sign';
import IconCashBanknotes from '@/components/icon/icon-cash-banknotes';
import IconCreditCard from '@/components/icon/icon-credit-card';
import IconClock from '@/components/icon/icon-clock';
import { getTranslation } from '@/i18n';
import { calculateServiceProviderBalance, getServiceProviderPayouts, ServiceType, ServiceProviderBalance, ServicePayout } from '@/utils/service-balance-manager';

interface ServiceBalanceTabProps {
    serviceType: ServiceType;
    serviceId: string;
}

const ServiceBalanceTab = ({ serviceType, serviceId }: ServiceBalanceTabProps) => {
    const { t } = getTranslation();
    const [loading, setLoading] = useState(true);
    const [balanceData, setBalanceData] = useState<ServiceProviderBalance | null>(null);
    const [payouts, setPayouts] = useState<ServicePayout[]>([]);

    useEffect(() => {
        const fetchBalanceData = async () => {
            try {
                setLoading(true);

                // Fetch balance overview
                const balance = await calculateServiceProviderBalance(serviceType, serviceId);
                setBalanceData(balance);

                // Fetch payout history
                const payoutHistory = await getServiceProviderPayouts(serviceType, serviceId);
                setPayouts(payoutHistory);
            } catch (error) {
                console.error('Error fetching balance data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBalanceData();
    }, [serviceType, serviceId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!balanceData) {
        return (
            <div className="panel">
                <div className="text-center py-12">
                    <p className="text-gray-500">{t('error_loading_balance_data')}</p>
                </div>
            </div>
        );
    }

    const formatCurrency = (amount: number) => {
        return `₪${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getPaymentMethodLabel = (method: string) => {
        const methodMap: { [key: string]: string } = {
            cash: t('cash'),
            bank_transfer: t('bank_transfer'),
            credit_card: t('credit_card'),
            check: t('check'),
        };
        return methodMap[method] || method;
    };

    return (
        <div className="space-y-6">
            {/* Balance Overview */}
            <div className="panel">
                <div className="mb-5">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <IconCreditCard className="w-5 h-5 text-primary" />
                        {t('balance_overview')}
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Earned */}
                    <div className="p-5 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('total_earned')}</span>
                            <IconDollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(balanceData.totalEarned)}</div>
                        <div className="text-xs text-gray-500 mt-2">
                            {balanceData.bookingCount} {t('bookings')}
                        </div>
                    </div>

                    {/* Total Paid Out */}
                    <div className="p-5 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('total_paid_out')}</span>
                            <IconCashBanknotes className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="text-2xl font-bold text-orange-600">{formatCurrency(balanceData.totalPaidOut)}</div>
                        <div className="text-xs text-gray-500 mt-2">
                            {balanceData.payoutCount} {t('payouts')}
                        </div>
                    </div>

                    {/* Net Balance */}
                    <div
                        className={`p-5 rounded-lg border ${
                            balanceData.netBalance > 0
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                : balanceData.netBalance < 0
                                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('net_balance')}</span>
                            <IconCreditCard className={`w-5 h-5 ${balanceData.netBalance > 0 ? 'text-blue-600' : balanceData.netBalance < 0 ? 'text-red-600' : 'text-gray-500'}`} />
                        </div>
                        <div className={`text-2xl font-bold ${balanceData.netBalance > 0 ? 'text-blue-600' : balanceData.netBalance < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                            {formatCurrency(balanceData.netBalance)}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                            {balanceData.netBalance > 0 ? t('amount_owed_to_provider') : balanceData.netBalance < 0 ? t('provider_owes_platform') : t('balance_settled')}
                        </div>
                    </div>
                </div>

                {/* Last Activity */}
                {(balanceData.lastBookingDate || balanceData.lastPayoutDate) && (
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {balanceData.lastBookingDate && (
                                <div className="flex items-center gap-2 text-sm">
                                    <IconClock className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-600 dark:text-gray-400">{t('last_booking')}:</span>
                                    <span className="font-semibold">{formatDate(balanceData.lastBookingDate)}</span>
                                </div>
                            )}
                            {balanceData.lastPayoutDate && (
                                <div className="flex items-center gap-2 text-sm">
                                    <IconClock className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-600 dark:text-gray-400">{t('last_payout')}:</span>
                                    <span className="font-semibold">{formatDate(balanceData.lastPayoutDate)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Payout History */}
            <div className="panel">
                <div className="mb-5">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <IconCashBanknotes className="w-5 h-5 text-primary" />
                        {t('payout_history')}
                    </h3>
                </div>

                {payouts.length === 0 ? (
                    <div className="text-center py-12">
                        <IconCashBanknotes className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500">{t('no_payouts_found')}</p>
                        <p className="text-sm text-gray-400 mt-2">{t('payouts_will_appear_here')}</p>
                    </div>
                ) : (
                    <div className="datatables">
                        <DataTable
                            className="table-hover whitespace-nowrap"
                            records={payouts}
                            columns={[
                                {
                                    accessor: 'payment_date',
                                    title: t('date'),
                                    sortable: true,
                                    render: ({ paymentDate }) => formatDate(paymentDate),
                                },
                                {
                                    accessor: 'amount',
                                    title: t('amount'),
                                    sortable: true,
                                    render: ({ amount }) => <span className="font-semibold text-green-600">{formatCurrency(amount)}</span>,
                                },
                                {
                                    accessor: 'payment_method',
                                    title: t('payment_method'),
                                    render: ({ paymentMethod }) => <span className="badge badge-outline-info">{getPaymentMethodLabel(paymentMethod)}</span>,
                                },
                                {
                                    accessor: 'reference_number',
                                    title: t('reference_number'),
                                    render: ({ referenceNumber }) => <span className="text-sm text-gray-600 dark:text-gray-400">{referenceNumber || '-'}</span>,
                                },
                                {
                                    accessor: 'description',
                                    title: t('description'),
                                    render: ({ description }) => <span className="text-sm text-gray-600 dark:text-gray-400">{description || '-'}</span>,
                                },
                                {
                                    accessor: 'created_by_name',
                                    title: t('processed_by'),
                                    render: ({ createdByName }) => <span className="text-sm text-gray-600 dark:text-gray-400">{createdByName || '-'}</span>,
                                },
                            ]}
                            minHeight={200}
                            noRecordsText={t('no_payouts_found')}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ServiceBalanceTab;
