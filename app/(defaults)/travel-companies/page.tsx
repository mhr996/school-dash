'use client';
import IconEdit from '@/components/icon/icon-edit';
import IconEye from '@/components/icon/icon-eye';
import IconPlus from '@/components/icon/icon-plus';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconBuilding from '@/components/icon/icon-building';
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
import { getServiceProfilePictureUrlWithFallback, deleteServiceFolder } from '@/utils/service-profile-picture';
import Image from 'next/image';

interface TravelCompany {
    id: string;
    created_at: string;
    updated_at: string;
    name: string;
    code: string;
    services_offered?: string;
    vehicle_types: string[]; // ['باص', 'مينيباص']
    vehicle_count: number;
    vehicle_availability?: string;
    accounting_methods?: string;
    address?: string;
    email?: string;
    phone?: string;
    pricing_structure?: string;
    status: string;
    notes?: string;
    balance?: number;
    profile_picture_url?: string | null;
    average_rating?: number;
    total_ratings?: number;
}

const TravelCompaniesList = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const [items, setItems] = useState<TravelCompany[]>([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<TravelCompany[]>([]);
    const [records, setRecords] = useState<TravelCompany[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<TravelCompany[]>([]);

    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'name',
        direction: 'asc',
    });

    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch travel companies from database
    const fetchTravelCompanies = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.from('travel_companies').select('*').order('created_at', { ascending: false });

            if (error) throw error;

            // Fetch balances and ratings for all travel companies
            const companiesWithBalance = await Promise.all(
                (data || []).map(async (company) => {
                    const balanceData = await calculateServiceProviderBalance('travel_companies', company.id);

                    // Fetch ratings for this travel company
                    const { data: ratingsData } = await supabase.from('ratings').select('rating').eq('service_type', 'travel_companies').eq('service_id', company.id);

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
            setInitialRecords(companiesWithBalance);
        } catch (error) {
            console.error('Error fetching travel companies:', error);
            setAlert({
                message: t('error_loading_travel_companies') || 'Error loading travel companies',
                type: 'danger',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTravelCompanies();
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
        setInitialRecords(() => {
            return items.filter((item) => {
                return (
                    item.name.toLowerCase().includes(search.toLowerCase()) ||
                    item.code?.toLowerCase().includes(search.toLowerCase()) ||
                    item.email?.toLowerCase().includes(search.toLowerCase()) ||
                    item.phone?.toLowerCase().includes(search.toLowerCase())
                );
            });
        });
    }, [search, items]);

    useEffect(() => {
        const data = sortBy(initialRecords, sortStatus.columnAccessor);
        setInitialRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
        setPage(1);
    }, [sortStatus]);

    // Delete single travel company
    const handleDelete = async (id: string) => {
        try {
            setIsDeleting(true);

            // Get the user_id linked to this travel company
            const { data: companyData, error: fetchError } = await supabase.from('travel_companies').select('user_id').eq('id', id).single();

            if (fetchError) throw fetchError;

            // Delete from travel_companies table
            const { error } = await supabase.from('travel_companies').delete().eq('id', id);

            if (error) throw error;

            // Delete profile picture folder from storage
            await deleteServiceFolder('travel_companies', id);

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

            setAlert({
                message: t('travel_company_deleted_successfully') || 'Travel company deleted successfully',
                type: 'success',
            });

            // Refresh the list
            await fetchTravelCompanies();
        } catch (error) {
            console.error('Error deleting travel company:', error);
            setAlert({
                message: t('error_deleting_travel_company') || 'Error deleting travel company',
                type: 'danger',
            });
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
            setCompanyToDelete(null);
        }
    };

    // Bulk delete travel companies
    const handleBulkDelete = async () => {
        try {
            setIsDeleting(true);
            const idsToDelete = selectedRecords.map((record) => record.id);

            const { error } = await supabase.from('travel_companies').delete().in('id', idsToDelete);

            if (error) throw error;

            // Delete profile picture folders from storage for all deleted companies
            await Promise.all(idsToDelete.map((id) => deleteServiceFolder('travel_companies', id)));

            setAlert({
                message: t('travel_companies_deleted_successfully') || 'Travel companies deleted successfully',
                type: 'success',
            });

            // Clear selection and refresh the list
            setSelectedRecords([]);
            await fetchTravelCompanies();
        } catch (error) {
            console.error('Error deleting travel companies:', error);
            setAlert({
                message: t('error_deleting_travel_companies') || 'Error deleting travel companies',
                type: 'danger',
            });
        } finally {
            setIsDeleting(false);
            setShowBulkDeleteModal(false);
        }
    };

    return (
        <div>
            <div className="panel mt-6">
                <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <IconBuilding className="h-6 w-6 text-primary" />
                        <h5 className="text-lg font-semibold dark:text-white-light">{t('travel_companies_management')}</h5>
                    </div>
                    <Link href="/travel-companies/add" className="btn btn-primary gap-2">
                        <IconPlus />
                        {t('add_travel_company')}
                    </Link>
                </div>

                {alert && (
                    <div className="mb-4">
                        <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
                    </div>
                )}

                <div className="mb-4.5 flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div className="flex items-center gap-2 flex-1 max-w-[400px]">
                        <div className="relative w-full">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="text" className="form-input pl-10 pr-4" placeholder={t('search_travel_companies')} value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedRecords.length > 0 && (
                            <button type="button" className="btn btn-danger gap-2" onClick={() => setShowBulkDeleteModal(true)}>
                                <IconTrashLines />
                                {t('delete')} ({selectedRecords.length})
                            </button>
                        )}
                    </div>
                </div>

                <div className="datatables relative">
                    <DataTable
                        highlightOnHover
                        className="table-hover whitespace-nowrap rtl-table-headers"
                        records={records}
                        columns={[
                            {
                                accessor: 'profile_picture',
                                title: t('picture'),
                                render: ({ profile_picture_url, name }) => (
                                    <div className="flex items-center justify-center">
                                        <Image
                                            src={getServiceProfilePictureUrlWithFallback(profile_picture_url, 'travel_companies')}
                                            alt={name}
                                            width={40}
                                            height={40}
                                            className="rounded-full object-cover"
                                        />
                                    </div>
                                ),
                            },
                            {
                                accessor: 'name',
                                title: t('travel_company_name'),
                                sortable: true,
                                render: ({ name, code }) => (
                                    <div>
                                        <div className="font-semibold">{name}</div>
                                        {code && <div className="text-xs text-gray-500">{code}</div>}
                                    </div>
                                ),
                            },
                            {
                                accessor: 'vehicle_count',
                                title: t('vehicle_count'),
                                sortable: true,
                                render: ({ vehicle_count }) => <span className="font-semibold">{vehicle_count}</span>,
                            },
                            {
                                accessor: 'phone',
                                title: t('phone'),
                                render: ({ phone }) => <span dir="ltr">{phone || '-'}</span>,
                            },
                            {
                                accessor: 'email',
                                title: t('email'),
                                render: ({ email }) => <span dir="ltr">{email || '-'}</span>,
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
                                    <span className={`rounded px-2 py-1 text-xs font-semibold ${status === 'active' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>{t(status)}</span>
                                ),
                            },
                            {
                                accessor: 'actions',
                                title: t('actions'),
                                render: ({ id }) => (
                                    <div className="flex items-center gap-2">
                                        <Link href={`/travel-companies/preview/${id}`} title={t('preview')}>
                                            <IconEye />
                                        </Link>
                                        <Link href={`/travel-companies/edit/${id}`} title={t('edit')}>
                                            <IconEdit />
                                        </Link>
                                        <button
                                            type="button"
                                            title={t('delete')}
                                            onClick={() => {
                                                setCompanyToDelete(id);
                                                setShowDeleteModal(true);
                                            }}
                                        >
                                            <IconTrashLines />
                                        </button>
                                    </div>
                                ),
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
                        selectedRecords={selectedRecords}
                        onSelectedRecordsChange={setSelectedRecords}
                        minHeight={300}
                        paginationText={({ from, to, totalRecords }) => `${t('showing')} ${from} ${t('to')} ${to} ${t('of')} ${totalRecords} ${t('entries')}`}
                        noRecordsText={loading ? t('loading_travel_companies') : t('no_travel_companies_found')}
                    />

                    {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white dark:bg-black-dark-light bg-opacity-60 backdrop-blur-sm" />}
                </div>
            </div>

            {/* Delete confirmation modal */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onCancel={() => setShowDeleteModal(false)}
                onConfirm={() => companyToDelete && handleDelete(companyToDelete)}
                title={t('confirm_delete')}
                message={t('confirm_delete_travel_company')}
                confirmLabel={t('delete')}
                cancelLabel={t('cancel')}
            />

            {/* Bulk delete confirmation modal */}
            <ConfirmModal
                isOpen={showBulkDeleteModal}
                onCancel={() => setShowBulkDeleteModal(false)}
                onConfirm={handleBulkDelete}
                title={t('confirm_delete')}
                message={t('confirm_bulk_delete_travel_companies_message')}
                confirmLabel={t('delete')}
                cancelLabel={t('cancel')}
            />
        </div>
    );
};

export default TravelCompaniesList;
