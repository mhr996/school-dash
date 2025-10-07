'use client';

import { useState, useEffect } from 'react';
import supabase from '@/lib/supabase';
import { getTranslation } from '@/i18n';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { sortBy } from 'lodash';
import Link from 'next/link';
import IconPlus from '@/components/icon/icon-plus';
import IconDownload from '@/components/icon/icon-download';
import IconSearch from '@/components/icon/icon-search';
import IconCashBanknotes from '@/components/icon/icon-cash-banknotes';
import CustomSelect from '@/components/elements/custom-select';
import { getAllServicesBalanceSummary, ServiceType } from '@/utils/service-balance-manager';

interface Payout {
    id: string;
    service_type: ServiceType;
    service_id: string;
    user_id: string;
    service_provider_name: string;
    amount: number;
    payment_method: string;
    payment_date: string;
    reference_number: string | null;
    description: string | null;
    notes: string | null;
    created_by: string;
    created_at: string;
    created_by_user?: {
        full_name: string;
    };
}

const PayoutsList = () => {
    const { t } = getTranslation();
    const [items, setItems] = useState<Payout[]>([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<Payout[]>([]);
    const [records, setRecords] = useState<Payout[]>([]);

    const [search, setSearch] = useState('');
    const [serviceTypeFilter, setServiceTypeFilter] = useState('');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('');

    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'payment_date',
        direction: 'desc',
    });

    // Balance summary
    const [balanceSummary, setBalanceSummary] = useState({
        totalOwed: 0,
        totalPaidOut: 0,
        payoutCount: 0,
    });

    useEffect(() => {
        fetchPayouts();
    }, []);

    useEffect(() => {
        if (items.length > 0 || !loading) {
            fetchBalanceSummary();
        }
    }, [items]);

    const fetchPayouts = async () => {
        try {
            const { data, error } = await supabase
                .from('payouts')
                .select(
                    `
                    *,
                    created_by_user:users!payouts_created_by_fkey(full_name)
                `,
                )
                .order('payment_date', { ascending: false });

            if (error) throw error;

            const payoutsData = (data || []).map((payout) => ({
                ...payout,
                created_by_user: Array.isArray(payout.created_by_user) ? payout.created_by_user[0] : payout.created_by_user,
            })) as Payout[];

            setItems(payoutsData);
            setInitialRecords(payoutsData);
        } catch (error) {
            console.error('Error fetching payouts:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBalanceSummary = async () => {
        try {
            const summary = await getAllServicesBalanceSummary();

            // Calculate total paid out and payout count from items
            const totalPaidOut = items.reduce((sum, payout) => sum + payout.amount, 0);
            const payoutCount = items.length;

            setBalanceSummary({
                totalOwed: summary.totalOwed,
                totalPaidOut,
                payoutCount,
            });
        } catch (error) {
            console.error('Error fetching balance summary:', error);
        }
    };

    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords(initialRecords.slice(from, to));
    }, [page, pageSize, initialRecords]);

    useEffect(() => {
        setInitialRecords(() => {
            return items.filter((item) => {
                const searchTerm = search.toLowerCase();
                const matchesSearch =
                    item.service_provider_name?.toLowerCase().includes(searchTerm) ||
                    item.reference_number?.toLowerCase().includes(searchTerm) ||
                    item.payment_method?.toLowerCase().includes(searchTerm) ||
                    item.service_type?.toLowerCase().includes(searchTerm);

                const matchesServiceType = !serviceTypeFilter || item.service_type === serviceTypeFilter;
                const matchesPaymentMethod = !paymentMethodFilter || item.payment_method === paymentMethodFilter;

                return matchesSearch && matchesServiceType && matchesPaymentMethod;
            });
        });
    }, [items, search, serviceTypeFilter, paymentMethodFilter]);

    useEffect(() => {
        const data2 = sortBy(initialRecords, sortStatus.columnAccessor);
        setInitialRecords(sortStatus.direction === 'desc' ? data2.reverse() : data2);
        setPage(1);
    }, [sortStatus]);

    const exportToCSV = () => {
        const headers = ['Payment Date', 'Service Type', 'Provider', 'Amount', 'Payment Method', 'Reference Number', 'Created By'];

        const rows = initialRecords.map((payout) => [
            new Date(payout.payment_date).toLocaleDateString(),
            payout.service_type.replace(/_/g, ' '),
            payout.service_provider_name,
            `₪${payout.amount.toLocaleString()}`,
            payout.payment_method,
            payout.reference_number || '',
            payout.created_by_user?.full_name || '',
        ]);

        const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payouts-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const getServiceTypeBadgeClass = (type: ServiceType) => {
        switch (type) {
            case 'guides':
                return 'badge-outline-primary';
            case 'paramedics':
                return 'badge-outline-success';
            case 'security_companies':
                return 'badge-outline-info';
            case 'external_entertainment_companies':
                return 'badge-outline-warning';
            case 'travel_companies':
                return 'badge-outline-danger';
            default:
                return 'badge-outline-secondary';
        }
    };

    const getPaymentMethodBadgeClass = (method: string) => {
        switch (method) {
            case 'cash':
                return 'badge-outline-success';
            case 'bank_transfer':
                return 'badge-outline-primary';
            case 'credit_card':
                return 'badge-outline-info';
            case 'check':
                return 'badge-outline-warning';
            default:
                return 'badge-outline-secondary';
        }
    };

    return (
        <div className="panel border-white-light px-0 dark:border-[#1b2e4b]">
            {/* Header */}
            <div className="mb-5 flex flex-col gap-5 px-5 md:items-start">
                <div className="flex items-center gap-2">
                    <IconCashBanknotes className="h-6 w-6 text-primary" />
                    <h2 className="text-xl font-bold dark:text-white">{t('payouts')}</h2>
                </div>

                {/* Summary Stats */}
                <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border border-white-light bg-white p-4 dark:border-[#1b2e4b] dark:bg-[#0e1726]">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{t('total_owed_to_providers')}</div>
                                <div className="mt-1 text-xl font-bold text-danger">₪{balanceSummary.totalOwed.toLocaleString()}</div>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-danger-light dark:bg-danger">
                                <IconCashBanknotes className="h-6 w-6 text-danger dark:text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-white-light bg-white p-4 dark:border-[#1b2e4b] dark:bg-[#0e1726]">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{t('total_payouts')}</div>
                                <div className="mt-1 text-xl font-bold text-info">{balanceSummary.payoutCount}</div>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-info-light dark:bg-info">
                                <IconCashBanknotes className="h-6 w-6 text-info dark:text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-white-light bg-white p-4 dark:border-[#1b2e4b] dark:bg-[#0e1726]">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{t('total_paid_out')}</div>
                                <div className="mt-1 text-xl font-bold text-success">₪{balanceSummary.totalPaidOut.toLocaleString()}</div>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success-light dark:bg-success">
                                <IconCashBanknotes className="h-6 w-6 text-success dark:text-white" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Actions */}
            <div className="mb-4.5 flex flex-col gap-4 px-5 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
                    <div className="relative flex-1 max-w-[300px]">
                        <input type="text" className="form-input ltr:pl-9 rtl:pr-9" placeholder={t('search')} value={search} onChange={(e) => setSearch(e.target.value)} />
                        <IconSearch className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 ltr:left-3 rtl:right-3" />
                    </div>

                    <div className="max-w-[200px]">
                        <CustomSelect
                            value={serviceTypeFilter}
                            onChange={(val) => setServiceTypeFilter(val as string)}
                            placeholder={`${t('all')} ${t('service_type')}`}
                            options={[
                                { value: '', label: `${t('all')} ${t('service_type')}` },
                                { value: 'guides', label: t('guides') },
                                { value: 'paramedics', label: t('paramedics') },
                                { value: 'security_companies', label: t('security_companies') },
                                { value: 'external_entertainment_companies', label: t('external_entertainment_companies') },
                                { value: 'travel_companies', label: t('travel_companies') },
                            ]}
                        />
                    </div>

                    <div className="max-w-[200px]">
                        <CustomSelect
                            value={paymentMethodFilter}
                            onChange={(val) => setPaymentMethodFilter(val as string)}
                            placeholder={`${t('all')} ${t('payment_method')}`}
                            options={[
                                { value: '', label: `${t('all')} ${t('payment_method')}` },
                                { value: 'cash', label: t('cash') },
                                { value: 'bank_transfer', label: t('bank_transfer') },
                                { value: 'credit_card', label: t('credit_card') },
                                { value: 'check', label: t('check') },
                            ]}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button type="button" className="btn btn-outline-primary gap-2" onClick={exportToCSV}>
                        <IconDownload />
                        {t('export')}
                    </button>
                    <Link href="/payouts/add" className="btn btn-primary gap-2">
                        <IconPlus />
                        {t('create_payout')}
                    </Link>
                </div>
            </div>

            {/* Table */}
            <div className="datatables pagination-padding relative">
                <DataTable
                    className={`${loading ? 'filter blur-sm pointer-events-none' : 'table-hover whitespace-nowrap'} rtl-table-headers`}
                    records={records}
                    columns={[
                        {
                            accessor: 'payment_date',
                            title: t('payment_date'),
                            sortable: true,
                            render: ({ payment_date }) => <div className="font-medium">{new Date(payment_date).toLocaleDateString()}</div>,
                        },
                        {
                            accessor: 'service_type',
                            title: t('service_type'),
                            sortable: true,
                            render: ({ service_type }) => <span className={`badge ${getServiceTypeBadgeClass(service_type)}`}>{t(service_type)}</span>,
                        },
                        {
                            accessor: 'service_provider_name',
                            title: t('service_provider'),
                            sortable: true,
                            render: ({ service_provider_name }) => <div className="font-medium">{service_provider_name}</div>,
                        },
                        {
                            accessor: 'amount',
                            title: t('amount'),
                            sortable: true,
                            render: ({ amount }) => <div className="font-bold text-success">₪{amount.toLocaleString()}</div>,
                        },
                        {
                            accessor: 'payment_method',
                            title: t('payment_method'),
                            sortable: true,
                            render: ({ payment_method }) => <span className={`badge ${getPaymentMethodBadgeClass(payment_method)}`}>{t(payment_method)}</span>,
                        },
                        {
                            accessor: 'reference_number',
                            title: t('reference_number'),
                            render: ({ reference_number }) => <div className="text-gray-600 dark:text-gray-400">{reference_number || '-'}</div>,
                        },
                        {
                            accessor: 'created_by_user',
                            title: t('created_by'),
                            render: ({ created_by_user }) => <div className="text-sm text-gray-600 dark:text-gray-400">{created_by_user?.full_name || t('unknown')}</div>,
                        },
                    ]}
                    highlightOnHover
                    totalRecords={initialRecords.length}
                    recordsPerPage={pageSize}
                    page={page}
                    onPageChange={(p) => setPage(p)}
                    recordsPerPageOptions={PAGE_SIZES}
                    onRecordsPerPageChange={setPageSize}
                    sortStatus={sortStatus}
                    onSortStatusChange={setSortStatus}
                    minHeight={300}
                    paginationText={({ from, to, totalRecords }) => `${t('showing')} ${from} ${t('to')} ${to} ${t('of')} ${totalRecords} ${t('entries')}`}
                />
            </div>
        </div>
    );
};

export default PayoutsList;
