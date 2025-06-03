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

interface Car {
    id: string;
    created_at: string;
    title: string;
    year: number;
    status: string;
    market_price: number;
    value_price: number;
    sale_price: number;
    kilometers: number;
    provider: string;
    brand: string;
    images: string[];
}

const CarsList = () => {
    const { t } = getTranslation();
    const [items, setItems] = useState<Car[]>([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<Car[]>([]);
    const [records, setRecords] = useState<Car[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<Car[]>([]);

    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'title',
        direction: 'asc',
    });

    // Modal and alert states
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [carToDelete, setCarToDelete] = useState<Car | null>(null);
    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({
        visible: false,
        message: '',
        type: 'success',
    });

    useEffect(() => {
        const fetchCars = async () => {
            try {
                const { data, error } = await supabase.from('cars').select('*').order('created_at', { ascending: false });
                if (error) throw error;

                setItems(data as Car[]);
            } catch (error) {
                console.error('Error fetching cars:', error);
                setAlert({ visible: true, message: t('error_loading_data'), type: 'danger' });
            } finally {
                setLoading(false);
            }
        };
        fetchCars();
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
                    item.brand.toLowerCase().includes(search.toLowerCase()) ||
                    item.status.toLowerCase().includes(search.toLowerCase()) ||
                    item.provider.toLowerCase().includes(search.toLowerCase()) ||
                    item.year.toString().includes(search.toLowerCase())
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
            const car = items.find((c) => c.id === id);
            if (car) {
                setCarToDelete(car);
                setShowConfirmModal(true);
            }
        }
    };

    const confirmDeletion = async () => {
        if (!carToDelete) return;
        try {
            // Delete images from storage first
            if (carToDelete.images?.length) {
                const folderPath = `${carToDelete.title.replace(/[^a-zA-Z0-9]/g, '_')}`;
                await supabase.storage.from('cars').remove([folderPath]);
            }

            // Delete car record
            const { error } = await supabase.from('cars').delete().eq('id', carToDelete.id);
            if (error) throw error;

            const updatedItems = items.filter((c) => c.id !== carToDelete.id);
            setItems(updatedItems);
            setAlert({ visible: true, message: t('car_deleted_successfully'), type: 'success' });
        } catch (error) {
            console.error('Deletion error:', error);
            setAlert({ visible: true, message: t('error_deleting_car'), type: 'danger' });
        } finally {
            setShowConfirmModal(false);
            setCarToDelete(null);
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

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('en-US').format(value);
    };

    return (
        <div className="panel border-white-light px-0 dark:border-[#1b2e4b]">
            {alert.visible && (
                <div className="mb-4 ml-4 max-w-96">
                    <Alert
                        type={alert.type}
                        title={alert.type === 'success' ? t('success') : t('error')}
                        message={alert.message}
                        onClose={() => setAlert({ visible: false, message: '', type: 'success' })}
                    />
                </div>
            )}
            <div className="invoice-table">
                <div className="mb-4.5 flex flex-col gap-5 px-5 md:flex-row md:items-center">
                    <div className="flex items-center gap-2">
                        <button type="button" className="btn btn-danger gap-2" disabled={selectedRecords.length === 0}>
                            <IconTrashLines />
                            {t('delete')}
                        </button>
                        <Link href="/cars/add" className="btn btn-primary gap-2">
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
                                accessor: 'title',
                                title: t('car_title'),
                                sortable: true,
                                render: ({ title, images }) => {
                                    let imageList = [];
                                    imageList = typeof images === 'string' ? JSON.parse(images || '[]') : images || [];

                                    return (
                                        <div className="flex items-center font-semibold">
                                            <div className="w-max rounded-full ltr:mr-2 rtl:ml-2">
                                                <img className="h-8 w-8 rounded-md object-cover" src={imageList[0] || `/assets/images/product-placeholder.jpg`} alt={title} />
                                            </div>
                                            <div>{title}</div>
                                        </div>
                                    );
                                },
                            },
                            {
                                accessor: 'brand',
                                title: t('brand'),
                                sortable: true,
                            },
                            {
                                accessor: 'year',
                                title: t('year'),
                                sortable: true,
                            },
                            {
                                accessor: 'status',
                                title: t('car_status'),
                                sortable: true,
                                render: ({ status }) => (
                                    <span
                                        className={`badge ${
                                            status === 'new'
                                                ? 'badge-outline-success'
                                                : status === 'excellent'
                                                  ? 'badge-outline-primary'
                                                  : status === 'good'
                                                    ? 'badge-outline-info'
                                                    : status === 'fair'
                                                      ? 'badge-outline-warning'
                                                      : 'badge-outline-danger'
                                        }`}
                                    >
                                        {t(status)}
                                    </span>
                                ),
                            },
                            {
                                accessor: 'kilometers',
                                title: t('kilometers'),
                                sortable: true,
                                render: ({ kilometers }) => (
                                    <span>
                                        {formatNumber(kilometers)} {t('km')}
                                    </span>
                                ),
                            },
                            {
                                accessor: 'market_price',
                                title: t('market_price'),
                                sortable: true,
                                render: ({ market_price }) => <span>{formatCurrency(market_price)}</span>,
                            },
                            {
                                accessor: 'value_price',
                                title: t('value_price'),
                                sortable: true,
                                render: ({ value_price }) => <span>{formatCurrency(value_price)}</span>,
                            },
                            {
                                accessor: 'provider',
                                title: t('provider'),
                                sortable: true,
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
                                        <Link href={`/cars/edit/${id}`} className="flex hover:text-info">
                                            <IconEdit className="h-4.5 w-4.5" />
                                        </Link>
                                        <Link href={`/cars/preview/${id}`} className="flex hover:text-primary">
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
            </div>

            <ConfirmModal
                isOpen={showConfirmModal}
                title={t('confirm_deletion')}
                message={t('confirm_delete_car')}
                onCancel={() => {
                    setShowConfirmModal(false);
                    setCarToDelete(null);
                }}
                onConfirm={confirmDeletion}
                confirmLabel={t('delete')}
                cancelLabel={t('cancel')}
                size="sm"
            />
        </div>
    );
};

export default CarsList;
