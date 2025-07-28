'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import supabase from '@/lib/supabase';
import { getTranslation } from '@/i18n';
import Cookies from 'universal-cookie';
import { sortBy } from 'lodash';
import { DataTable, DataTableSortStatus, DataTableColumn } from 'mantine-datatable';
import IconPlus from '@/components/icon/icon-plus';
import IconEdit from '@/components/icon/icon-edit';
import IconEye from '@/components/icon/icon-eye';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconPdf from '@/components/icon/icon-pdf';
import ConfirmModal from '@/components/modals/confirm-modal';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import { generateBillPDF } from '@/utils/pdf-generator';
import { logActivity } from '@/utils/activity-logger';

interface Bill {
    id: string; 
    deal_id: string;
    bill_type: string;
    customer_name: string;
    amount: number;
    tax_amount: number;
    total_with_tax: number;
    total_amount: number;
    status: string;
    created_at: string;
    payment_type?: string;
    visa_amount?: number;
    bank_amount?: number;
    transfer_amount?: number;
    check_amount?: number;
    cash_amount?: number;
    deal?: {
        title: string;
        deal_type: string;
        customer?: {
            id: number;
            name: string;
            id_number?: string;
        };
    };
}

const Bills = () => {
    const { t } = getTranslation();
    const [items, setItems] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<Bill[]>([]);
    const [records, setRecords] = useState<Bill[]>([]);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'created_at', direction: 'desc' });
    const [selectedRecords, setSelectedRecords] = useState<Bill[]>([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [billToDelete, setBillToDelete] = useState<Bill | null>(null);
    const [downloadingPDF, setDownloadingPDF] = useState<string | null>(null);
    const [alertState, setAlertState] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

    useEffect(() => {
        fetchBills();
    }, []);

    const fetchBills = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('bills')
                .select(
                    `
                    *, 
                    deal:deals(
                        title, 
                        deal_type,
                        customer:customers!deals_customer_id_fkey(id, name, id_number)
                    )
                `,
                )
                .order('created_at', { ascending: false });
            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            console.error('Error fetching bills:', error);
            setAlertState({ message: t('error_loading_data'), type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    // Filter by search term
    useEffect(() => {
        setInitialRecords(
            items.filter(
                (bill) =>
                    bill.customer_name.toLowerCase().includes(search.toLowerCase()) ||
                    bill.deal?.title.toLowerCase().includes(search.toLowerCase()) ||
                    bill.bill_type.toLowerCase().includes(search.toLowerCase()) ||
                    (bill.payment_type && bill.payment_type.toLowerCase().includes(search.toLowerCase())) ||
                    (bill.deal?.customer?.id_number && bill.deal.customer.id_number.toLowerCase().includes(search.toLowerCase())),
            ),
        );
    }, [items, search]);

    // Reset page on pageSize change
    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    // Pagination
    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords(initialRecords.slice(from, to));
    }, [page, pageSize, initialRecords]);

    // Sorting
    useEffect(() => {
        const sorted = sortBy(initialRecords, sortStatus.columnAccessor as keyof Bill);
        setRecords(sortStatus.direction === 'desc' ? sorted.reverse() : sorted);
        setPage(1);
    }, [sortStatus, initialRecords]);

    const handleDelete = (bill: Bill) => {
        setBillToDelete(bill);
        setShowConfirmModal(true);
    };

    const confirmDeletion = async () => {
        if (!billToDelete) return;
        try {
            // Log the activity before deletion (to preserve bill data)
            await logActivity({
                type: 'bill_deleted',
                bill: billToDelete,
            });

            const { error } = await supabase.from('bills').delete().eq('id', billToDelete.id);
            if (error) throw error;
            setItems(items.filter((b) => b.id !== billToDelete.id));
            setAlertState({ message: t('bill_deleted_successfully'), type: 'success' });
        } catch (error) {
            console.error('Error deleting bill:', error);
            setAlertState({ message: t('error_deleting_bill'), type: 'danger' });
        } finally {
            setShowConfirmModal(false);
            setBillToDelete(null);
        }
    };
    const handleBulkDelete = () => {
        if (selectedRecords.length === 0) return;
        setShowBulkDeleteModal(true);
    };

    const confirmBulkDeletion = async () => {
        const ids = selectedRecords.map((b) => b.id);
        try {
            const { error } = await supabase.from('bills').delete().in('id', ids);
            if (error) throw error;
            setItems(items.filter((b) => !ids.includes(b.id)));
            setSelectedRecords([]);
            setAlertState({ message: t('bills_deleted_successfully'), type: 'success' });
        } catch (error) {
            console.error('Error deleting bills:', error);
            setAlertState({ message: t('error_deleting_bill'), type: 'danger' });
        } finally {
            setShowBulkDeleteModal(false);
        }
    };

    const getBillTypeLabel = (type: string) => {
        switch (type) {
            case 'tax_invoice':
                return t('tax_invoice_only');
            case 'receipt_only':
                return t('receipt_only');
            case 'tax_invoice_receipt':
                return t('tax_invoice_and_receipt');
            default:
                return type;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
                return 'badge-outline-success';
            case 'pending':
                return 'badge-outline-warning';
            case 'overdue':
                return 'badge-outline-danger';
            default:
                return 'badge-outline-info';
        }
    };

    const getPaymentTypeLabel = (bill: Bill) => {
        // For tax invoices without payment, return '-'
        if (bill.bill_type === 'tax_invoice') {
            return t('not_applicable');
        }

        if (!bill.payment_type) {
            return t('not_applicable');
        }

        switch (bill.payment_type) {
            case 'visa':
                return t('visa');
            case 'cash':
                return t('cash');
            case 'bank_transfer':
                return t('bank_transfer');
            case 'transfer':
                return t('transfer');
            case 'check':
                return t('check');
            default:
                return bill.payment_type;
        }
    };

    const getPaymentAmount = (bill: Bill) => {
        // For tax invoices without payment, return '-'
        if (bill.bill_type === 'tax_invoice') {
            return t('not_applicable');
        }

        if (!bill.payment_type) {
            return t('not_applicable');
        }

        let amount = 0;
        switch (bill.payment_type) {
            case 'visa':
                amount = bill.visa_amount || 0;
                break;
            case 'cash':
                amount = bill.cash_amount || 0;
                break;
            case 'bank_transfer':
                amount = bill.bank_amount || 0;
                break;
            case 'transfer':
                amount = bill.transfer_amount || 0;
                break;
            case 'check':
                amount = bill.check_amount || 0;
                break;
            default:
                return t('not_applicable');
        }

        return amount > 0 ? `$${amount.toFixed(2)}` : t('not_applicable');
    };

    const handleDownloadPDF = async (bill: Bill) => {
        setDownloadingPDF(bill.id);
        try {
            const cookies = new Cookies();
            const currentLang = cookies.get('i18nextLng') || 'he';
            const language = currentLang === 'ae' ? 'ar' : currentLang === 'he' ? 'he' : 'en';
            
            await generateBillPDF(bill, {
                filename: `bill-${bill.id}-${bill.customer_name.replace(/\s+/g, '-').toLowerCase()}.pdf`,
                language,
            });
        } catch (error) {
            console.error('Error generating PDF:', error);
            setAlertState({ message: t('error_downloading_pdf'), type: 'danger' });
        } finally {
            setDownloadingPDF(null);
        }
    };

    const columns: DataTableColumn<Bill>[] = [
        {
            accessor: 'id',
            title: t('id'),
            sortable: true,
            render: ({ id }) => <strong className="text-info">#{id}</strong>,
        },
        {
            accessor: 'customer_name',
            title: t('customer_name'),
            sortable: true,
            render: (bill: Bill) => (
                <div className="flex flex-col">
                    <span className="font-medium">{bill.customer_name}</span>
                    {bill.deal?.customer?.id_number && <span className="text-xs text-gray-500">{bill.deal.customer.id_number}</span>}
                </div>
            ),
        },
        {
            accessor: 'deal',
            title: t('deal'),
            sortable: true,
            render: (bill: Bill) => (
                <div className="flex flex-col">
                    <span className="font-medium">{bill.deal?.title}</span>
                    <span className="text-xs text-gray-500">{t(`deal_type_${bill.deal?.deal_type}`)}</span>
                </div>
            ),
        },
        {
            accessor: 'bill_type',
            title: t('bill_type'),
            sortable: true,
            render: (bill: Bill) => <span className="badge badge-outline-info">{getBillTypeLabel(bill.bill_type)}</span>,
        },
        {
            accessor: 'total_with_tax',
            title: t('total_amount'),
            sortable: true,
            render: (bill: Bill) => <span className="font-bold">{'$' + bill.total_with_tax}</span>,
        },
        {
            accessor: 'payment_type',
            title: t('payment_method'),
            sortable: true,
            render: (bill: Bill) => <span className="badge badge-outline-secondary">{getPaymentTypeLabel(bill)}</span>,
        },
        {
            accessor: 'payment_amount',
            title: t('payment_amount'),
            sortable: true,
            render: (bill: Bill) => <span className="font-medium">{getPaymentAmount(bill)}</span>,
        },
        {
            accessor: 'status',
            title: t('status'),
            sortable: true,
            render: (bill: Bill) => <span className={`badge ${getStatusColor(bill.status)}`}>{t(`bill_status_${bill.status}`)}</span>,
        },
        {
            accessor: 'created_at',
            title: t('created_at'),
            sortable: true,
            render: (bill: Bill) => <span>{new Date(bill.created_at).toLocaleDateString()}</span>,
        },
        {
            accessor: 'actions',
            title: t('actions'),
            sortable: false,
            textAlignment: 'center',
            render: (bill: Bill) => (
                <div className="mx-auto flex w-max items-center gap-4">
                    <Link href={`/bills/preview/${bill.id}`} className="flex hover:text-info" title={t('view')}>
                        <IconEye className="h-4.5 w-4.5" />
                    </Link>
                    <Link href={`/bills/edit/${bill.id}`} className="flex hover:text-primary" title={t('edit')}>
                        <IconEdit className="h-4.5 w-4.5" />
                    </Link>
                    <button type="button" className="flex hover:text-success" onClick={() => handleDownloadPDF(bill)} title={t('download_pdf')} disabled={downloadingPDF === bill.id}>
                        {downloadingPDF === bill.id ? <div className="animate-spin rounded-full h-4.5 w-4.5 border-b-2 border-success"></div> : <IconPdf className="h-4.5 w-4.5" />}
                    </button>
                    <button type="button" className="flex hover:text-danger" onClick={() => handleDelete(bill)} title={t('delete')}>
                        <IconTrashLines />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="panel border-white-light px-0 dark:border-[#1b2e4b]">
            {alertState && (
                <div className="fixed top-4 right-4 z-50 min-w-80 max-w-md">
                    <Alert type={alertState.type} title={alertState.type === 'success' ? t('success') : t('error')} message={alertState.message} onClose={() => setAlertState(null)} />
                </div>
            )}
            <div className="invoice-table">
                <div className="mb-4.5 flex flex-col gap-5 px-5 md:flex-row md:items-center">
                    <div className="flex items-center gap-2">
                        <button type="button" className="btn btn-danger gap-2" onClick={handleBulkDelete} disabled={selectedRecords.length === 0}>
                            <IconTrashLines />
                            {t('delete')}
                        </button>
                        <Link href="/bills/add" className="btn btn-primary gap-2">
                            <IconPlus />
                            {t('add_new_bill')}
                        </Link>
                    </div>
                    <div className="ltr:ml-auto rtl:mr-auto">
                        <input type="text" className="form-input w-auto" placeholder={t('search_bills')} value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>
                <div className="datatables pagination-padding relative">
                    <DataTable
                        records={records}
                        columns={columns}
                        totalRecords={initialRecords.length}
                        page={page}
                        onPageChange={setPage}
                        recordsPerPage={pageSize}
                        recordsPerPageOptions={PAGE_SIZES}
                        onRecordsPerPageChange={setPageSize}
                        sortStatus={sortStatus}
                        onSortStatusChange={setSortStatus}
                        selectedRecords={selectedRecords}
                        onSelectedRecordsChange={setSelectedRecords}
                        className={`${loading ? 'filter blur-sm pointer-events-none' : 'table-hover whitespace-nowrap'}`}
                        highlightOnHover
                        minHeight={300}
                    />
                </div>
            </div>{' '}
            <ConfirmModal
                isOpen={showConfirmModal}
                title={t('confirm')}
                message={t('confirm_delete')}
                onCancel={() => {
                    setShowConfirmModal(false);
                    setBillToDelete(null);
                }}
                onConfirm={confirmDeletion}
            />
            {/* Bulk Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={showBulkDeleteModal}
                title={t('confirm_bulk_deletion')}
                message={`${t('confirm_delete_selected_bills')}`}
                onCancel={() => setShowBulkDeleteModal(false)}
                onConfirm={confirmBulkDeletion}
                confirmLabel={t('delete')}
                cancelLabel={t('cancel')}
                size="sm"
            />
        </div>
    );
};

export default Bills;
