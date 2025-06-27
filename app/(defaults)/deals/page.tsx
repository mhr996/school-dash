'use client';
import IconEdit from '@/components/icon/icon-edit';
import IconEye from '@/components/icon/icon-eye';
import IconPlus from '@/components/icon/icon-plus';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import { sortBy } from 'lodash';
import { DataTableSortStatus, DataTable } from 'mantine-datatable';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import ConfirmModal from '@/components/modals/confirm-modal';
import { getTranslation } from '@/i18n';
import { deleteFolder } from '@/utils/file-upload';
import { Deal } from '@/types';
import AttachmentsDisplay from '@/components/attachments/attachments-display';
import { logActivity } from '@/utils/activity-logger';

const DealsList = () => {
    const { t } = getTranslation();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<Deal[]>([]);
    const [records, setRecords] = useState<Deal[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<Deal[]>([]);

    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'title',
        direction: 'asc',
    }); // Modal and alert states
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

    useEffect(() => {
        const fetchDeals = async () => {
            try {
                const { data, error } = await supabase
                    .from('deals')
                    .select(
                        `
                        *,
                        customers!deals_customer_id_fkey (
                            name,
                            id_number
                        )
                    `,
                    )
                    .order('created_at', { ascending: false });
                if (error) throw error;

                setItems(data as any[]);
            } catch (error) {
                console.error('Error fetching deals:', error);
                setAlert({ message: t('error_loading_data'), type: 'danger' });
            } finally {
                setLoading(false);
            }
        };
        fetchDeals();
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
                return (
                    item.title.toLowerCase().includes(search.toLowerCase()) ||
                    item.description.toLowerCase().includes(search.toLowerCase()) ||
                    item.deal_type.toLowerCase().includes(search.toLowerCase()) ||
                    item.status.toLowerCase().includes(search.toLowerCase()) ||
                    (item.customers?.name && item.customers.name.toLowerCase().includes(search.toLowerCase())) ||
                    (item.customers?.id_number && item.customers.id_number.toLowerCase().includes(search.toLowerCase()))
                );
            }),
        );
    }, [items, search]);

    useEffect(() => {
        const sorted = sortBy(initialRecords, sortStatus.columnAccessor);
        setRecords(sortStatus.direction === 'desc' ? sorted.reverse() : sorted);
        setPage(1);
    }, [sortStatus, initialRecords]);

    const deleteRow = (id: string | null = null) => {
        if (id) {
            const deal = items.find((d) => d.id === id);
            if (deal) {
                setDealToDelete(deal);
                setShowConfirmModal(true);
            }
        }
    };
    const confirmDeletion = async () => {
        if (!dealToDelete) return;
        try {
            // Log the activity before deletion (to preserve deal data)
            await logActivity({
                type: 'deal_deleted',
                deal: dealToDelete,
            });

            // Delete the deal from database
            const { error } = await supabase.from('deals').delete().eq('id', dealToDelete.id);
            if (error) throw error;

            // Delete associated files from storage
            try {
                await deleteFolder('deals', dealToDelete.id);
            } catch (fileError) {
                console.warn('Warning: Could not delete deal files:', fileError);
                // Don't fail the deletion if file cleanup fails
            }

            const updatedItems = items.filter((d) => d.id !== dealToDelete.id);
            setItems(updatedItems);
            setAlert({ message: t('deal_deleted_successfully'), type: 'success' });
        } catch (error) {
            console.error('Deletion error:', error);
            setAlert({ message: t('error_deleting_deal'), type: 'danger' });
        } finally {
            setShowConfirmModal(false);
            setDealToDelete(null);
        }
    };
    const handleBulkDelete = () => {
        if (selectedRecords.length === 0) return;
        setShowBulkDeleteModal(true);
    };
    const confirmBulkDeletion = async () => {
        const ids = selectedRecords.map((d) => d.id);
        try {
            // Delete deals from database
            const { error } = await supabase.from('deals').delete().in('id', ids);
            if (error) throw error;

            // Delete associated files from storage for each deal
            for (const dealId of ids) {
                try {
                    await deleteFolder('deals', dealId);
                } catch (fileError) {
                    console.warn(`Warning: Could not delete files for deal ${dealId}:`, fileError);
                    // Don't fail the deletion if file cleanup fails
                }
            }

            setItems(items.filter((d) => !ids.includes(d.id)));
            setSelectedRecords([]);
            setAlert({ message: t('deals_deleted_successfully'), type: 'success' });
        } catch (error) {
            console.error('Error deleting deals:', error);
            setAlert({ message: t('error_deleting_deal'), type: 'danger' });
        } finally {
            setShowBulkDeleteModal(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const getDealTypeBadgeClass = (type: string) => {
        switch (type) {
            case 'new_used_sale':
                return 'badge-outline-success';
            case 'exchange':
                return 'badge-outline-primary';
            case 'intermediary':
                return 'badge-outline-warning';
            case 'company_commission':
                return 'badge-outline-info';
            default:
                return 'badge-outline-secondary';
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'active':
                return 'badge-outline-success';
            case 'completed':
                return 'badge-outline-primary';
            case 'cancelled':
                return 'badge-outline-danger';
            default:
                return 'badge-outline-secondary';
        }
    };

    return (
        <div className="panel border-white-light px-0 dark:border-[#1b2e4b]">
            {alert && (
                <div className="fixed top-4 right-4 z-50 min-w-80 max-w-md">
                    <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert(null)} />
                </div>
            )}
            <div className="invoice-table">
                <div className="mb-4.5 flex flex-col gap-5 px-5 md:flex-row md:items-center">
                    <div className="flex items-center gap-2">
                        <button type="button" className="btn btn-danger gap-2" onClick={handleBulkDelete} disabled={selectedRecords.length === 0}>
                            <IconTrashLines />
                            {t('delete')}
                        </button>
                        <Link href="/deals/add" className="btn btn-primary gap-2">
                            <IconPlus />
                            {t('add_new')}
                        </Link>
                    </div>
                    <div className="ltr:ml-auto rtl:mr-auto">
                        <input type="text" className="form-input w-auto" placeholder={t('search')} value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>

                <div className="datatables pagination-padding relative">
                    <DataTable
                        className={`${loading ? 'filter blur-sm pointer-events-none' : 'table-hover whitespace-nowrap'}`}
                        records={records}
                        columns={[
                            {
                                accessor: 'id',
                                title: t('id'),
                                sortable: true,
                                render: ({ id }) => <strong className="text-info">#{id}</strong>,
                            },
                            {
                                accessor: 'customer_name',
                                title: 'اسم الزبون',
                                sortable: true,
                                render: ({ customers, title }) => (
                                    <div>
                                        <div className="font-semibold">{customers?.name || t('no_customer')}</div>
                                        <div className="text-xs text-gray-500 mt-1">{title}</div>
                                    </div>
                                ),
                            },
                            {
                                accessor: 'customer_identity',
                                title: t('id_number'),
                                sortable: true,
                                render: ({ customers }) => <div className="text-sm">{customers?.id_number || '-'}</div>,
                            },
                            {
                                accessor: 'deal_type',
                                title: t('deal_type'),
                                sortable: true,
                                render: ({ deal_type }) => <span className={`badge ${getDealTypeBadgeClass(deal_type)}`}>{t(`deal_type_${deal_type}`)}</span>,
                            },
                            {
                                accessor: 'amount',
                                title: t('amount'),
                                sortable: true,
                                render: ({ amount }) => <span className="text-success">{formatCurrency(amount)}</span>,
                            },
                            {
                                accessor: 'status',
                                title: t('status'),
                                sortable: true,
                                render: ({ status }) => <span className={`badge ${getStatusBadgeClass(status)}`}>{t(`status_${status}`)}</span>,
                            },
                            {
                                accessor: 'created_at',
                                title: t('created_date'),
                                sortable: true,
                                render: ({ created_at }) => <span>{new Date(created_at).toLocaleDateString()}</span>,
                            },

                            {
                                accessor: 'action',
                                title: t('actions'),
                                sortable: false,
                                textAlignment: 'center',
                                render: ({ id }) => (
                                    <div className="mx-auto flex w-max items-center gap-4">
                                        <Link href={`/deals/edit/${id}`} className="flex hover:text-info">
                                            <IconEdit className="h-4.5 w-4.5" />
                                        </Link>
                                        <Link href={`/deals/preview/${id}`} className="flex hover:text-primary">
                                            <IconEye />
                                        </Link>
                                        <button type="button" className="flex hover:text-danger" onClick={() => deleteRow(id)}>
                                            <IconTrashLines />
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
                        minHeight={300}
                    />

                    {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white dark:bg-black-dark-light bg-opacity-60 backdrop-blur-sm" />}
                </div>
            </div>{' '}
            <ConfirmModal
                isOpen={showConfirmModal}
                title={t('confirm_deletion')}
                message={t('confirm_delete_deal')}
                onCancel={() => {
                    setShowConfirmModal(false);
                    setDealToDelete(null);
                }}
                onConfirm={confirmDeletion}
                confirmLabel={t('delete')}
                cancelLabel={t('cancel')}
                size="sm"
            />
            {/* Bulk Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={showBulkDeleteModal}
                title={t('confirm_bulk_deletion')}
                message={`${t('confirm_delete_selected_deals')}`}
                onCancel={() => setShowBulkDeleteModal(false)}
                onConfirm={confirmBulkDeletion}
                confirmLabel={t('delete')}
                cancelLabel={t('cancel')}
                size="sm"
            />
        </div>
    );
};

export default DealsList;
