'use client';
import IconEdit from '@/components/icon/icon-edit';
import IconEye from '@/components/icon/icon-eye';
import IconPlus from '@/components/icon/icon-plus';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconUser from '@/components/icon/icon-user';
import IconSearch from '@/components/icon/icon-search';
import { sortBy } from 'lodash';
import { DataTableSortStatus, DataTable } from 'mantine-datatable';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';
import { Alert } from '@/components/elements/alerts/elements-alerts-default';
import ConfirmModal from '@/components/modals/confirm-modal';
import { getTranslation } from '@/i18n';
import { useRouter } from 'next/navigation';
import { calculateServiceProviderBalance, ServiceProviderBalance } from '@/utils/service-balance-manager';

interface Guide {
    id: string;
    created_at: string;
    updated_at: string;
    name: string;
    identity_number: string;
    phone?: string;
    email?: string;
    hourly_rate?: number;
    daily_rate?: number;
    regional_rate?: number;
    overnight_rate?: number;
    status?: string;
    notes?: string;
    balance?: number;
}

const GuidesList = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const [items, setItems] = useState<Guide[]>([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<Guide[]>([]);
    const [records, setRecords] = useState<Guide[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<Guide[]>([]);

    const [search, setSearch] = useState('');

    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'created_at',
        direction: 'desc',
    });

    // Modal and alert states
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [guideToDelete, setGuideToDelete] = useState<Guide | null>(null);
    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({
        visible: false,
        message: '',
        type: 'success',
    });

    useEffect(() => {
        const fetchGuides = async () => {
            try {
                const { data, error } = await supabase.from('guides').select('*').order('created_at', { ascending: false });

                if (error) throw error;

                // Fetch balances for all guides
                const guidesWithBalance = await Promise.all(
                    (data as Guide[]).map(async (guide) => {
                        const balanceData = await calculateServiceProviderBalance('guides', guide.id);
                        return {
                            ...guide,
                            balance: balanceData?.netBalance || 0,
                        };
                    }),
                );

                setItems(guidesWithBalance);
            } catch (error) {
                console.error('Error fetching guides:', error);
                setAlert({ visible: true, message: t('error_loading_data'), type: 'danger' });
            } finally {
                setLoading(false);
            }
        };
        fetchGuides();
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
                    item.name.toLowerCase().includes(searchTerm) ||
                    item.identity_number?.toLowerCase().includes(searchTerm) ||
                    item.phone?.toLowerCase().includes(searchTerm) ||
                    item.email?.toLowerCase().includes(searchTerm) ||
                    item.notes?.toLowerCase().includes(searchTerm);

                return matchesSearch;
            }),
        );
    }, [items, search]);

    useEffect(() => {
        const data2 = sortBy(initialRecords, sortStatus.columnAccessor);
        setInitialRecords(sortStatus.direction === 'desc' ? data2.reverse() : data2);
        setPage(1);
    }, [sortStatus]);

    const deleteGuide = async (guide: Guide) => {
        try {
            // Get the user_id linked to this guide
            const { data: guideData, error: fetchError } = await supabase.from('guides').select('user_id').eq('id', guide.id).single();

            if (fetchError) throw fetchError;

            // Delete from guides table
            const { error } = await supabase.from('guides').delete().eq('id', guide.id);

            if (error) throw error;

            // If there's a linked user account, delete it from public.users and auth.users
            if (guideData?.user_id) {
                // Get the auth_user_id from public.users
                const { data: userData, error: userFetchError } = await supabase.from('users').select('auth_user_id').eq('id', guideData.user_id).single();

                if (!userFetchError && userData?.auth_user_id) {
                    // Delete from public.users
                    await supabase.from('users').delete().eq('id', guideData.user_id);

                    // Delete from auth.users using admin API
                    await supabase.auth.admin.deleteUser(userData.auth_user_id);
                }
            }

            setItems((prevItems) => prevItems.filter((item) => item.id !== guide.id));
            setAlert({ visible: true, message: t('guide_deleted_successfully'), type: 'success' });
        } catch (error) {
            console.error('Error deleting guide:', error);
            setAlert({ visible: true, message: t('error_deleting_guide'), type: 'danger' });
        }
    };

    const bulkDelete = async () => {
        try {
            const ids = selectedRecords.map((record) => record.id);
            const { error } = await supabase.from('guides').delete().in('id', ids);

            if (error) throw error;

            setItems((prevItems) => prevItems.filter((item) => !ids.includes(item.id)));
            setSelectedRecords([]);
            setAlert({ visible: true, message: t('guides_deleted_successfully'), type: 'success' });
        } catch (error) {
            console.error('Error bulk deleting guides:', error);
            setAlert({ visible: true, message: t('error_deleting_guides'), type: 'danger' });
        }
    };

    const confirmDelete = (guide: Guide) => {
        setGuideToDelete(guide);
        setShowConfirmModal(true);
    };

    const confirmBulkDelete = () => {
        setShowBulkDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (guideToDelete) {
            await deleteGuide(guideToDelete);
            setGuideToDelete(null);
        }
        setShowConfirmModal(false);
    };

    const handleBulkDeleteConfirm = async () => {
        await bulkDelete();
        setShowBulkDeleteModal(false);
    };

    return (
        <div className="panel border-white-light px-0 dark:border-[#1b2e4b]">
            {/* Header */}
            <div className="mb-5 flex flex-col gap-5 px-5 md:items-start">
                <div className="flex items-center gap-2">
                    <IconUser className="h-6 w-6 text-primary" />
                    <h2 className="text-xl font-bold dark:text-white">{t('guides_management')}</h2>
                </div>
            </div>

            {/* Search and Actions */}
            <div className="mb-4.5 flex flex-col gap-4 px-5 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 items-center">
                    <div className="relative flex-1 max-w-[400px]">
                        <input type="text" className="form-input ltr:pl-9 rtl:pr-9" placeholder={t('search_guides')} value={search} onChange={(e) => setSearch(e.target.value)} />
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
                    <Link href="/guides/add" className="btn btn-primary gap-2">
                        <IconPlus />
                        {t('add_guide')}
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
                            accessor: 'identity_number',
                            title: t('identity_number'),
                            sortable: true,
                            render: ({ identity_number, name }) => (
                                <div>
                                    <div className="font-semibold">{identity_number || t('no_code')}</div>
                                    <div className="text-s">{name}</div>
                                </div>
                            ),
                        },
                        {
                            accessor: 'contact',
                            title: t('contact'),
                            render: ({ phone, email }) => (
                                <div>
                                    {phone && <div className="text-sm">{phone}</div>}
                                    {email && <div className="text-sm text-gray-500">{email}</div>}
                                </div>
                            ),
                        },
                        {
                            accessor: 'rates',
                            title: t('rates'),
                            render: ({ hourly_rate, daily_rate, regional_rate, overnight_rate }) => (
                                <div className="text-sm">
                                    <div>
                                        {t('hourly_rate')}: {hourly_rate ? <span className="text-green-500 font-semibold">{hourly_rate}</span> : t('not_specified')}
                                    </div>
                                    <div>
                                        {t('daily_rate')}: {daily_rate ? <span className="text-green-500 font-semibold">{daily_rate}</span> : t('not_specified')}
                                    </div>
                                    <div>
                                        {t('regional_rate')}: {regional_rate ? <span className="text-green-500 font-semibold">{regional_rate}</span> : t('not_specified')}
                                    </div>
                                    <div>
                                        {t('overnight_rate')}: {overnight_rate ? <span className="text-green-500 font-semibold">{overnight_rate}</span> : t('not_specified')}
                                    </div>
                                </div>
                            ),
                        },
                        {
                            accessor: 'balance',
                            title: t('balance'),
                            sortable: true,
                            render: ({ balance }) => (
                                <div className="font-semibold">
                                    <span className={balance && balance > 0 ? 'text-green-600' : balance && balance < 0 ? 'text-red-600' : 'text-gray-500'}>
                                        ₪{balance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                    </span>
                                </div>
                            ),
                        },
                        {
                            accessor: 'status',
                            title: t('status'),
                            sortable: true,
                            render: ({ status }) => (
                                <span className={`badge ${status === 'active' ? 'badge-outline-success' : 'badge-outline-danger'}`}>{status === 'active' ? t('active') : t('inactive')}</span>
                            ),
                        },
                        {
                            accessor: 'created_at',
                            title: t('created_at'),
                            sortable: true,
                            render: ({ created_at }) => new Date(created_at).toLocaleDateString('tr-TR'),
                        },
                        {
                            accessor: 'actions',
                            title: t('actions'),
                            titleClassName: '!text-center',
                            render: (guide) => (
                                <div className="flex items-center justify-center gap-2">
                                    <Link href={`/guides/preview/${guide.id}`} className="hover:text-info">
                                        <IconEye />
                                    </Link>
                                    <Link href={`/guides/edit/${guide.id}`} className="hover:text-primary">
                                        <IconEdit />
                                    </Link>
                                    <button type="button" className="hover:text-danger" onClick={() => confirmDelete(guide)}>
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
                    noRecordsText={t('no_guides_found')}
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

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={showConfirmModal}
                title={t('confirm_delete')}
                message={t('confirm_delete_guide_message')}
                onConfirm={handleDeleteConfirm}
                onCancel={() => {
                    setShowConfirmModal(false);
                    setGuideToDelete(null);
                }}
                confirmLabel={t('delete')}
                cancelLabel={t('cancel')}
            />

            {/* Bulk Delete Modal */}
            <ConfirmModal
                isOpen={showBulkDeleteModal}
                title={t('confirm_bulk_delete')}
                message={`${t('confirm_bulk_delete_guides_message')} (${selectedRecords.length})`}
                onConfirm={handleBulkDeleteConfirm}
                onCancel={() => setShowBulkDeleteModal(false)}
                confirmLabel={t('delete_all')}
                cancelLabel={t('cancel')}
            />
        </div>
    );
};

export default GuidesList;
