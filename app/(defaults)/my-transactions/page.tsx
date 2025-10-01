'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTranslation } from '@/i18n';
import supabase from '@/lib/supabase';
import { getCurrentUserWithRole } from '@/lib/auth';
import Dropdown from '@/components/dropdown';
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
import IconCheck from '@/components/icon/icon-check';

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
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS',
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
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900">
                <div className="relative">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-t-4 border-purple-600"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <IconCreditCard className="w-12 h-12 text-purple-600 animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900 p-6">
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 p-8 shadow-2xl">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30">
                                <IconCreditCard className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-4xl font-bold text-white drop-shadow-lg">{t.my_transactions || 'My Transactions'}</h1>
                        </div>
                        <p className="text-white/90 text-lg drop-shadow-md">{t.my_transactions_description || 'Track your payment history and transaction details'}</p>
                    </div>
                </motion.div>

                {/* Summary Cards */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Spent */}
                    <div className="group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-purple-200/50 dark:border-purple-500/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t.total_spent || 'Total Spent'}</p>
                                    <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">{formatCurrency(summary.total_spent)}</p>
                                </div>
                                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <IconDollarSign className="w-7 h-7 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Transactions */}
                    <div className="group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-blue-200/50 dark:border-blue-500/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t.total_transactions || 'Total Transactions'}</p>
                                    <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{summary.total_transactions}</p>
                                </div>
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <IconCreditCard className="w-7 h-7 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pending Amount */}
                    <div className="group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-amber-200/50 dark:border-amber-500/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t.pending_amount || 'Pending Amount'}</p>
                                    <p className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">{formatCurrency(summary.pending_amount)}</p>
                                </div>
                                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <IconCalendar className="w-7 h-7 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Change */}
                    <div className="group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-emerald-200/50 dark:border-emerald-500/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t.this_month || 'This Month'}</p>
                                    <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{formatCurrency(summary.this_month_spent)}</p>
                                    {summary.last_month_spent > 0 && (
                                        <div className="flex items-center mt-2 gap-1">
                                            {getMonthlyChange().isIncrease ? <IconTrendingUp className="w-4 h-4 text-red-500" /> : <IconTrendingDown className="w-4 h-4 text-emerald-500" />}
                                            <span className={`text-sm font-semibold ${getMonthlyChange().isIncrease ? 'text-red-500' : 'text-emerald-500'}`}>
                                                {getMonthlyChange().percentage.toFixed(1)}%
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div
                                    className={`w-14 h-14 ${getMonthlyChange().isIncrease ? 'bg-gradient-to-br from-red-500 to-rose-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'} rounded-2xl flex items-center justify-center shadow-lg`}
                                >
                                    {getMonthlyChange().isIncrease ? <IconTrendingUp className="w-7 h-7 text-white" /> : <IconTrendingDown className="w-7 h-7 text-white" />}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Search and Filters */}
                <motion.div variants={itemVariants} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-purple-200/50 dark:border-purple-500/30 p-6 shadow-xl">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative group">
                            <IconSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors duration-200" />
                            <input
                                type="text"
                                placeholder={t.search_transactions || 'Search transactions...'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 text-gray-900 dark:text-white placeholder:text-gray-400"
                            />
                        </div>

                        {/* Status Filter Dropdown */}
                        <div className="w-full lg:w-64">
                            <Dropdown
                                placement="bottom-end"
                                btnClassName="w-full px-4 py-3.5 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl hover:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 flex items-center justify-between gap-2 text-gray-900 dark:text-white"
                                button={
                                    <>
                                        <div className="flex items-center gap-2">
                                            <IconFilter className="w-4 h-4 text-purple-500" />
                                            <span className="font-medium">
                                                {filterType === 'all'
                                                    ? t.filter_all || 'All Transactions'
                                                    : filterType === 'paid'
                                                      ? t.filter_paid || 'Paid'
                                                      : filterType === 'pending'
                                                        ? t.filter_pending || 'Pending'
                                                        : t.filter_cancelled || 'Cancelled'}
                                            </span>
                                        </div>
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </>
                                }
                            >
                                <ul className="w-64 !py-2 text-sm font-medium">
                                    {(['all', 'paid', 'pending', 'cancelled'] as FilterType[]).map((filter) => (
                                        <li key={filter}>
                                            <button
                                                type="button"
                                                onClick={() => setFilterType(filter)}
                                                className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-150 ${
                                                    filterType === filter ? 'text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/10' : 'text-gray-700 dark:text-gray-300'
                                                }`}
                                            >
                                                <span>
                                                    {filter === 'all'
                                                        ? t.filter_all || 'All Transactions'
                                                        : filter === 'paid'
                                                          ? t.filter_paid || 'Paid'
                                                          : filter === 'pending'
                                                            ? t.filter_pending || 'Pending'
                                                            : t.filter_cancelled || 'Cancelled'}
                                                </span>
                                                {filterType === filter && <IconCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </Dropdown>
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
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{
                                        y: -4,
                                        scale: 1.005,
                                        transition: { type: 'spring', stiffness: 400, damping: 25 },
                                    }}
                                    className="group cursor-pointer"
                                    onClick={() => {
                                        setSelectedTransaction(transaction);
                                        setShowTransactionDetails(true);
                                    }}
                                >
                                    <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-purple-200/50 dark:border-purple-500/30 shadow-xl hover:shadow-2xl transition-all duration-500 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:border-purple-300/60 dark:hover:border-purple-400/40">
                                        {/* Hover Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-fuchsia-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                        {/* Content */}
                                        <div className="relative">
                                            {/* Status and Type Badges */}
                                            <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                                                <div className="flex gap-2 flex-wrap">
                                                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm border shadow-sm ${statusColors[transaction.status]}`}>
                                                        {t[`status_${transaction.status}`] || transaction.status}
                                                    </span>
                                                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm border shadow-sm ${billTypeColors[transaction.bill_type]}`}>
                                                        {t[`bill_type_${transaction.bill_type}`] || transaction.bill_type.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                                                        {formatCurrency(transaction.total_amount)}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                                        {t.bill_number || 'Bill'}: {transaction.bill_number}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Transaction Details */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {/* Destination */}
                                                {transaction.booking?.destination && (
                                                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                                                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <IconMapPin className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                                        </div>
                                                        <span className="text-sm truncate font-medium">{transaction.booking.destination.name}</span>
                                                    </div>
                                                )}

                                                {/* Trip Date */}
                                                {transaction.booking?.trip_date && (
                                                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                                                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <IconCalendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        <span className="text-sm font-medium">{formatDate(transaction.booking.trip_date)}</span>
                                                    </div>
                                                )}

                                                {/* Payment Method */}
                                                {transaction.payment_method && (
                                                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                                                        <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <IconCreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                        </div>
                                                        <span className="text-sm font-medium">{transaction.payment_method}</span>
                                                    </div>
                                                )}

                                                {/* Issue Date */}
                                                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                                                    <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <IconCalendar className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                                    </div>
                                                    <span className="text-sm font-medium">
                                                        {t.issued || 'Issued'}: {formatDate(transaction.issue_date)}
                                                    </span>
                                                </div>

                                                {/* Paid Date */}
                                                {transaction.paid_date && (
                                                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                                                        <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <IconDollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                        </div>
                                                        <span className="text-sm font-medium">
                                                            {t.paid || 'Paid'}: {formatDate(transaction.paid_date)}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Customer Name */}
                                                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                                                    <div className="w-8 h-8 bg-fuchsia-100 dark:bg-fuchsia-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <IconUser className="h-4 w-4 text-fuchsia-600 dark:text-fuchsia-400" />
                                                    </div>
                                                    <span className="text-sm font-medium">{transaction.customer_name}</span>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            {transaction.description && (
                                                <div className="mt-4 pt-4 border-t border-purple-200/30 dark:border-purple-700/30">
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{transaction.description}</p>
                                                </div>
                                            )}

                                            {/* Breakdown */}
                                            <div className="mt-4 pt-4 border-t border-purple-200/30 dark:border-purple-700/30">
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-500 dark:text-gray-400 mb-1">{t.subtotal || 'Subtotal'}:</span>
                                                        <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(transaction.subtotal)}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-500 dark:text-gray-400 mb-1">
                                                            {t.tax || 'Tax'} ({transaction.tax_rate}%):
                                                        </span>
                                                        <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(transaction.tax_amount)}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-500 dark:text-gray-400 mb-1">{t.total || 'Total'}:</span>
                                                        <span className="font-bold text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text">
                                                            {formatCurrency(transaction.total_amount)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <motion.div
                            variants={itemVariants}
                            className="text-center py-16 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-purple-200/50 dark:border-purple-500/30 shadow-xl"
                        >
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-fuchsia-100 dark:from-purple-900/30 dark:to-fuchsia-900/30 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                <IconCreditCard className="h-10 w-10 text-purple-500 dark:text-purple-400" />
                            </div>
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
                        onClick={() => setShowTransactionDetails(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-2xl rounded-3xl shadow-2xl max-w-3xl w-full max-h-[85vh] border border-purple-200/50 dark:border-purple-500/30 flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header - Fixed */}
                            <div className="flex-shrink-0 relative overflow-hidden rounded-t-3xl bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 p-6 shadow-lg">
                                <div className="absolute inset-0 bg-black/10"></div>
                                <div className="relative z-10 flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white drop-shadow-lg mb-1">{t.transaction_details || 'Transaction Details'}</h2>
                                        <p className="text-white/80 text-sm">{t.transaction_information || 'Complete transaction information'}</p>
                                    </div>
                                    <button
                                        onClick={() => setShowTransactionDetails(false)}
                                        className="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-xl rounded-xl flex items-center justify-center transition-all duration-200 border border-white/30 group"
                                    >
                                        <svg className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Content - Scrollable */}
                            <div
                                className="flex-1 overflow-y-auto p-6 space-y-6"
                                style={{
                                    scrollbarWidth: 'thin',
                                    scrollbarColor: '#a855f7 transparent',
                                }}
                            >
                                <style jsx>{`
                                    div::-webkit-scrollbar {
                                        width: 8px;
                                    }
                                    div::-webkit-scrollbar-track {
                                        background: transparent;
                                    }
                                    div::-webkit-scrollbar-thumb {
                                        background: linear-gradient(180deg, #a855f7, #ec4899);
                                        border-radius: 10px;
                                    }
                                    div::-webkit-scrollbar-thumb:hover {
                                        background: linear-gradient(180deg, #9333ea, #db2777);
                                    }
                                `}</style>

                                {/* Basic Info */}
                                <div className="bg-gradient-to-br from-white/60 to-purple-50/60 dark:from-gray-800/60 dark:to-purple-900/20 backdrop-blur-xl rounded-2xl p-5 border border-purple-200/50 dark:border-purple-500/30 shadow-lg">
                                    <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent mb-4">
                                        {t.basic_information || 'Basic Information'}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">{t.bill_number || 'Bill Number'}</label>
                                            <p className="text-gray-900 dark:text-white font-semibold">{selectedTransaction.bill_number}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">{t.bill_type || 'Bill Type'}</label>
                                            <p className="text-gray-900 dark:text-white font-semibold">
                                                {t[`bill_type_${selectedTransaction.bill_type}`] || selectedTransaction.bill_type.replace('_', ' ')}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">{t.status || 'Status'}</label>
                                            <p className="text-gray-900 dark:text-white font-semibold">{t[`status_${selectedTransaction.status}`] || selectedTransaction.status}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">{t.payment_method || 'Payment Method'}</label>
                                            <p className="text-gray-900 dark:text-white font-semibold">{selectedTransaction.payment_method || t.not_specified || 'Not specified'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Amount Breakdown */}
                                <div className="bg-gradient-to-br from-white/60 to-emerald-50/60 dark:from-gray-800/60 dark:to-emerald-900/20 backdrop-blur-xl rounded-2xl p-5 border border-emerald-200/50 dark:border-emerald-500/30 shadow-lg">
                                    <h3 className="text-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
                                        {t.amount_breakdown || 'Amount Breakdown'}
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 dark:text-gray-400">{t.subtotal || 'Subtotal'}:</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedTransaction.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 dark:text-gray-400">
                                                {t.tax || 'Tax'} ({selectedTransaction.tax_rate}%):
                                            </span>
                                            <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedTransaction.tax_amount)}</span>
                                        </div>
                                        <div className="h-px bg-gradient-to-r from-transparent via-purple-300 dark:via-purple-700 to-transparent"></div>
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-lg font-semibold text-gray-900 dark:text-white">{t.total || 'Total'}:</span>
                                            <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                                {formatCurrency(selectedTransaction.total_amount)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="bg-gradient-to-br from-white/60 to-blue-50/60 dark:from-gray-800/60 dark:to-blue-900/20 backdrop-blur-xl rounded-2xl p-5 border border-blue-200/50 dark:border-blue-500/30 shadow-lg">
                                    <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4">{t.important_dates || 'Important Dates'}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">{t.issue_date || 'Issue Date'}</label>
                                            <p className="text-gray-900 dark:text-white font-semibold">{formatDate(selectedTransaction.issue_date)}</p>
                                        </div>
                                        {selectedTransaction.due_date && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">{t.due_date || 'Due Date'}</label>
                                                <p className="text-gray-900 dark:text-white font-semibold">{formatDate(selectedTransaction.due_date)}</p>
                                            </div>
                                        )}
                                        {selectedTransaction.paid_date && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">{t.paid_date || 'Paid Date'}</label>
                                                <p className="text-gray-900 dark:text-white font-semibold">{formatDate(selectedTransaction.paid_date)}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Trip Information */}
                                {selectedTransaction.booking && (
                                    <div className="bg-gradient-to-br from-white/60 to-violet-50/60 dark:from-gray-800/60 dark:to-violet-900/20 backdrop-blur-xl rounded-2xl p-5 border border-violet-200/50 dark:border-violet-500/30 shadow-lg">
                                        <h3 className="text-lg font-semibold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-4">
                                            {t.trip_information || 'Trip Information'}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">{t.booking_reference || 'Booking Reference'}</label>
                                                <p className="text-gray-900 dark:text-white font-semibold">{selectedTransaction.booking.booking_reference}</p>
                                            </div>
                                            {selectedTransaction.booking.destination && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">{t.destination || 'Destination'}</label>
                                                    <p className="text-gray-900 dark:text-white font-semibold">{selectedTransaction.booking.destination.name}</p>
                                                </div>
                                            )}
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">{t.trip_date || 'Trip Date'}</label>
                                                <p className="text-gray-900 dark:text-white font-semibold">{formatDate(selectedTransaction.booking.trip_date)}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Description and Notes */}
                                {(selectedTransaction.description || selectedTransaction.notes) && (
                                    <div className="bg-gradient-to-br from-white/60 to-amber-50/60 dark:from-gray-800/60 dark:to-amber-900/20 backdrop-blur-xl rounded-2xl p-5 border border-amber-200/50 dark:border-amber-500/30 shadow-lg">
                                        <h3 className="text-lg font-semibold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-4">
                                            {t.additional_information || 'Additional Information'}
                                        </h3>
                                        {selectedTransaction.description && (
                                            <div className="mb-4">
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">{t.description || 'Description'}</label>
                                                <p className="text-gray-700 dark:text-gray-300">{selectedTransaction.description}</p>
                                            </div>
                                        )}
                                        {selectedTransaction.notes && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">{t.notes || 'Notes'}</label>
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
