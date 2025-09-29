'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { getTranslation } from '@/i18n';
// Simple relative time formatter
const formatDistanceToNow = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    return 'Just now';
};

// Icons
import IconEye from '@/components/icon/icon-eye';
import IconFilter from '@/components/icon/icon-filter';
import IconDownload from '@/components/icon/icon-download';
import IconSearch from '@/components/icon/icon-search';

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

interface TransactionsTableProps {
    transactions: TransactionRecord[];
    isLoading?: boolean;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions, isLoading = false }) => {
    const { t } = getTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filteredTransactions = transactions.filter((transaction) => {
        const matchesSearch = transaction.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) || transaction.bill_number.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            paid: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', label: 'Paid' },
            pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Pending' },
            cancelled: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', label: 'Cancelled' },
            issued: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', label: 'Issued' },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>{config.label}</span>;
    };

    const getPaymentTypeBadge = (type: string) => {
        const typeConfig = {
            cash: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
            bank_transfer: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
            credit_card: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
            check: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
        };

        const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.cash;
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>{type.replace('_', ' ').toUpperCase()}</span>;
    };

    if (isLoading) {
        return (
            <div className="panel">
                <div className="flex items-center justify-between mb-6">
                    <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
                    <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                </div>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg animate-pulse">
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                                <div>
                                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32 mb-2"></div>
                                    <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
                                </div>
                            </div>
                            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }} className="panel">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('recent_transactions')}</h3>
                <div className="flex items-center space-x-3">
                    <button className="btn btn-outline-primary btn-sm">
                        <IconDownload className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                        Export
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="text" placeholder={t('search_transactions')} className="form-input pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                    <IconFilter className="text-gray-400 w-4 h-4" />
                    <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="all">{t('all_statuses')}</option>
                        <option value="paid">{t('paid')}</option>
                        <option value="pending">{t('pending')}</option>
                        <option value="issued">{t('issued')}</option>
                        <option value="cancelled">{t('cancelled')}</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="table-auto w-full">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-slate-800/50">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('customer_and_bill')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('payment_methods')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('amount')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('status')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('date')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredTransactions.map((transaction) => (
                            <motion.tr key={transaction.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-white">{transaction.customer_name}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">#{transaction.bill_number}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">{getPaymentTypeBadge(transaction.payment_type)}</td>
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-gray-900 dark:text-white">${transaction.amount.toFixed(2)}</div>
                                </td>
                                <td className="px-6 py-4">{getStatusBadge(transaction.status)}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                    <div>{new Date(transaction.payment_date).toLocaleDateString()}</div>
                                    <div className="text-xs">{formatDistanceToNow(new Date(transaction.payment_date))}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                                        <IconEye className="w-4 h-4" />
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>

                {filteredTransactions.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <IconSearch className="w-16 h-16 mx-auto opacity-50" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">{searchTerm || statusFilter !== 'all' ? t('no_transactions_match') : t('no_transactions_found')}</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default TransactionsTable;
