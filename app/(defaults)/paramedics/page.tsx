'use client';
import IconEdit from '@/components/icon/icon-edit';
import IconEye from '@/components/icon/icon-eye';
import IconPlus from '@/components/icon/icon-plus';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconHeart from '@/components/icon/icon-heart';
import IconSearch from '@/components/icon/icon-search';
import IconStar from '@/components/icon/icon-star';
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
import { getServiceProfileUrl } from '@/utils/service-profile-upload';

interface Paramedic {
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
    profile_picture_url?: string | null;
    average_rating?: number;
    total_ratings?: number;
}

const ParamedicsList = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const [items, setItems] = useState<Paramedic[]>([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<Paramedic[]>([]);
    const [records, setRecords] = useState<Paramedic[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<Paramedic[]>([]);

    const [search, setSearch] = useState('');

    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'created_at',
        direction: 'desc',
    });

    // Modal and alert states
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [paramedicToDelete, setParamedicToDelete] = useState<Paramedic | null>(null);
    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({
        visible: false,
        message: '',
        type: 'success',
    });

    useEffect(() => {
        const fetchParamedics = async () => {
            try {
                const { data, error } = await supabase.from('paramedics').select('*').order('created_at', { ascending: false });

                if (error) throw error;

                // Fetch balances and ratings for all paramedics
                const paramedicsWithBalance = await Promise.all(
                    (data as Paramedic[]).map(async (paramedic) => {
                        const balanceData = await calculateServiceProviderBalance('paramedics', paramedic.id);

                        // Fetch ratings for this paramedic
                        const { data: ratingsData } = await supabase.from('ratings').select('rating').eq('service_type', 'paramedics').eq('service_id', paramedic.id);

                        const totalRatings = ratingsData?.length || 0;
                        const averageRating = ratingsData && ratingsData.length > 0 ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length : 0;

                        return {
                            ...paramedic,
                            balance: balanceData?.netBalance || 0,
                            average_rating: averageRating,
                            total_ratings: totalRatings,
                        };
                    }),
                );

                setItems(paramedicsWithBalance);
            } catch (error) {
                console.error('Error fetching paramedics:', error);
                setAlert({ visible: true, message: t('error_loading_data'), type: 'danger' });
            } finally {
                setLoading(false);
            }
        };
        fetchParamedics();
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

    const deleteParamedic = async (paramedic: Paramedic) => {
        try {
            // Get the user_id linked to this paramedic
            const { data: paramedicData, error: fetchError } = await supabase.from('paramedics').select('user_id').eq('id', paramedic.id).single();

            if (fetchError) throw fetchError;

            // Delete from paramedics table
            const { error } = await supabase.from('paramedics').delete().eq('id', paramedic.id);

            if (error) throw error;

            // If there's a linked user account, delete it from public.users and auth.users
            if (paramedicData?.user_id) {
                // Get the auth_user_id from public.users
                const { data: userData, error: userFetchError } = await supabase.from('users').select('auth_user_id').eq('id', paramedicData.user_id).single();

                if (!userFetchError && userData?.auth_user_id) {
                    // Delete from public.users
                    await supabase.from('users').delete().eq('id', paramedicData.user_id);

                    // Delete from auth.users using admin API
                    await supabase.auth.admin.deleteUser(userData.auth_user_id);
                }
            }

            setItems((prevItems) => prevItems.filter((item) => item.id !== paramedic.id));
            setAlert({ visible: true, message: t('paramedic_deleted_successfully'), type: 'success' });
        } catch (error) {
            console.error('Error deleting paramedic:', error);
            setAlert({ visible: true, message: t('error_deleting_paramedic'), type: 'danger' });
        }
    };

    const bulkDelete = async () => {
        try {
            const ids = selectedRecords.map((record) => record.id);
            const { error } = await supabase.from('paramedics').delete().in('id', ids);

            if (error) throw error;

            setItems((prevItems) => prevItems.filter((item) => !ids.includes(item.id)));
            setSelectedRecords([]);
            setAlert({ visible: true, message: t('paramedics_deleted_successfully'), type: 'success' });
        } catch (error) {
            console.error('Error bulk deleting paramedics:', error);
            setAlert({ visible: true, message: t('error_deleting_paramedics'), type: 'danger' });
        }
    };

    const confirmDelete = (paramedic: Paramedic) => {
        setParamedicToDelete(paramedic);
        setShowConfirmModal(true);
    };

    const confirmBulkDelete = () => {
        setShowBulkDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (paramedicToDelete) {
            await deleteParamedic(paramedicToDelete);
            setParamedicToDelete(null);
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
                    <IconHeart className="h-6 w-6 text-primary" />
                    <h2 className="text-xl font-bold dark:text-white">{t('paramedics_management')}</h2>
                </div>
            </div>

            {/* Search and Actions */}
            <div className="mb-4.5 flex flex-col gap-4 px-5 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 items-center">
                    <div className="relative flex-1 max-w-[400px]">
                        <input type="text" className="form-input ltr:pl-9 rtl:pr-9" placeholder={t('search_paramedics')} value={search} onChange={(e) => setSearch(e.target.value)} />
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
                    <Link href="/paramedics/add" className="btn btn-primary gap-2">
                        <IconPlus />
                        {t('add_paramedic')}
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
                            accessor: 'profile_picture',
                            title: t('profile_picture'),
                            render: ({ profile_picture_url, name }) => (
                                <div className="flex items-center justify-center">
                                    <img
                                        src={getServiceProfileUrl(profile_picture_url)}
                                        alt={name}
                                        className="h-10 w-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                                        onError={(e) => {
                                            e.currentTarget.src = '/assets/images/img-placeholder-fallback.webp';
                                        }}
                                    />
                                </div>
                            ),
                        },
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
                            accessor: 'average_rating',
                            title: t('rating'),
                            sortable: true,
                            render: ({ average_rating, total_ratings }) => (
                                <div className="flex items-center gap-1">
                                    {total_ratings && total_ratings > 0 ? (
                                        <>
                                            <IconStar className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                            <span className="font-semibold">{average_rating?.toFixed(1)}</span>
                                            <span className="text-gray-500 text-xs">({total_ratings})</span>
                                        </>
                                    ) : (
                                        <span className="text-gray-400 text-xs">{t('no_ratings')}</span>
                                    )}
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
                            render: (paramedic) => (
                                <div className="flex items-center justify-center gap-2">
                                    <Link href={`/paramedics/preview/${paramedic.id}`} className="hover:text-info">
                                        <IconEye />
                                    </Link>
                                    <Link href={`/paramedics/edit/${paramedic.id}`} className="hover:text-primary">
                                        <IconEdit />
                                    </Link>
                                    <button type="button" className="hover:text-danger" onClick={() => confirmDelete(paramedic)}>
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
                    noRecordsText={t('no_paramedics_found')}
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
                message={t('confirm_delete_paramedic_message')}
                onConfirm={handleDeleteConfirm}
                onCancel={() => {
                    setShowConfirmModal(false);
                    setParamedicToDelete(null);
                }}
                confirmLabel={t('delete')}
                cancelLabel={t('cancel')}
            />

            {/* Bulk Delete Modal */}
            <ConfirmModal
                isOpen={showBulkDeleteModal}
                title={t('confirm_bulk_delete')}
                message={`${t('confirm_bulk_delete_paramedics_message')} (${selectedRecords.length})`}
                onConfirm={handleBulkDeleteConfirm}
                onCancel={() => setShowBulkDeleteModal(false)}
                confirmLabel={t('delete_all')}
                cancelLabel={t('cancel')}
            />
        </div>
    );
};

export default ParamedicsList;
