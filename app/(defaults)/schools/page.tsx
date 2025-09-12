'use client';
import IconEdit from '@/components/icon/icon-edit';
import IconEye from '@/components/icon/icon-eye';
import IconPlus from '@/components/icon/icon-plus';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconBuilding from '@/components/icon/icon-building';
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

interface School {
    id: string;
    created_at: string;
    updated_at: string;
    name: string;
    code: string;
    type: string; // مجلس / كلية / مدرسة / روضه
    director_name?: string;
    address?: string;
    email?: string;
    phone?: string;
    staff_count: number;
    student_count: number;
    class_count: number;
    status: string;
    notes?: string;
}

const SchoolsList = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const [items, setItems] = useState<School[]>([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<School[]>([]);
    const [records, setRecords] = useState<School[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<School[]>([]);

    const [search, setSearch] = useState('');

    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'created_at',
        direction: 'desc',
    });

    // Modal and alert states
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);
    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({
        visible: false,
        message: '',
        type: 'success',
    });

    useEffect(() => {
        const fetchSchools = async () => {
            try {
                const { data, error } = await supabase.from('schools').select('*').order('created_at', { ascending: false });

                if (error) throw error;

                setItems(data as School[]);
            } catch (error) {
                console.error('Error fetching schools:', error);
                setAlert({ visible: true, message: t('error_loading_data'), type: 'danger' });
            } finally {
                setLoading(false);
            }
        };
        fetchSchools();
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
                    item.code?.toLowerCase().includes(searchTerm) ||
                    item.type.toLowerCase().includes(searchTerm) ||
                    item.director_name?.toLowerCase().includes(searchTerm) ||
                    item.address?.toLowerCase().includes(searchTerm) ||
                    item.email?.toLowerCase().includes(searchTerm) ||
                    item.phone?.toLowerCase().includes(searchTerm);

                return matchesSearch;
            }),
        );
    }, [items, search]);

    useEffect(() => {
        const data2 = sortBy(initialRecords, sortStatus.columnAccessor);
        setInitialRecords(sortStatus.direction === 'desc' ? data2.reverse() : data2);
        setPage(1);
    }, [sortStatus]);

    const deleteSchool = async (school: School) => {
        try {
            const { error } = await supabase.from('schools').delete().eq('id', school.id);

            if (error) throw error;

            setItems((prevItems) => prevItems.filter((item) => item.id !== school.id));
            setAlert({ visible: true, message: t('school_deleted_successfully'), type: 'success' });
        } catch (error) {
            console.error('Error deleting school:', error);
            setAlert({ visible: true, message: t('error_deleting_school'), type: 'danger' });
        }
    };

    const bulkDelete = async () => {
        try {
            const ids = selectedRecords.map((record) => record.id);
            const { error } = await supabase.from('schools').delete().in('id', ids);

            if (error) throw error;

            setItems((prevItems) => prevItems.filter((item) => !ids.includes(item.id)));
            setSelectedRecords([]);
            setAlert({ visible: true, message: t('schools_deleted_successfully'), type: 'success' });
        } catch (error) {
            console.error('Error bulk deleting schools:', error);
            setAlert({ visible: true, message: t('error_deleting_schools'), type: 'danger' });
        }
    };

    const confirmDelete = (school: School) => {
        setSchoolToDelete(school);
        setShowConfirmModal(true);
    };

    const confirmBulkDelete = () => {
        setShowBulkDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (schoolToDelete) {
            await deleteSchool(schoolToDelete);
            setSchoolToDelete(null);
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
                    <IconBuilding className="h-6 w-6 text-primary" />
                    <h2 className="text-xl font-bold dark:text-white">{t('schools_management')}</h2>
                </div>
            </div>

            {/* Search and Actions */}
            <div className="mb-4.5 flex flex-col gap-4 px-5 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 items-center">
                    <div className="relative flex-1 max-w-[400px]">
                        <input type="text" className="form-input ltr:pl-9 rtl:pr-9" placeholder={t('search')} value={search} onChange={(e) => setSearch(e.target.value)} />
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
                    <Link href="/schools/add" className="btn btn-primary gap-2">
                        <IconPlus />
                        {t('add_school')}
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
                            accessor: 'code',
                            title: t('code'),
                            sortable: true,
                            render: ({ code, name }) => (
                                <div>
                                    <div className="font-semibold">{code || t('no_code')}</div>
                                    <div className="text-xs text-gray-500">{name}</div>
                                </div>
                            ),
                        },
                        {
                            accessor: 'type',
                            title: t('institution_type'),
                            sortable: true,
                            render: ({ type }) => (
                                <span
                                    className={`badge ${
                                        type === 'مجلس' ? 'badge-outline-primary' : type === 'كلية' ? 'badge-outline-success' : type === 'مدرسة' ? 'badge-outline-info' : 'badge-outline-warning'
                                    }`}
                                >
                                    {type}
                                </span>
                            ),
                        },
                        {
                            accessor: 'director_name',
                            title: t('director'),
                            sortable: true,
                            render: ({ director_name }) => director_name || t('not_specified'),
                        },
                        {
                            accessor: 'contact',
                            title: t('contact'),
                            render: ({ phone, email }) => (
                                <div>
                                    {phone && <div className="text-sm">{phone}</div>}
                                    {email && <div className="text-xs text-gray-500">{email}</div>}
                                </div>
                            ),
                        },
                        {
                            accessor: 'stats',
                            title: t('statistics'),
                            render: ({ staff_count, student_count, class_count }) => (
                                <div className="text-sm">
                                    <div>
                                        {t('staff')}: {<span className='text-blue-500 font-semibold'>{staff_count}</span>}
                                    </div>
                                    <div>
                                        {t('students')}: {<span className='text-blue-500 font-semibold'>{student_count}</span>}
                                    </div>
                                    <div>
                                        {t('classes')}: {<span className='text-blue-500 font-semibold'>{class_count}</span>}
                                    </div>
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
                            render: (school) => (
                                <div className="flex items-center justify-center gap-2">
                                    <Link href={`/schools/preview/${school.id}`} className="hover:text-info">
                                        <IconEye />
                                    </Link>
                                    <Link href={`/schools/edit/${school.id}`} className="hover:text-primary">
                                        <IconEdit />
                                    </Link>
                                    <button type="button" className="hover:text-danger" onClick={() => confirmDelete(school)}>
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
                    noRecordsText={t('no_schools_found')}
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
                message={t('confirm_delete_school_message')}
                onConfirm={handleDeleteConfirm}
                onCancel={() => {
                    setShowConfirmModal(false);
                    setSchoolToDelete(null);
                }}
                confirmLabel={t('delete')}
                cancelLabel={t('cancel')}
            />

            {/* Bulk Delete Modal */}
            <ConfirmModal
                isOpen={showBulkDeleteModal}
                title={t('confirm_bulk_delete')}
                message={`${t('confirm_bulk_delete_schools_message')} (${selectedRecords.length})`}
                onConfirm={handleBulkDeleteConfirm}
                onCancel={() => setShowBulkDeleteModal(false)}
                confirmLabel={t('delete_all')}
                cancelLabel={t('cancel')}
            />
        </div>
    );
};

export default SchoolsList;
