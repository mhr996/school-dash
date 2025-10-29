'use client';
import IconEdit from '@/components/icon/icon-edit';
import IconEye from '@/components/icon/icon-eye';
import IconPlus from '@/components/icon/icon-plus';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconStar from '@/components/icon/icon-star';
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
import { deleteFolderRecursively } from '@/utils/file-upload';
import { calculateServiceProviderBalance, ServiceProviderBalance } from '@/utils/service-balance-manager';

interface EntertainmentCompany {
    id: string;
    created_at: string;
    updated_at: string;
    name: string;
    image?: string;
    description?: string;
    price?: number;
    status?: string;
    balance?: number;
    average_rating?: number;
    total_ratings?: number;
}

// Helper function to get proper image URL
const getImageUrl = (image: string | undefined): string => {
    if (!image) return '/assets/images/img-placeholder-fallback.webp';

    // If it's already a full URL (starts with http), return as is
    if (image.startsWith('http')) return image;

    // If it starts with /entertainment-companies/, it's an old relative path
    if (image.startsWith('/entertainment-companies/')) {
        const path = image.replace('/entertainment-companies/', '');
        const {
            data: { publicUrl },
        } = supabase.storage.from('entertainment-companies').getPublicUrl(path);
        return publicUrl;
    }

    // Otherwise assume it's a direct path in the bucket
    const {
        data: { publicUrl },
    } = supabase.storage.from('entertainment-companies').getPublicUrl(image);
    return publicUrl;
};

const EntertainmentCompaniesList = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const [items, setItems] = useState<EntertainmentCompany[]>([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<EntertainmentCompany[]>([]);
    const [records, setRecords] = useState<EntertainmentCompany[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<EntertainmentCompany[]>([]);

    const [search, setSearch] = useState('');

    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'created_at',
        direction: 'desc',
    });

    // Modal and alert states
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [companyToDelete, setCompanyToDelete] = useState<EntertainmentCompany | null>(null);
    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({
        visible: false,
        message: '',
        type: 'success',
    });

    useEffect(() => {
        const fetchEntertainmentCompanies = async () => {
            try {
                const { data, error } = await supabase.from('external_entertainment_companies').select('*').order('created_at', { ascending: false });

                if (error) throw error;

                // Fetch balances and ratings for all entertainment companies
                const companiesWithBalance = await Promise.all(
                    (data || []).map(async (company) => {
                        const balanceData = await calculateServiceProviderBalance('external_entertainment_companies', company.id);

                        // Fetch ratings for this entertainment company
                        const { data: ratingsData } = await supabase.from('ratings').select('rating').eq('service_type', 'external_entertainment_companies').eq('service_id', company.id);

                        const totalRatings = ratingsData?.length || 0;
                        const averageRating = ratingsData && ratingsData.length > 0 ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length : 0;

                        return {
                            ...company,
                            balance: balanceData?.netBalance || 0,
                            average_rating: averageRating,
                            total_ratings: totalRatings,
                        };
                    }),
                );

                setItems(companiesWithBalance);
            } catch (error) {
                console.error('Error fetching entertainment companies:', error);
                setAlert({ visible: true, message: t('error_loading_entertainment_companies'), type: 'danger' });
            } finally {
                setLoading(false);
            }
        };
        fetchEntertainmentCompanies();
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
                    !searchTerm || item.name.toLowerCase().includes(searchTerm) || item.description?.toLowerCase().includes(searchTerm) || (item.price && item.price.toString().includes(searchTerm));

                return matchesSearch;
            }),
        );
    }, [items, search]);

    useEffect(() => {
        const data2 = sortBy(initialRecords, sortStatus.columnAccessor);
        setInitialRecords(sortStatus.direction === 'desc' ? data2.reverse() : data2);
        setPage(1);
    }, [sortStatus]);

    const deleteEntertainmentCompany = async (company: EntertainmentCompany) => {
        try {
            // Get the user_id linked to this entertainment company
            const { data: companyData, error: fetchError } = await supabase.from('external_entertainment_companies').select('user_id').eq('id', company.id).single();

            if (fetchError) throw fetchError;

            // Delete the entertainment company record from database
            const { error } = await supabase.from('external_entertainment_companies').delete().eq('id', company.id);

            if (error) throw error;

            // Delete the associated folder from storage if it exists
            await deleteFolderRecursively('entertainment-companies', company.id);

            // If there's a linked user account, delete it from public.users and auth.users
            if (companyData?.user_id) {
                // Get the auth_user_id from public.users
                const { data: userData, error: userFetchError } = await supabase.from('users').select('auth_user_id').eq('id', companyData.user_id).single();

                if (!userFetchError && userData?.auth_user_id) {
                    // Delete from public.users
                    await supabase.from('users').delete().eq('id', companyData.user_id);

                    // Delete from auth.users using admin API
                    await supabase.auth.admin.deleteUser(userData.auth_user_id);
                }
            }

            setItems((prevItems) => prevItems.filter((item) => item.id !== company.id));
            setAlert({ visible: true, message: t('entertainment_company_deleted_successfully'), type: 'success' });
        } catch (error) {
            console.error('Error deleting entertainment company:', error);
            setAlert({ visible: true, message: t('error_deleting_entertainment_company'), type: 'danger' });
        }
    };

    const bulkDelete = async () => {
        try {
            const ids = selectedRecords.map((record) => record.id);

            // First delete the entertainment company records from database
            const { error } = await supabase.from('external_entertainment_companies').delete().in('id', ids);

            if (error) throw error;

            // Then attempt to delete storage folders for each entertainment company recursively
            const results = await Promise.allSettled(ids.map((id) => deleteFolderRecursively('entertainment-companies', id)));
            const failed = results
                .map((r, i) => ({ r, id: ids[i] }))
                .filter((x) => x.r.status === 'rejected' || (x.r.status === 'fulfilled' && x.r.value === false))
                .map((x) => x.id);
            if (failed.length > 0) {
                console.warn('Failed to delete some storage folders:', failed);
            }

            setItems((prevItems) => prevItems.filter((item) => !ids.includes(item.id)));
            setSelectedRecords([]);
            setAlert({ visible: true, message: t('entertainment_companies_deleted_successfully'), type: 'success' });
        } catch (error) {
            console.error('Error bulk deleting entertainment companies:', error);
            setAlert({ visible: true, message: t('error_deleting_entertainment_companies'), type: 'danger' });
        }
    };

    const confirmDelete = (company: EntertainmentCompany) => {
        setCompanyToDelete(company);
        setShowConfirmModal(true);
    };

    const confirmBulkDelete = () => {
        setShowBulkDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (companyToDelete) {
            await deleteEntertainmentCompany(companyToDelete);
            setCompanyToDelete(null);
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
                    <IconStar className="h-6 w-6 text-primary" />
                    <h2 className="text-xl font-bold dark:text-white">{t('external_entertainment_companies_management')}</h2>
                </div>
            </div>

            {/* Search and Actions */}
            <div className="mb-4.5 flex flex-col gap-4 px-5 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 items-center">
                    <div className="relative flex-1 max-w-[400px]">
                        <input type="text" className="form-input ltr:pl-9 rtl:pr-9" placeholder={t('search_entertainment_companies')} value={search} onChange={(e) => setSearch(e.target.value)} />
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
                    <Link href="/external-entertainment-companies/add" className="btn btn-primary gap-2">
                        <IconPlus />
                        {t('add_entertainment_company')}
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
                            accessor: 'image',
                            title: t('image'),
                            render: ({ image, name }) => (
                                <div className="w-12 h-12">
                                    {image ? (
                                        <img
                                            src={getImageUrl(image)}
                                            alt={name}
                                            className="w-12 h-12 object-cover rounded-lg"
                                            onError={(e) => {
                                                e.currentTarget.src = '/assets/images/img-placeholder-fallback.webp';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                            <span className="text-xs text-gray-500">No Image</span>
                                        </div>
                                    )}
                                </div>
                            ),
                        },
                        {
                            accessor: 'name',
                            title: t('entertainment_company_name'),
                            sortable: true,
                            render: ({ name }) => <div className="font-semibold">{name}</div>,
                        },
                        {
                            accessor: 'description',
                            title: t('description'),
                            render: ({ description }) => (
                                <div className="text-sm max-w-xs">
                                    {description ? <span className="line-clamp-2">{description}</span> : <span className="text-gray-400">{t('not_specified')}</span>}
                                </div>
                            ),
                        },
                        {
                            accessor: 'price',
                            title: t('price'),
                            sortable: true,
                            render: ({ price }) => (
                                <div className="text-sm">
                                    {price ? <span className="badge badge-outline-success">{price.toLocaleString()} ₪</span> : <span className="text-gray-400">{t('not_specified')}</span>}
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
                            render: (company) => (
                                <div className="flex items-center justify-center gap-2">
                                    <Link href={`/external-entertainment-companies/preview/${company.id}`} className="hover:text-info">
                                        <IconEye />
                                    </Link>
                                    <Link href={`/external-entertainment-companies/edit/${company.id}`} className="hover:text-primary">
                                        <IconEdit />
                                    </Link>
                                    <button type="button" className="hover:text-danger" onClick={() => confirmDelete(company)}>
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
                    noRecordsText={t('no_entertainment_companies_found')}
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
                message={t('confirm_delete_security_company_message')}
                onConfirm={handleDeleteConfirm}
                onCancel={() => {
                    setShowConfirmModal(false);
                    setCompanyToDelete(null);
                }}
                confirmLabel={t('delete')}
                cancelLabel={t('cancel')}
            />

            {/* Bulk Delete Modal */}
            <ConfirmModal
                isOpen={showBulkDeleteModal}
                title={t('confirm_bulk_delete')}
                message={`${t('confirm_bulk_delete_entertainment_companies_message')} (${selectedRecords.length})`}
                onConfirm={handleBulkDeleteConfirm}
                onCancel={() => setShowBulkDeleteModal(false)}
                confirmLabel={t('delete_all')}
                cancelLabel={t('cancel')}
            />
        </div>
    );
};

export default EntertainmentCompaniesList;
