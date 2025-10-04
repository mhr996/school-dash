'use client';
import IconEye from '@/components/icon/icon-eye';
import IconPrinter from '@/components/icon/icon-printer';
import IconDownload from '@/components/icon/icon-download';
import IconEdit from '@/components/icon/icon-edit';
import IconSearch from '@/components/icon/icon-search';
import IconPlus from '@/components/icon/icon-plus';
import { sortBy } from 'lodash';
import { DataTableSortStatus, DataTable } from 'mantine-datatable';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import { getTranslation } from '@/i18n';
import { useRouter } from 'next/navigation';

interface Bill {
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
    status: 'draft' | 'issued' | 'paid' | 'cancelled';
    issue_date: string;
    due_date: string | null;
    paid_date: string | null;
    description: string | null;
    notes: string | null;
    payment_method: string | null;
    auto_generated: boolean;
    parent_bill_id: string | null;
    created_at: string;
    updated_at: string;
    booking: {
        booking_reference: string;
        total_amount: number;
        customer_id: string;
        customer: {
            full_name: string;
            email: string;
            phone: string | null;
        } | null;
        destination: {
            name: string;
        };
    };
}

const BillsList = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const [items, setItems] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<Bill[]>([]);
    const [records, setRecords] = useState<Bill[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<Bill[]>([]);

    const [search, setSearch] = useState('');
    const [billTypeFilter, setBillTypeFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'created_at',
        direction: 'desc',
    });

    // Alert state
    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({
        visible: false,
        message: '',
        type: 'success',
    });

    useEffect(() => {
        const fetchBills = async () => {
            try {
                const { data, error } = await supabase
                    .from('bills')
                    .select(
                        `
                        *,
                        booking:bookings(
                            booking_reference,
                            total_amount,
                            customer_id,
                            customer:users!customer_id(full_name, email, phone),
                            destination:destinations(name)
                        )
                    `,
                    )
                    .order('created_at', { ascending: false });

                if (error) throw error;

                setItems(data as Bill[]);
            } catch (error) {
                console.error('Error fetching bills:', error);
                setAlert({ visible: true, message: t('error_loading_bills'), type: 'danger' });
            } finally {
                setLoading(false);
            }
        };
        fetchBills();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords]);

    useEffect(() => {
        setInitialRecords(
            items.filter((item) => {
                // Search filter
                const searchTerm = search.toLowerCase();
                const matchesSearch =
                    !searchTerm ||
                    item.bill_number.toLowerCase().includes(searchTerm) ||
                    item.booking?.customer?.full_name?.toLowerCase().includes(searchTerm) ||
                    item.booking?.customer?.email?.toLowerCase().includes(searchTerm) ||
                    item.booking?.booking_reference.toLowerCase().includes(searchTerm) ||
                    item.booking?.destination?.name.toLowerCase().includes(searchTerm);

                // Bill type filter
                const matchesBillType = !billTypeFilter || item.bill_type === billTypeFilter;

                // Status filter
                const itemStatus = getBillStatus(item);
                const matchesStatus = !statusFilter || itemStatus === statusFilter;

                return matchesSearch && matchesBillType && matchesStatus;
            }),
        );
    }, [items, search, billTypeFilter, statusFilter]);

    useEffect(() => {
        const data2 = sortBy(initialRecords, sortStatus.columnAccessor);
        setInitialRecords(sortStatus.direction === 'desc' ? data2.reverse() : data2);
        setPage(1);
    }, [sortStatus]);

    const getBillTypeColor = (type: string) => {
        switch (type) {
            case 'tax_invoice':
                return 'badge-outline-primary';
            case 'receipt':
                return 'badge-outline-success';
            default:
                return 'badge-outline-secondary';
        }
    };

    const getBillTypeName = (type: string) => {
        switch (type) {
            case 'tax_invoice':
                return t('tax_invoice');
            case 'receipt':
                return t('receipt');
            default:
                return type;
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(amount);
    };

    // Calculate status based on bill type
    const getBillStatus = (bill: Bill) => {
        if (bill.bill_type === 'tax_invoice') {
            // For tax invoices: paid or unpaid
            return bill.status === 'paid' ? 'paid' : 'unpaid';
        } else if (bill.bill_type === 'receipt') {
            // For receipts: complete or incomplete (based on receipt amount vs booking amount)
            const bookingAmount = bill.booking?.total_amount || 0;
            const receiptAmount = bill.total_amount;
            return receiptAmount >= bookingAmount ? 'complete' : 'incomplete';
        }
        // Default fallback
        return bill.status === 'paid' ? 'paid' : 'unpaid';
    };

    const getStatusColor = (bill: Bill) => {
        const status = getBillStatus(bill);
        switch (status) {
            case 'paid':
            case 'complete':
                return 'badge-outline-success';
            case 'unpaid':
            case 'incomplete':
                return 'badge-outline-warning';
            default:
                return 'badge-outline-secondary';
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="panel border-white-light px-0 dark:border-[#1b2e4b]">
                <div className="mb-5 px-5 flex items-center justify-between">
                    <h5 className="text-lg font-semibold dark:text-white-light">{t('bills')}</h5>
                    <Link href="/bills/add" className="btn btn-success gap-2">
                        <IconPlus className="w-4 h-4" />
                        {t('add_receipt')}
                    </Link>
                </div>

                {/* Search and Filters */}
                <div className="mb-4.5 flex flex-col gap-4 px-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-1 items-center gap-4">
                        <div className="relative flex-1 max-w-[400px]">
                            <input type="text" className="form-input ltr:pl-9 rtl:pr-9" placeholder={t('search_bills_placeholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
                            <IconSearch className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 ltr:left-3 rtl:right-3" />
                        </div>

                        {/* Bill Type Filter */}
                        <select className="form-select min-w-[140px]" value={billTypeFilter} onChange={(e) => setBillTypeFilter(e.target.value)}>
                            <option value="">{t('all_bill_types')}</option>
                            <option value="tax_invoice">{t('tax_invoice')}</option>
                            <option value="receipt">{t('receipt')}</option>
                        </select>

                        {/* Status Filter */}
                        <select className="form-select min-w-[120px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="">{t('all_statuses')}</option>
                            <option value="paid">{t('paid')}</option>
                            <option value="unpaid">{t('unpaid')}</option>
                            <option value="complete">{t('complete')}</option>
                            <option value="incomplete">{t('incomplete')}</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="datatables pagination-padding relative">
                    <DataTable
                        className={`${loading ? 'filter blur-sm pointer-events-none' : 'table-hover whitespace-nowrap'} rtl-table-headers`}
                        records={records}
                        columns={[
                            {
                                accessor: 'bill_number',
                                title: t('bill_number'),
                                sortable: true,
                                render: ({ bill_number, bill_type, auto_generated }) => (
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">{bill_number}</span>
                                            {auto_generated && <span className="badge badge-outline-info text-xs">{t('auto')}</span>}
                                        </div>
                                        <div className={`badge ${getBillTypeColor(bill_type)} text-xs`}>{getBillTypeName(bill_type)}</div>
                                    </div>
                                ),
                            },
                            {
                                accessor: 'customer_name',
                                title: t('customer'),
                                sortable: true,
                                render: ({ booking }) => (
                                    <div>
                                        <div className="font-semibold">{booking?.customer?.full_name || t('unknown_customer')}</div>
                                        {booking?.customer?.email && <div className="text-xs text-gray-500">{booking.customer.email}</div>}
                                    </div>
                                ),
                            },
                            {
                                accessor: 'booking',
                                title: t('booking'),
                                sortable: false,
                                render: ({ booking }) => (
                                    <div>
                                        <div className="font-semibold">{booking?.booking_reference}</div>
                                        <div className="text-xs text-gray-500">{booking?.destination?.name}</div>
                                    </div>
                                ),
                            },
                            {
                                accessor: 'total_amount',
                                title: t('amount'),
                                sortable: true,
                                render: ({ total_amount, subtotal, tax_amount }) => (
                                    <div>
                                        <div className="font-semibold">{formatCurrency(total_amount)}</div>
                                        {tax_amount > 0 && (
                                            <div className="text-xs text-gray-500">
                                                {t('subtotal')}: {formatCurrency(subtotal)} + {t('tax')}: {formatCurrency(tax_amount)}
                                            </div>
                                        )}
                                    </div>
                                ),
                            },
                            {
                                accessor: 'status',
                                title: t('status'),
                                sortable: true,
                                render: (bill) => {
                                    const displayStatus = getBillStatus(bill);
                                    const statusColor = getStatusColor(bill);
                                    return <span className={`badge ${statusColor}`}>{t(displayStatus)}</span>;
                                },
                            },
                            {
                                accessor: 'issue_date',
                                title: t('issue_date'),
                                sortable: true,
                                render: ({ issue_date }) => new Date(issue_date).toLocaleDateString('tr-TR'),
                            },
                            {
                                accessor: 'actions',
                                title: t('actions'),
                                titleClassName: '!text-center',
                                render: ({ id, bill_type }) => (
                                    <div className="flex items-center justify-center gap-2">
                                        <Link href={`/bills/preview/${id}`} className="btn btn-outline-primary btn-sm gap-1">
                                            <IconEye className="h-4 w-4" />
                                            {t('view')}
                                        </Link>

                                        {/* Edit button - only for receipts */}
                                        {bill_type === 'receipt' && (
                                            <Link href={`/bills/edit/${id}`} className="btn btn-outline-warning btn-sm gap-1">
                                                <IconEdit className="h-4 w-4" />
                                                {t('edit')}
                                            </Link>
                                        )}

                                        <button
                                            type="button"
                                            className="btn btn-outline-info btn-sm gap-1"
                                            onClick={() => {
                                                // TODO: Implement download functionality
                                                console.log('Download bill:', id);
                                            }}
                                        >
                                            <IconDownload className="h-4 w-4" />
                                        </button>
                                    </div>
                                ),
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
                        selectedRecords={selectedRecords}
                        onSelectedRecordsChange={setSelectedRecords}
                        paginationText={({ from, to, totalRecords }) => `${t('showing')} ${from} ${t('to')} ${to} ${t('of')} ${totalRecords} ${t('entries')}`}
                        noRecordsText={t('no_bills_found')}
                        loadingText={t('loading')}
                        minHeight={300}
                    />

                    {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white dark:bg-black-dark-light bg-opacity-60 backdrop-blur-sm" />}
                </div>

                {/* Alerts */}
                {alert.visible && (
                    <div className="fixed top-4 right-4 z-50 min-w-80 max-w-md">
                        <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert({ ...alert, visible: false })} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default BillsList;
