'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import supabase from '@/lib/supabase';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { sortBy } from 'lodash';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconPlus from '@/components/icon/icon-plus';
import IconEye from '@/components/icon/icon-eye';
import IconEdit from '@/components/icon/icon-edit';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconSearch from '@/components/icon/icon-search';
import ConfirmModal from '@/components/modals/confirm-modal';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import { getTranslation } from '@/i18n';

interface TripPlan {
    id: string;
    created_at: string;
    school_name: string;
    destination_name?: string;
    trip_date?: string;
    total_price: number;
}

const TripPlansList = () => {
    const { t } = getTranslation();
    const [items, setItems] = useState<TripPlan[]>([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<TripPlan[]>([]);
    const [records, setRecords] = useState<TripPlan[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<TripPlan[]>([]);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'created_at', direction: 'desc' });

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState<TripPlan | null>(null);
    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({ visible: false, message: '', type: 'success' });

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const { data, error } = await supabase.from('trip_plans').select('id, created_at, school_name, destination_name, trip_date, total_price').order('created_at', { ascending: false });

                if (error) throw error;
                setItems((data || []) as TripPlan[]);
            } catch (error) {
                console.error('Error fetching trip plans:', error);
                setAlert({ visible: true, message: t('error_loading_data'), type: 'danger' });
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, []);

    useEffect(() => setPage(1), [pageSize]);
    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords]);
    useEffect(() => {
        setInitialRecords(
            items.filter((item) => {
                const term = search.toLowerCase();
                if (!term) return true;
                return item.school_name?.toLowerCase().includes(term) || item.destination_name?.toLowerCase().includes(term);
            }),
        );
    }, [items, search]);
    useEffect(() => {
        const data2 = sortBy(initialRecords, sortStatus.columnAccessor);
        setInitialRecords(sortStatus.direction === 'desc' ? data2.reverse() : data2);
        setPage(1);
    }, [sortStatus]);

    const confirmDelete = (record: TripPlan) => {
        setRecordToDelete(record);
        setShowConfirmModal(true);
    };
    const confirmBulkDelete = () => setShowBulkDeleteModal(true);

    const deleteOne = async (id: string) => {
        const { error } = await supabase.from('trip_plans').delete().eq('id', id);
        if (error) throw error;
        setItems((prev) => prev.filter((x) => x.id !== id));
    };
    const bulkDelete = async (ids: string[]) => {
        const { error } = await supabase.from('trip_plans').delete().in('id', ids);
        if (error) throw error;
        setItems((prev) => prev.filter((x) => !ids.includes(x.id)));
    };

    return (
        <div className="panel border-white-light px-0 dark:border-[#1b2e4b]">
            <div className="mb-5 flex flex-col gap-5 px-5 md:items-start">
                <div className="flex items-center gap-2">
                    <IconMapPin className="h-6 w-6 text-primary" />
                    <h2 className="text-xl font-bold dark:text-white">{t('trip_plans_management')}</h2>
                </div>
            </div>

            <div className="mb-4.5 flex flex-col gap-4 px-5 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 items-center">
                    <div className="relative flex-1 max-w-[400px]">
                        <input className="form-input ltr:pl-9 rtl:pr-9" placeholder={t('search_trip_plans')} value={search} onChange={(e) => setSearch(e.target.value)} />
                        <IconSearch className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 ltr:left-3 rtl:right-3" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {selectedRecords.length > 0 && (
                        <button type="button" className="btn btn-danger gap-2" onClick={confirmBulkDelete}>
                            <IconTrashLines />
                            {t('delete_selected')} ({selectedRecords.length})
                        </button>
                    )}
                    <Link href="/trip-plans/add" className="btn btn-primary gap-2">
                        <IconPlus />
                        {t('add_trip_plan')}
                    </Link>
                </div>
            </div>

            <div className="datatables pagination-padding relative">
                <DataTable
                    className={`${loading ? 'filter blur-sm pointer-events-none' : 'table-hover whitespace-nowrap'} rtl-table-headers`}
                    records={records}
                    columns={[
                        { accessor: 'school_name', title: t('school'), sortable: true },
                        { accessor: 'destination_name', title: t('destination'), sortable: true },
                        { accessor: 'trip_date', title: t('trip_date'), sortable: true, render: ({ trip_date }) => (trip_date ? new Date(trip_date).toLocaleDateString('tr-TR') : '-') },
                        {
                            accessor: 'total_price',
                            title: t('total_price'),
                            sortable: true,
                            render: ({ total_price }) => <span className="font-semibold text-green-600">{total_price?.toFixed(2)}</span>,
                        },
                        {
                            accessor: 'actions',
                            title: t('actions'),
                            titleClassName: '!text-center',
                            render: (row) => (
                                <div className="flex items-center justify-center gap-2">
                                    <Link href={`/trip-plans/preview/${row.id}`} className="hover:text-info">
                                        <IconEye />
                                    </Link>
                                    <Link href={`/trip-plans/edit/${row.id}`} className="hover:text-primary">
                                        <IconEdit />
                                    </Link>
                                    <button type="button" className="hover:text-danger" onClick={() => confirmDelete(row)}>
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
                    noRecordsText={t('no_trip_plans_found')}
                    loadingText={t('loading')}
                    minHeight={300}
                />

                {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white dark:bg-black-dark-light bg-opacity-60 backdrop-blur-sm" />}
            </div>

            {alert.visible && (
                <div className="fixed top-4 right-4 z-50 min-w-80 max-w-md">
                    <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert({ ...alert, visible: false })} />
                </div>
            )}

            <ConfirmModal
                isOpen={showConfirmModal}
                title={t('confirm_delete')}
                message={t('confirm_delete_trip_plan_message')}
                onConfirm={async () => {
                    if (recordToDelete) {
                        try {
                            await deleteOne(recordToDelete.id);
                            setAlert({ visible: true, message: t('trip_plan_deleted_successfully'), type: 'success' });
                        } catch (e) {
                            setAlert({ visible: true, message: t('error_deleting_trip_plan'), type: 'danger' });
                        }
                    }
                    setRecordToDelete(null);
                    setShowConfirmModal(false);
                }}
                onCancel={() => {
                    setShowConfirmModal(false);
                    setRecordToDelete(null);
                }}
                confirmLabel={t('delete')}
                cancelLabel={t('cancel')}
            />

            <ConfirmModal
                isOpen={showBulkDeleteModal}
                title={t('confirm_bulk_delete')}
                message={`${t('confirm_bulk_delete_trip_plans_message')} (${selectedRecords.length})`}
                onConfirm={async () => {
                    try {
                        await bulkDelete(selectedRecords.map((r) => r.id));
                        setSelectedRecords([]);
                        setAlert({ visible: true, message: t('trip_plans_deleted_successfully'), type: 'success' });
                    } catch (e) {
                        setAlert({ visible: true, message: t('error_deleting_trip_plans'), type: 'danger' });
                    }
                    setShowBulkDeleteModal(false);
                }}
                onCancel={() => setShowBulkDeleteModal(false)}
                confirmLabel={t('delete_all')}
                cancelLabel={t('cancel')}
            />
        </div>
    );
};

export default TripPlansList;
