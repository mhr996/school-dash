'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import supabase from '@/lib/supabase';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { sortBy } from 'lodash';
import { getTranslation } from '@/i18n';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconPlus from '@/components/icon/icon-plus';
import IconEye from '@/components/icon/icon-eye';
import IconEdit from '@/components/icon/icon-edit';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconSearch from '@/components/icon/icon-search';
import ConfirmModal from '@/components/modals/confirm-modal';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';

type Destination = {
    id: string;
    created_at: string;
    name: string;
    phone: string | null;
    address: string | null;
    zone_id: string | null;
};

export default function DestinationsPage() {
    const { t } = getTranslation();

    const [items, setItems] = useState<Destination[]>([]);
    const [zonesMap, setZonesMap] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<Destination[]>([]);
    const [records, setRecords] = useState<Destination[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<Destination[]>([]);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'created_at', direction: 'desc' });

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState<Destination | null>(null);
    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({ visible: false, message: '', type: 'success' });

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const [{ data: dests, error: e1 }, { data: zones, error: e2 }] = await Promise.all([
                    supabase.from('destinations').select('id, created_at, name, phone, address, zone_id').order('created_at', { ascending: false }),
                    supabase.from('zones').select('id, name').eq('is_active', true),
                ]);
                if (e1) throw e1;
                if (e2) throw e2;
                setItems((dests || []) as Destination[]);
                const map: Record<string, string> = {};
                (zones || []).forEach((z: any) => (map[(z.id as string) || ''] = (z.name as string) || ''));
                setZonesMap(map);
            } catch (err) {
                console.error('Error loading destinations:', err);
                setAlert({ visible: true, message: t('error_loading_data'), type: 'danger' });
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    useEffect(() => setPage(1), [pageSize]);
    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords]);
    useEffect(() => {
        const term = search.toLowerCase();
        setInitialRecords(
            items.filter((d) => {
                if (!term) return true;
                const zoneName = (d.zone_id && zonesMap[d.zone_id]) || '';
                return d.name.toLowerCase().includes(term) || (d.phone || '').toLowerCase().includes(term) || (d.address || '').toLowerCase().includes(term) || zoneName.toLowerCase().includes(term);
            }),
        );
    }, [items, search, zonesMap]);
    useEffect(() => {
        const data2 = sortBy(initialRecords, sortStatus.columnAccessor);
        setInitialRecords(sortStatus.direction === 'desc' ? data2.reverse() : data2);
        setPage(1);
    }, [sortStatus]);

    const deleteOne = async (id: string) => {
        const { error } = await supabase.from('destinations').delete().eq('id', id);
        if (error) throw error;
        setItems((prev) => prev.filter((x) => x.id !== id));
    };
    const bulkDelete = async (ids: string[]) => {
        const { error } = await supabase.from('destinations').delete().in('id', ids);
        if (error) throw error;
        setItems((prev) => prev.filter((x) => !ids.includes(x.id)));
    };

    const zoneName = useMemo(() => (id?: string | null) => (id ? zonesMap[id] || '-' : '-'), [zonesMap]);

    return (
        <div className="panel border-white-light px-0 dark:border-[#1b2e4b]">
            <div className="mb-5 flex flex-col gap-5 px-5 md:items-start">
                <div className="flex items-center gap-3">
                    <IconMapPin className="h-6 w-6 text-primary" />
                    <h2 className="text-xl font-bold dark:text-white">{t('destinations_management')}</h2>
                </div>
            </div>
            <div className="mb-4.5 flex flex-col gap-4 px-5 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 items-center">
                    <div className="relative flex-1 max-w-[400px]">
                        <input className="form-input ltr:pl-9 rtl:pr-9" placeholder={t('search_destinations') || t('search')} value={search} onChange={(e) => setSearch(e.target.value)} />
                        <IconSearch className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 ltr:left-3 rtl:right-3" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {selectedRecords.length > 0 && (
                        <button type="button" className="btn btn-danger gap-2" onClick={() => setShowBulkDeleteModal(true)}>
                            <IconTrashLines />
                            {t('delete_selected')} ({selectedRecords.length})
                        </button>
                    )}
                    <Link href="/destinations/add" className="btn btn-primary gap-2">
                        <IconPlus />
                        {t('add_destination')}
                    </Link>
                </div>
            </div>

            <div className="datatables pagination-padding relative">
                <DataTable
                    className={`${loading ? 'filter blur-sm pointer-events-none' : 'table-hover whitespace-nowrap'} rtl-table-headers`}
                    records={records}
                    columns={[
                        { accessor: 'name', title: t('name'), sortable: true },
                        { accessor: 'phone', title: t('phone'), sortable: true, render: ({ phone }) => phone || '-' },
                        { accessor: 'address', title: t('address'), sortable: true, render: ({ address }) => address || '-' },
                        { accessor: 'zone_id', title: t('zone'), sortable: true, render: ({ zone_id }) => zoneName(zone_id) },
                        {
                            accessor: 'actions',
                            title: t('actions'),
                            titleClassName: '!text-center',
                            render: (row) => (
                                <div className="flex items-center justify-center gap-2">
                                    <Link href={`/destinations/preview/${row.id}`} className="hover:text-info" title={t('preview')}>
                                        <IconEye />
                                    </Link>
                                    <Link href={`/destinations/edit/${row.id}`} className="hover:text-primary" title={t('edit')}>
                                        <IconEdit />
                                    </Link>
                                    <button
                                        type="button"
                                        className="hover:text-danger"
                                        title={t('delete')}
                                        onClick={() => {
                                            setRecordToDelete(row);
                                            setShowConfirmModal(true);
                                        }}
                                    >
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
                    noRecordsText={t('no_destinations_found')}
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
                message={t('confirm_delete_destination_message')}
                onConfirm={async () => {
                    if (recordToDelete) {
                        try {
                            await deleteOne(recordToDelete.id);
                            setAlert({ visible: true, message: t('destination_deleted_successfully') || t('deleted_successfully'), type: 'success' });
                        } catch {
                            setAlert({ visible: true, message: t('error_deleting_destination') || t('error_deleting'), type: 'danger' });
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
                message={`${t('confirm_bulk_delete_destinations_message') || t('confirm_bulk_delete_message')} (${selectedRecords.length})`}
                onConfirm={async () => {
                    try {
                        await bulkDelete(selectedRecords.map((r) => r.id));
                        setSelectedRecords([]);
                        setAlert({ visible: true, message: t('destinations_deleted_successfully') || t('deleted_successfully'), type: 'success' });
                    } catch {
                        setAlert({ visible: true, message: t('error_deleting_destinations') || t('error_deleting'), type: 'danger' });
                    }
                    setShowBulkDeleteModal(false);
                }}
                onCancel={() => setShowBulkDeleteModal(false)}
                confirmLabel={t('delete_all')}
                cancelLabel={t('cancel')}
            />
        </div>
    );
}
