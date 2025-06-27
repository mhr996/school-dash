'use client';
import React, { useState, useEffect } from 'react';
import supabase from '@/lib/supabase';
import { getTranslation } from '@/i18n';
import { sortBy } from 'lodash';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import { Log } from '@/types';
import IconEye from '@/components/icon/icon-eye';
import IconCar from '@/components/icon/icon-car';
import IconMenuInvoice from '@/components/icon/menu/icon-menu-invoice';
import IconUser from '@/components/icon/icon-user';
import IconListCheck from '@/components/icon/icon-list-check';
import Link from 'next/link';

const LogsPage = () => {
    const { t } = getTranslation();
    const [items, setItems] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<Log[]>([]);
    const [records, setRecords] = useState<Log[]>([]);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'created_at',
        direction: 'desc',
    });
    const [alertState, setAlertState] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('logs').select('*').order('created_at', { ascending: false });

            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
            setAlertState({ message: t('error_loading_data'), type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    // Filter by search term
    useEffect(() => {
        setInitialRecords(
            items.filter((log) => {
                const searchLower = search.toLowerCase();
                return (
                    log.type.toLowerCase().includes(searchLower) ||
                    (log.deal?.title && log.deal.title.toLowerCase().includes(searchLower)) ||
                    (log.deal?.customer_name && log.deal.customer_name.toLowerCase().includes(searchLower)) ||
                    (log.car?.title && log.car.title.toLowerCase().includes(searchLower)) ||
                    (log.car?.brand && log.car.brand.toLowerCase().includes(searchLower)) ||
                    (log.car?.car_number && log.car.car_number.toLowerCase().includes(searchLower)) ||
                    (log.bill?.customer_name && log.bill.customer_name.toLowerCase().includes(searchLower)) ||
                    (log.bill?.bill_type && log.bill.bill_type.toLowerCase().includes(searchLower))
                );
            }),
        );
    }, [items, search]);

    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords]);

    useEffect(() => {
        const sorted = sortBy(initialRecords, sortStatus.columnAccessor);
        setRecords(sortStatus.direction === 'desc' ? sorted.reverse() : sorted);
        setPage(1);
    }, [sortStatus, initialRecords]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getActivityTypeLabel = (type: string) => {
        return t(type) || type.replace('_', ' ');
    };

    const getActivityIcon = (type: string) => {
        if (type.includes('car')) return <IconCar className="w-4 h-4" />;
        if (type.includes('deal')) return <IconMenuInvoice className="w-4 h-4" />;
        if (type.includes('bill')) return <IconMenuInvoice className="w-4 h-4" />;
        if (type.includes('customer') || type.includes('provider')) return <IconUser className="w-4 h-4" />;
        return <IconEye className="w-4 h-4" />;
    };

    const getActivityDetails = (log: Log) => {
        if (log.car) {
            return (
                <div className="text-sm">
                    <div className="font-medium">{log.car.title}</div>
                    <div className="text-gray-500 dark:text-gray-400">
                        {log.car.brand} - {log.car.year}
                        {log.car.car_number && ` | ${t('car_number')}: ${log.car.car_number}`}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                        {t('purchase_price')}: {log.car.buy_price?.toLocaleString()} | {t('sale_price')}: {log.car.sale_price?.toLocaleString()}
                    </div>
                </div>
            );
        }

        if (log.deal) {
            return (
                <div className="text-sm">
                    <div className="font-medium">{log.deal.title}</div>
                    <div className="text-gray-500 dark:text-gray-400">
                        {t('deal_type')}: {log.deal.deal_type} | {t('amount')}: {log.deal.amount?.toLocaleString()}
                    </div>
                    {log.deal.customer_name && (
                        <div className="text-gray-500 dark:text-gray-400">
                            {t('customer')}: {log.deal.customer_name}
                        </div>
                    )}
                </div>
            );
        }

        if (log.bill) {
            return (
                <div className="text-sm">
                    <div className="font-medium">{log.bill.bill_type}</div>
                    <div className="text-gray-500 dark:text-gray-400">
                        {t('customer')}: {log.bill.customer_name}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                        {t('amount')}: {log.bill.total_with_tax?.toLocaleString()}
                        {log.bill.payment_type && ` | ${t('payment_type')}: ${log.bill.payment_type}`}
                    </div>
                </div>
            );
        }

        return <div className="text-sm text-gray-500">{t('no_details_available')}</div>;
    };

    const getRelatedItemLink = (log: Log) => {
        if (log.car) return `/cars`;
        if (log.deal) return `/deals`;
        if (log.bill) return `/bills`;
        return null;
    };

    return (
        <div>
            <div className="panel">
                <div className="mb-5 flex flex-col gap-5 md:flex-row md:items-center">
                    <h5 className="text-lg font-semibold dark:text-white-light">{t('activity_logs')}</h5>
                </div>

                {alertState && <Alert message={alertState.message} type={alertState.type} onClose={() => setAlertState(null)} />}

                <div className="mb-4.5 flex flex-col gap-5 md:flex-row md:items-center">
                    <div className="ltr:ml-auto rtl:mr-auto">
                        <input type="text" className="form-input w-auto" placeholder={t('search')} value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>

                <div className="datatables">
                    <DataTable
                        highlightOnHover
                        className="table-hover whitespace-nowrap"
                        records={records}
                        columns={[
                            {
                                accessor: 'id',
                                title: t('id'),
                                sortable: true,
                                render: ({ id }) => <strong className="text-info">#{id}</strong>,
                            },
                            {
                                accessor: 'created_at',
                                title: t('log_date'),
                                sortable: true,
                                render: ({ created_at }) => <div className="text-sm">{formatDate(created_at)}</div>,
                            },
                            {
                                accessor: 'type',
                                title: t('activity_type'),
                                sortable: true,
                                render: ({ type }) => (
                                    <div className="flex items-center gap-2">
                                        {getActivityIcon(type)}
                                        <span className="font-medium">{getActivityTypeLabel(type)}</span>
                                    </div>
                                ),
                            },
                            {
                                accessor: 'details',
                                title: t('details'),
                                render: (log) => getActivityDetails(log),
                            },
                        ]}
                        totalRecords={initialRecords.length}
                        recordsPerPage={pageSize}
                        page={page}
                        onPageChange={(p) => setPage(p)}
                        recordsPerPageOptions={PAGE_SIZES}
                        onRecordsPerPageChange={setPageSize}
                        sortStatus={sortStatus}
                        onSortStatusChange={setSortStatus}
                        minHeight={200}
                        paginationText={({ from, to, totalRecords }) => `${t('showing')} ${from} ${t('to')} ${to} ${t('of')} ${totalRecords} ${t('entries')}`}
                        fetching={loading}
                    />
                </div>
            </div>
        </div>
    );
};

export default LogsPage;
