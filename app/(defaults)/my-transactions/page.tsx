'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTranslation } from '@/i18n';
import supabase from '@/lib/supabase';
import { getCurrentUserWithRole } from '@/lib/auth';
import IconCreditCard from '@/components/icon/icon-credit-card';
import IconCalendar from '@/components/icon/icon-calendar';
import IconDollarSign from '@/components/icon/icon-dollar-sign';
import IconSearch from '@/components/icon/icon-search';
import IconFilter from '@/components/icon/icon-filter';
import IconDownload from '@/components/icon/icon-download';
import IconEye from '@/components/icon/icon-eye';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconUser from '@/components/icon/icon-user';
import IconTrendingUp from '@/components/icon/icon-trending-up';
import IconTrendingDown from '@/components/icon/icon-trending-down';

type Transaction = {
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
    created_at: string;
    updated_at: string;
    // Related booking info
    booking?: {
        id: string;
        booking_reference: string;
        trip_date: string;
        destination?: {
            name: string;
            address: string;
        };
    };
};

type TransactionSummary = {
    total_spent: number;
    total_transactions: number;
    pending_amount: number;
    completed_payments: number;
    this_month_spent: number;
    last_month_spent: number;
};

type FilterType = 'all' | 'paid' | 'pending' | 'cancelled';

const statusColors = {
    draft: 'bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-200/50 dark:border-gray-600/30',
    issued: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-600/30',
    paid: 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-200/50 dark:border-green-600/30',
    cancelled: 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-200/50 dark:border-red-600/30',
    complete: 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-200/50 dark:border-green-600/30',
    incomplete: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-200/50 dark:border-yellow-600/30',
};

const billTypeColors = {
    tax_invoice: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200/50 dark:border-purple-600/30',
    receipt: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-200/50 dark:border-cyan-600/30',
};

export default function MyTransactionsPage() {
    const [user, setUser] = useState<any>(null);
    const [t, setT] = useState<any>({});
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
    const [summary, setSummary] = useState<TransactionSummary>({
        total_spent: 0,
        total_transactions: 0,
        pending_amount: 0,
        completed_payments: 0,
        this_month_spent: 0,
        last_month_spent: 0,
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [showTransactionDetails, setShowTransactionDetails] = useState(false);

    useEffect(() => {
        const loadTranslations = async () => {
            const translations = await getTranslation();
            setT(translations);
        };
        loadTranslations();
    }, []);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const { user: userData, error } = await getCurrentUserWithRole();
                if (userData && !error) {
                    setUser(userData);
                }
            } catch (error) {
                console.error('Error loading user:', error);
            }
        };
        loadUser();
    }, []);

    const fetchTransactions = async () => {
        if (!user?.email) return;

        try {
            setLoading(true);

            // Fetch bills/transactions for the user
            const { data: billsData, error: billsError } = await supabase
                .from('bills')
                .select(
                    `
                    *,
                    bookings!inner(
                        id,
                        booking_reference,
                        trip_date,
                        destinations(
                            name,
                            address
                        )
                    )
                `,
                )
                .eq('customer_email', user.email)
                .order('created_at', { ascending: false });

            if (billsError) throw billsError;

            // Transform data to include booking info
            const transformedTransactions =
                billsData?.map((bill) => ({
                    ...bill,
                    booking: bill.bookings,
                })) || [];

            setTransactions(transformedTransactions);

            // Calculate summary
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

            const summaryData = transformedTransactions.reduce(
                (acc, transaction) => {
                    const transactionDate = new Date(transaction.created_at);
                    const isThisMonth = transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
                    const isLastMonth = transactionDate.getMonth() === lastMonth && transactionDate.getFullYear() === lastMonthYear;

                    acc.total_transactions += 1;

                    if (transaction.status === 'paid' || transaction.status === 'complete') {
                        acc.total_spent += transaction.total_amount;
                        acc.completed_payments += 1;

                        if (isThisMonth) {
                            acc.this_month_spent += transaction.total_amount;
                        }
                        if (isLastMonth) {
                            acc.last_month_spent += transaction.total_amount;
                        }
                    } else if (transaction.status === 'issued' || transaction.status === 'incomplete') {
                        acc.pending_amount += transaction.total_amount;
                    }

                    return acc;
                },
                {
                    total_spent: 0,
                    total_transactions: 0,
                    pending_amount: 0,
                    completed_payments: 0,
                    this_month_spent: 0,
                    last_month_spent: 0,
                },
            );

            setSummary(summaryData);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [user?.email]);

    useEffect(() => {
        let filtered = transactions;

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(
                (transaction) =>
                    transaction.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    transaction.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    transaction.booking?.destination?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()),
            );
        }

        // Apply status filter
        if (filterType !== 'all') {
            filtered = filtered.filter((transaction) => {
                switch (filterType) {
                    case 'paid':
                        return transaction.status === 'paid' || transaction.status === 'complete';
                    case 'pending':
                        return transaction.status === 'issued' || transaction.status === 'incomplete';
                    case 'cancelled':
                        return transaction.status === 'cancelled';
                    default:
                        return true;
                }
            });
        }

        setFilteredTransactions(filtered);
    }, [transactions, searchTerm, filterType]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const getMonthlyChange = () => {
        if (summary.last_month_spent === 0) return { percentage: 0, isIncrease: false };
        const change = ((summary.this_month_spent - summary.last_month_spent) / summary.last_month_spent) * 100;
        return { percentage: Math.abs(change), isIncrease: change > 0 };
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.3,
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.5 },
        },
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 min-h-screen">
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{t.my_transactions || 'My Transactions'}</h1>
                        <p className="text-gray-600 dark:text-gray-300">{t.my_transactions_description || 'Track your payment history and transaction details'}</p>
                    </div>
                </motion.div>

                {/* Summary Cards */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Spent */}
                    <div className="bg-white/20 dark:bg-slate-900/30 backdrop-blur-xl rounded-2xl p-6 border border-white/30 dark:border-slate-700/40 shadow-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.total_spent || 'Total Spent'}</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(summary.total_spent)}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                                <IconDollarSign className="w-6 h-6 text-green-500" />
                            </div>
                        </div>
                    </div>

                    {/* Total Transactions */}
                    <div className="bg-white/20 dark:bg-slate-900/30 backdrop-blur-xl rounded-2xl p-6 border border-white/30 dark:border-slate-700/40 shadow-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.total_transactions || 'Total Transactions'}</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total_transactions}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                                <IconCreditCard className="w-6 h-6 text-blue-500" />
                            </div>
                        </div>
                    </div>

                    {/* Pending Amount */}
                    <div className="bg-white/20 dark:bg-slate-900/30 backdrop-blur-xl rounded-2xl p-6 border border-white/30 dark:border-slate-700/40 shadow-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.pending_amount || 'Pending Amount'}</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(summary.pending_amount)}</p>
                            </div>
                            <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                                <IconCalendar className="w-6 h-6 text-yellow-500" />
                            </div>
                        </div>
                    </div>

                    {/* Monthly Change */}
                    <div className="bg-white/20 dark:bg-slate-900/30 backdrop-blur-xl rounded-2xl p-6 border border-white/30 dark:border-slate-700/40 shadow-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.this_month || 'This Month'}</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(summary.this_month_spent)}</p>
                                {summary.last_month_spent > 0 && (
                                    <div className="flex items-center mt-1">
                                        {getMonthlyChange().isIncrease ? <IconTrendingUp className="w-4 h-4 text-red-500 mr-1" /> : <IconTrendingDown className="w-4 h-4 text-green-500 mr-1" />}
                                        <span className={`text-sm ${getMonthlyChange().isIncrease ? 'text-red-500' : 'text-green-500'}`}>{getMonthlyChange().percentage.toFixed(1)}%</span>
                                    </div>
                                )}
                            </div>
                            <div className={`w-12 h-12 ${getMonthlyChange().isIncrease ? 'bg-red-500/20' : 'bg-green-500/20'} rounded-full flex items-center justify-center`}>
                                {getMonthlyChange().isIncrease ? <IconTrendingUp className="w-6 h-6 text-red-500" /> : <IconTrendingDown className="w-6 h-6 text-green-500" />}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Search and Filters */}
                <motion.div variants={itemVariants} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-slate-700/40 p-6 shadow-xl">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder={t.search_transactions || 'Search transactions...'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-gray-200/50 dark:border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                            />
                        </div>

                        {/* Filter Buttons */}
                        <div className="flex flex-wrap gap-2">
                            {(['all', 'paid', 'pending', 'cancelled'] as FilterType[]).map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setFilterType(filter)}
                                    className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                                        filterType === filter
                                            ? 'bg-blue-500 text-white shadow-lg'
                                            : 'bg-white/50 dark:bg-slate-700/50 hover:bg-white/70 dark:hover:bg-slate-700/70 text-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    {t[`filter_${filter}`] || filter.charAt(0).toUpperCase() + filter.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Transactions List */}
                <motion.div variants={itemVariants}>
                    {filteredTransactions.length > 0 ? (
                        <div className="space-y-4">
                            {filteredTransactions.map((transaction, index) => (
                                <motion.div
                                    key={transaction.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{
                                        y: -2,
                                        scale: 1.01,
                                        transition: { type: 'spring', stiffness: 400, damping: 25 },
                                    }}
                                    className="group cursor-pointer"
                                    onClick={() => {
                                        setSelectedTransaction(transaction);
                                        setShowTransactionDetails(true);
                                    }}
                                >
                                    <div className="relative bg-white/20 dark:bg-slate-900/30 backdrop-blur-xl rounded-2xl p-6 border border-white/30 dark:border-slate-700/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:bg-white/30 dark:hover:bg-slate-900/40 hover:border-white/50 dark:hover:border-slate-600/60">
                                        {/* Status and Type Badges */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex gap-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm border ${statusColors[transaction.status]}`}>
                                                    {t[`status_${transaction.status}`] || transaction.status}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm border ${billTypeColors[transaction.bill_type]}`}>
                                                    {t[`bill_type_${transaction.bill_type}`] || transaction.bill_type.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(transaction.total_amount)}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {t.bill_number || 'Bill'}: {transaction.bill_number}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Transaction Details */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {/* Destination */}
                                            {transaction.booking?.destination && (
                                                <div className="flex items-center text-gray-700 dark:text-gray-200">
                                                    <IconMapPin className="h-4 w-4 ltr:mr-2 rtl:ml-2 flex-shrink-0" />
                                                    <span className="text-sm truncate drop-shadow-sm">{transaction.booking.destination.name}</span>
                                                </div>
                                            )}

                                            {/* Trip Date */}
                                            {transaction.booking?.trip_date && (
                                                <div className="flex items-center text-gray-700 dark:text-gray-200">
                                                    <IconCalendar className="h-4 w-4 ltr:mr-2 rtl:ml-2 flex-shrink-0" />
                                                    <span className="text-sm drop-shadow-sm">{formatDate(transaction.booking.trip_date)}</span>
                                                </div>
                                            )}

                                            {/* Payment Method */}
                                            {transaction.payment_method && (
                                                <div className="flex items-center text-gray-700 dark:text-gray-200">
                                                    <IconCreditCard className="h-4 w-4 ltr:mr-2 rtl:ml-2 flex-shrink-0" />
                                                    <span className="text-sm drop-shadow-sm">{transaction.payment_method}</span>
                                                </div>
                                            )}

                                            {/* Issue Date */}
                                            <div className="flex items-center text-gray-700 dark:text-gray-200">
                                                <IconCalendar className="h-4 w-4 ltr:mr-2 rtl:ml-2 flex-shrink-0" />
                                                <span className="text-sm drop-shadow-sm">
                                                    {t.issued || 'Issued'}: {formatDate(transaction.issue_date)}
                                                </span>
                                            </div>

                                            {/* Paid Date */}
                                            {transaction.paid_date && (
                                                <div className="flex items-center text-gray-700 dark:text-gray-200">
                                                    <IconDollarSign className="h-4 w-4 ltr:mr-2 rtl:ml-2 flex-shrink-0 text-green-500" />
                                                    <span className="text-sm drop-shadow-sm">
                                                        {t.paid || 'Paid'}: {formatDate(transaction.paid_date)}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Customer Name */}
                                            <div className="flex items-center text-gray-700 dark:text-gray-200">
                                                <IconUser className="h-4 w-4 ltr:mr-2 rtl:ml-2 flex-shrink-0" />
                                                <span className="text-sm drop-shadow-sm">{transaction.customer_name}</span>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        {transaction.description && (
                                            <div className="mt-4 pt-4 border-t border-gray-200/30 dark:border-gray-700/30">
                                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{transaction.description}</p>
                                            </div>
                                        )}

                                        {/* Breakdown */}
                                        <div className="mt-4 pt-4 border-t border-gray-200/30 dark:border-gray-700/30">
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-600 dark:text-gray-400">{t.subtotal || 'Subtotal'}:</span>
                                                    <span className="ml-2 font-semibold text-gray-900 dark:text-white">{formatCurrency(transaction.subtotal)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600 dark:text-gray-400">
                                                        {t.tax || 'Tax'} ({transaction.tax_rate}%):
                                                    </span>
                                                    <span className="ml-2 font-semibold text-gray-900 dark:text-white">{formatCurrency(transaction.tax_amount)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600 dark:text-gray-400">{t.total || 'Total'}:</span>
                                                    <span className="ml-2 font-bold text-green-600 dark:text-green-400">{formatCurrency(transaction.total_amount)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <motion.div variants={itemVariants} className="text-center py-12 bg-white/20 dark:bg-slate-900/30 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-slate-700/40">
                            <IconCreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t.no_transactions_found || 'No transactions found'}</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                {searchTerm || filterType !== 'all'
                                    ? t.no_transactions_match_filter || 'No transactions match your current filter'
                                    : t.no_transactions_yet || "You haven't made any transactions yet"}
                            </p>
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>

            {/* Transaction Details Modal */}
            <AnimatePresence>
                {showTransactionDetails && selectedTransaction && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowTransactionDetails(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.transaction_details || 'Transaction Details'}</h2>
                                <button onClick={() => setShowTransactionDetails(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Basic Info */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">{t.basic_information || 'Basic Information'}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.bill_number || 'Bill Number'}</label>
                                            <p className="text-gray-900 dark:text-white">{selectedTransaction.bill_number}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.bill_type || 'Bill Type'}</label>
                                            <p className="text-gray-900 dark:text-white">{t[`bill_type_${selectedTransaction.bill_type}`] || selectedTransaction.bill_type.replace('_', ' ')}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.status || 'Status'}</label>
                                            <p className="text-gray-900 dark:text-white">{t[`status_${selectedTransaction.status}`] || selectedTransaction.status}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.payment_method || 'Payment Method'}</label>
                                            <p className="text-gray-900 dark:text-white">{selectedTransaction.payment_method || t.not_specified || 'Not specified'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Amount Breakdown */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">{t.amount_breakdown || 'Amount Breakdown'}</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">{t.subtotal || 'Subtotal'}:</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedTransaction.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">
                                                {t.tax || 'Tax'} ({selectedTransaction.tax_rate}%):
                                            </span>
                                            <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedTransaction.tax_amount)}</span>
                                        </div>
                                        <hr className="border-gray-200 dark:border-gray-700" />
                                        <div className="flex justify-between text-lg">
                                            <span className="font-semibold text-gray-900 dark:text-white">{t.total || 'Total'}:</span>
                                            <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(selectedTransaction.total_amount)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Dates */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">{t.important_dates || 'Important Dates'}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.issue_date || 'Issue Date'}</label>
                                            <p className="text-gray-900 dark:text-white">{formatDate(selectedTransaction.issue_date)}</p>
                                        </div>
                                        {selectedTransaction.due_date && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.due_date || 'Due Date'}</label>
                                                <p className="text-gray-900 dark:text-white">{formatDate(selectedTransaction.due_date)}</p>
                                            </div>
                                        )}
                                        {selectedTransaction.paid_date && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.paid_date || 'Paid Date'}</label>
                                                <p className="text-gray-900 dark:text-white">{formatDate(selectedTransaction.paid_date)}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Trip Information */}
                                {selectedTransaction.booking && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3">{t.trip_information || 'Trip Information'}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.booking_reference || 'Booking Reference'}</label>
                                                <p className="text-gray-900 dark:text-white">{selectedTransaction.booking.booking_reference}</p>
                                            </div>
                                            {selectedTransaction.booking.destination && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.destination || 'Destination'}</label>
                                                    <p className="text-gray-900 dark:text-white">{selectedTransaction.booking.destination.name}</p>
                                                </div>
                                            )}
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.trip_date || 'Trip Date'}</label>
                                                <p className="text-gray-900 dark:text-white">{formatDate(selectedTransaction.booking.trip_date)}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Description and Notes */}
                                {(selectedTransaction.description || selectedTransaction.notes) && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3">{t.additional_information || 'Additional Information'}</h3>
                                        {selectedTransaction.description && (
                                            <div className="mb-4">
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.description || 'Description'}</label>
                                                <p className="text-gray-700 dark:text-gray-300">{selectedTransaction.description}</p>
                                            </div>
                                        )}
                                        {selectedTransaction.notes && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t.notes || 'Notes'}</label>
                                                <p className="text-gray-700 dark:text-gray-300">{selectedTransaction.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
