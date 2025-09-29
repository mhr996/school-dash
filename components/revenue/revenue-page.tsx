'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getTranslation } from '@/i18n';

// Components
import RevenueCard from '@/components/revenue/revenue-card';
import RevenueChart from '@/components/revenue/revenue-chart';
import ServiceBreakdownChart from '@/components/revenue/service-breakdown-chart';
import TransactionsTable from '@/components/revenue/transactions-table';

// Icons
import IconDollarSign from '@/components/icon/icon-dollar-sign';
import IconCreditCard from '@/components/icon/icon-credit-card';
import IconClock from '@/components/icon/icon-clock';
import IconTrendingUp from '@/components/icon/icon-trending-up';
import IconRefresh from '@/components/icon/icon-refresh';
import IconDownload from '@/components/icon/icon-download';

// Interfaces
interface RevenueStats {
    totalRevenue: number;
    totalPaid: number;
    totalPending: number;
    totalBills: number;
    revenueGrowth: number;
    paymentsGrowth: number;
    pendingGrowth: number;
    averageTransactionGrowth: number;
    monthlyRevenue: Array<{ month: string; revenue: number }>;
    serviceBreakdown: Array<{
        serviceType: string;
        revenue: number;
        count: number;
        percentage: number;
    }>;
}

interface TransactionRecord {
    id: string;
    amount: number;
    payment_type: string;
    payment_date: string;
    bill_number: string;
    customer_name: string;
    status: string;
    notes?: string;
}

interface BalanceInfo {
    totalEarnings: number;
    totalReceived: number;
    pendingPayments: number;
    outstandingAmount: number;
    averageTransactionValue: number;
}

interface RevenueChartData {
    month: string;
    revenue: number;
    payments: number;
}

const RevenuePage: React.FC = () => {
    const { t } = getTranslation();

    // State
    const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
    const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
    const [balance, setBalance] = useState<BalanceInfo | null>(null);
    const [revenueTrend, setRevenueTrend] = useState<RevenueChartData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch data
    const fetchData = async () => {
        try {
            setRefreshing(true);

            const [revenueRes, transactionsRes, balanceRes, trendRes] = await Promise.all([
                fetch('/api/services/revenue'),
                fetch('/api/services/transactions?limit=50'),
                fetch('/api/services/balance'),
                fetch('/api/services/revenue-trend'),
            ]);

            if (revenueRes.ok) {
                const revenueData = await revenueRes.json();
                setRevenueStats(revenueData);
            }

            if (transactionsRes.ok) {
                const transactionsData = await transactionsRes.json();
                setTransactions(transactionsData);
            }

            if (balanceRes.ok) {
                const balanceData = await balanceRes.json();
                setBalance(balanceData);
            }

            if (trendRes.ok) {
                const trendData = await trendRes.json();
                setRevenueTrend(trendData);
            }
        } catch (error) {
            console.error('Error fetching revenue data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 p-6" dir={t('direction') || 'rtl'}>
            <div className="container mx-auto max-w-7xl">
                {/* Header */}
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('revenue_dashboard')}</h1>
                            <p className="text-gray-600 dark:text-gray-400">{t('revenue_dashboard_subtitle')}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={fetchData} disabled={refreshing} className="btn btn-outline-primary btn-sm">
                                <IconRefresh className={`w-4 h-4 ltr:mr-2 rtl:ml-2 ${refreshing ? 'animate-spin' : ''}`} />
                                {refreshing ? t('refreshing') : t('refresh')}
                            </button>
                            <button className="btn btn-primary btn-sm">
                                <IconDownload className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                                {t('export_report')}
                            </button>
                        </div>
                    </div>

                    {/* Quick Stats Bar */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-slate-700/50"
                    >
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-gray-600 dark:text-gray-400">{t('system_active')}</span>
                                </div>
                                <div className="text-gray-600 dark:text-gray-400">
                                    {t('last_updated')}: {new Date().toLocaleDateString('tr-TR')}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-gray-600 dark:text-gray-400">
                                    {t('total_services')}: {revenueStats?.serviceBreakdown?.length || 0}
                                </span>
                                <span className="text-gray-600 dark:text-gray-400">
                                    {t('active_bookings')}: {revenueStats?.totalBills || 0}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Revenue Cards */}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <RevenueCard
                        title={t('total_revenue')}
                        value={`$${revenueStats?.totalRevenue?.toLocaleString() || '0'}`}
                        subtitle={t('period_revenue')}
                        icon={<IconDollarSign />}
                        color="blue"
                        isLoading={loading}
                        trend={(revenueStats?.revenueGrowth || 0) >= 0 ? 'up' : 'down'}
                        trendValue={`${(revenueStats?.revenueGrowth || 0) >= 0 ? '+' : ''}${(revenueStats?.revenueGrowth || 0).toFixed(1)}%`}
                    />
                    <RevenueCard
                        title={t('payments_received')}
                        value={`$${revenueStats?.totalPaid?.toLocaleString() || '0'}`}
                        subtitle={t('completed_transactions')}
                        icon={<IconCreditCard />}
                        color="green"
                        isLoading={loading}
                        trend={(revenueStats?.paymentsGrowth || 0) >= 0 ? 'up' : 'down'}
                        trendValue={`${(revenueStats?.paymentsGrowth || 0) >= 0 ? '+' : ''}${(revenueStats?.paymentsGrowth || 0).toFixed(1)}%`}
                    />
                    <RevenueCard
                        title={t('pending_payments')}
                        value={`$${revenueStats?.totalPending?.toLocaleString() || '0'}`}
                        subtitle={t('pending_balance')}
                        icon={<IconClock />}
                        color="orange"
                        isLoading={loading}
                        trend={(revenueStats?.pendingGrowth || 0) >= 0 ? 'up' : 'down'}
                        trendValue={`${(revenueStats?.pendingGrowth || 0) >= 0 ? '+' : ''}${(revenueStats?.pendingGrowth || 0).toFixed(1)}%`}
                    />
                    <RevenueCard
                        title={t('transaction_reference')}
                        value={`$${balance?.averageTransactionValue?.toFixed(0) || '0'}`}
                        subtitle={t('revenue_metrics')}
                        icon={<IconTrendingUp />}
                        color="purple"
                        isLoading={loading}
                        trend={(revenueStats?.averageTransactionGrowth || 0) >= 0 ? 'up' : 'down'}
                        trendValue={`${(revenueStats?.averageTransactionGrowth || 0) >= 0 ? '+' : ''}${(revenueStats?.averageTransactionGrowth || 0).toFixed(1)}%`}
                    />
                </motion.div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Revenue Trend Chart */}
                    <div className="lg:col-span-2">
                        <RevenueChart data={revenueTrend} isLoading={loading} />
                    </div>

                    {/* Service Breakdown */}
                    <div>
                        <ServiceBreakdownChart data={revenueStats?.serviceBreakdown || []} isLoading={loading} />
                    </div>
                </div>

                {/* Transactions Table */}
                <TransactionsTable transactions={transactions} isLoading={loading} />
            </div>
        </div>
    );
};

export default RevenuePage;
