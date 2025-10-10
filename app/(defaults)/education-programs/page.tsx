'use client';
import IconEdit from '@/components/icon/icon-edit';
import IconEye from '@/components/icon/icon-eye';
import IconPlus from '@/components/icon/icon-plus';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconBook from '@/components/icon/icon-book';
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

interface EducationProgram {
    id: string;
    created_at: string;
    updated_at: string;
    name: string;
    image?: string;
    description?: string;
    price?: number;
    status?: string;
    balance?: number;
}

// Helper function to get proper image URL
const getImageUrl = (image: string | undefined): string => {
    if (!image) return '/assets/images/img-placeholder-fallback.webp';

    // If it's already a full URL (starts with http), return as is
    if (image.startsWith('http')) return image;

    // If it starts with /education-programs/, it's an old relative path
    if (image.startsWith('/education-programs/')) {
        const path = image.replace('/education-programs/', '');
        const {
            data: { publicUrl },
        } = supabase.storage.from('education-programs').getPublicUrl(path);
        return publicUrl;
    }

    // Otherwise assume it's a direct path in the bucket
    const {
        data: { publicUrl },
    } = supabase.storage.from('education-programs').getPublicUrl(image);
    return publicUrl;
};

const EducationProgramsList = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const [items, setItems] = useState<EducationProgram[]>([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<EducationProgram[]>([]);
    const [records, setRecords] = useState<EducationProgram[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<EducationProgram[]>([]);

    const [search, setSearch] = useState('');

    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'created_at',
        direction: 'desc',
    });

    // Modal and alert states
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [programToDelete, setProgramToDelete] = useState<EducationProgram | null>(null);
    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({
        visible: false,
        message: '',
        type: 'success',
    });

    useEffect(() => {
        const fetchEducationPrograms = async () => {
            try {
                const { data, error } = await supabase.from('education_programs').select('*').order('created_at', { ascending: false });

                if (error) throw error;

                // Fetch balances for all education programs
                const programsWithBalance = await Promise.all(
                    (data || []).map(async (program) => {
                        const balanceData = await calculateServiceProviderBalance('education_programs', program.id);
                        return {
                            ...program,
                            balance: balanceData?.netBalance || 0,
                        };
                    }),
                );

                setItems(programsWithBalance);
            } catch (error) {
                console.error('Error fetching education programs:', error);
                setAlert({ visible: true, message: t('error_loading_education_programs') || 'Error loading education programs', type: 'danger' });
            } finally {
                setLoading(false);
            }
        };
        fetchEducationPrograms();
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

    const deleteEducationProgram = async (program: EducationProgram) => {
        try {
            // Get the user_id linked to this education program
            const { data: programData, error: fetchError } = await supabase.from('education_programs').select('user_id').eq('id', program.id).single();

            if (fetchError) throw fetchError;

            // Delete the education program record from database
            const { error } = await supabase.from('education_programs').delete().eq('id', program.id);

            if (error) throw error;

            // Delete the associated folder from storage if it exists
            await deleteFolderRecursively('education-programs', program.id);

            // If there's a linked user account, delete it from public.users and auth.users
            if (programData?.user_id) {
                // Get the auth_user_id from public.users
                const { data: userData, error: userFetchError } = await supabase.from('users').select('auth_user_id').eq('id', programData.user_id).single();

                if (!userFetchError && userData?.auth_user_id) {
                    // Delete from public.users
                    await supabase.from('users').delete().eq('id', programData.user_id);

                    // Delete from auth.users using admin API
                    await supabase.auth.admin.deleteUser(userData.auth_user_id);
                }
            }

            setItems((prevItems) => prevItems.filter((item) => item.id !== program.id));
            setAlert({ visible: true, message: t('education_program_deleted_successfully') || 'Education program deleted successfully', type: 'success' });
        } catch (error) {
            console.error('Error deleting education program:', error);
            setAlert({ visible: true, message: t('error_deleting_education_program') || 'Error deleting education program', type: 'danger' });
        }
    };

    const bulkDelete = async () => {
        try {
            const ids = selectedRecords.map((record) => record.id);

            // First delete the education program records from database
            const { error } = await supabase.from('education_programs').delete().in('id', ids);

            if (error) throw error;

            // Then attempt to delete storage folders for each education program recursively
            const results = await Promise.allSettled(ids.map((id) => deleteFolderRecursively('education-programs', id)));
            const failed = results
                .map((r, i) => ({ r, id: ids[i] }))
                .filter((x) => x.r.status === 'rejected' || (x.r.status === 'fulfilled' && x.r.value === false))
                .map((x) => x.id);
            if (failed.length > 0) {
                console.warn('Failed to delete some storage folders:', failed);
            }

            setItems((prevItems) => prevItems.filter((item) => !ids.includes(item.id)));
            setSelectedRecords([]);
            setAlert({ visible: true, message: t('education_programs_deleted_successfully') || 'Education programs deleted successfully', type: 'success' });
        } catch (error) {
            console.error('Error bulk deleting education programs:', error);
            setAlert({ visible: true, message: t('error_deleting_education_programs') || 'Error deleting education programs', type: 'danger' });
        }
    };

    const confirmDelete = (program: EducationProgram) => {
        setProgramToDelete(program);
        setShowConfirmModal(true);
    };

    const confirmBulkDelete = () => {
        setShowBulkDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (programToDelete) {
            await deleteEducationProgram(programToDelete);
            setProgramToDelete(null);
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
                    <IconBook className="h-6 w-6 text-primary" />
                    <h2 className="text-xl font-bold dark:text-white">{t('education_programs_management') || 'Education Programs Management'}</h2>
                </div>
            </div>

            {/* Search and Actions */}
            <div className="mb-4.5 flex flex-col gap-4 px-5 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 items-center">
                    <div className="relative flex-1 max-w-[400px]">
                        <input
                            type="text"
                            className="form-input ltr:pl-9 rtl:pr-9"
                            placeholder={t('search_education_programs') || 'Search education programs...'}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <IconSearch className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 ltr:left-3 rtl:right-3" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {selectedRecords.length > 0 && (
                        <button type="button" className="btn btn-danger gap-2" onClick={confirmBulkDelete}>
                            <IconTrashLines />
                            {t('delete_selected') || 'Delete Selected'} ({selectedRecords.length})
                        </button>
                    )}
                    <Link href="/education-programs/add" className="btn btn-primary gap-2">
                        <IconPlus />
                        {t('add_education_program') || 'Add Education Program'}
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
                            title: t('image') || 'Image',
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
                            title: t('program_name') || 'Program Name',
                            sortable: true,
                            render: ({ name }) => <div className="font-semibold">{name}</div>,
                        },
                        {
                            accessor: 'description',
                            title: t('description') || 'Description',
                            render: ({ description }) => (
                                <div className="text-sm max-w-xs">
                                    {description ? <span className="line-clamp-2">{description}</span> : <span className="text-gray-400">{t('not_specified') || 'Not specified'}</span>}
                                </div>
                            ),
                        },
                        {
                            accessor: 'price',
                            title: t('price') || 'Price',
                            sortable: true,
                            render: ({ price }) => (
                                <div className="text-sm">
                                    {price ? (
                                        <span className="badge badge-outline-success">{price.toLocaleString()} ₪</span>
                                    ) : (
                                        <span className="text-gray-400">{t('not_specified') || 'Not specified'}</span>
                                    )}
                                </div>
                            ),
                        },
                        {
                            accessor: 'balance',
                            title: t('balance') || 'Balance',
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
                            title: t('status') || 'Status',
                            sortable: true,
                            render: ({ status }) => (
                                <span className={`badge ${status === 'active' ? 'badge-outline-success' : 'badge-outline-danger'}`}>
                                    {status === 'active' ? t('active') || 'Active' : t('inactive') || 'Inactive'}
                                </span>
                            ),
                        },
                        {
                            accessor: 'created_at',
                            title: t('created_at') || 'Created At',
                            sortable: true,
                            render: ({ created_at }) => new Date(created_at).toLocaleDateString('tr-TR'),
                        },
                        {
                            accessor: 'actions',
                            title: t('actions') || 'Actions',
                            titleClassName: '!text-center',
                            render: (program) => (
                                <div className="flex items-center justify-center gap-2">
                                    <Link href={`/education-programs/preview/${program.id}`} className="hover:text-info">
                                        <IconEye />
                                    </Link>
                                    <Link href={`/education-programs/edit/${program.id}`} className="hover:text-primary">
                                        <IconEdit />
                                    </Link>
                                    <button type="button" className="hover:text-danger" onClick={() => confirmDelete(program)}>
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
                    paginationText={({ from, to, totalRecords }) => `${t('showing') || 'Showing'} ${from} ${t('to') || 'to'} ${to} ${t('of') || 'of'} ${totalRecords} ${t('entries') || 'entries'}`}
                    noRecordsText={t('no_education_programs_found') || 'No education programs found'}
                    loadingText={t('loading') || 'Loading...'}
                    minHeight={300}
                />

                {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white dark:bg-black-dark-light bg-opacity-60 backdrop-blur-sm" />}
            </div>

            {/* Alerts */}
            {alert.visible && (
                <div className="fixed top-4 right-4 z-50 min-w-80 max-w-md">
                    <Alert
                        type={alert.type}
                        title={alert.type === 'success' ? t('success') || 'Success' : t('error') || 'Error'}
                        message={alert.message}
                        onClose={() => setAlert({ ...alert, visible: false })}
                    />
                </div>
            )}

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={showConfirmModal}
                title={t('confirm_delete') || 'Confirm Delete'}
                message={t('confirm_delete_education_program_message') || 'Are you sure you want to delete this education program? This action cannot be undone.'}
                onConfirm={handleDeleteConfirm}
                onCancel={() => {
                    setShowConfirmModal(false);
                    setProgramToDelete(null);
                }}
                confirmLabel={t('delete') || 'Delete'}
                cancelLabel={t('cancel') || 'Cancel'}
            />

            {/* Bulk Delete Modal */}
            <ConfirmModal
                isOpen={showBulkDeleteModal}
                title={t('confirm_bulk_delete') || 'Confirm Bulk Delete'}
                message={`${t('confirm_bulk_delete_education_programs_message') || 'Are you sure you want to delete the selected education programs?'} (${selectedRecords.length})`}
                onConfirm={handleBulkDeleteConfirm}
                onCancel={() => setShowBulkDeleteModal(false)}
                confirmLabel={t('delete_all') || 'Delete All'}
                cancelLabel={t('cancel') || 'Cancel'}
            />
        </div>
    );
};

export default EducationProgramsList;
