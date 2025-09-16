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

interface EntertainmentCompany {
    id: string;
    created_at: string;
    updated_at: string;
    name: string;
    image?: string;
    description?: string;
    price?: number;
    status?: string;
}

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

                setItems(data || []);
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
            const { error } = await supabase.from('external_entertainment_companies').delete().eq('id', company.id);

            if (error) throw error;

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
            const { error } = await supabase.from('external_entertainment_companies').delete().in('id', ids);

            if (error) throw error;

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
                                            src={image}
                                            alt={name}
                                            className="w-12 h-12 object-cover rounded-lg"
                                            onError={(e) => {
                                                e.currentTarget.src = '/assets/images/placeholder.jpg';
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
                                    {price ? (
                                        <span className="badge badge-outline-success">
                                            {price.toLocaleString()} {t('currency')}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400">{t('not_specified')}</span>
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
