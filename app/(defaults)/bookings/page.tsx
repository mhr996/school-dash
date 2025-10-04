'use client';
import IconEdit from '@/components/icon/icon-edit';
import IconEye from '@/components/icon/icon-eye';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconCalendar from '@/components/icon/icon-calendar';
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

interface Booking {
    id: string;
    booking_reference: string;
    customer_id: string;
    customer: {
        full_name: string;
        email: string;
        phone: string | null;
    } | null;
    destination_id: string;
    destination: {
        name: string;
        address: string;
    };
    trip_date: string;
    total_amount: number;
    payment_status: string;
    payment_method: string;
    status: string;
    created_at: string;
    services: Array<{
        type: string;
        name: string;
        quantity: number;
        cost: number;
        days?: number;
        hours?: number;
    }>;
}

const BookingsList = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const [items, setItems] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<Booking[]>([]);
    const [records, setRecords] = useState<Booking[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<Booking[]>([]);

    const [search, setSearch] = useState('');

    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'created_at',
        direction: 'desc',
    });

    // Modal and alert states
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
    const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'success' | 'danger' }>({
        visible: false,
        message: '',
        type: 'success',
    });

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const { data, error } = await supabase
                    .from('bookings')
                    .select(
                        `
                        *,
                        customer:users!customer_id(full_name, email, phone),
                        destination:destinations(name, address)
                    `,
                    )
                    .order('created_at', { ascending: false });

                if (error) throw error;

                setItems(data as Booking[]);
            } catch (error) {
                console.error('Error fetching bookings:', error);
                setAlert({ visible: true, message: t('error_loading_data'), type: 'danger' });
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
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
                    item.booking_reference.toLowerCase().includes(searchTerm) ||
                    item.customer?.full_name?.toLowerCase().includes(searchTerm) ||
                    item.customer?.email?.toLowerCase().includes(searchTerm) ||
                    item.destination?.name.toLowerCase().includes(searchTerm);

                return matchesSearch;
            }),
        );
    }, [items, search]);

    useEffect(() => {
        const data2 = sortBy(initialRecords, sortStatus.columnAccessor);
        setInitialRecords(sortStatus.direction === 'desc' ? data2.reverse() : data2);
        setPage(1);
    }, [sortStatus]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'confirmed':
                return 'badge-outline-success';
            case 'cancelled':
                return 'badge-outline-danger';
            case 'completed':
                return 'badge-outline-info';
            case 'pending':
            default:
                return 'badge-outline-warning';
        }
    };

    const getPaymentStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return 'badge-outline-success';
            case 'failed':
                return 'badge-outline-danger';
            case 'pending':
            default:
                return 'badge-outline-warning';
        }
    };

    const formatCurrency = (amount: number) => {
        return `${amount.toFixed(2)} ₪`;
    };

    const deleteBooking = async (booking: Booking) => {
        try {
            // Delete related booking services first (if any)
            const { error: servicesError } = await supabase.from('booking_services').delete().eq('booking_id', booking.id);

            if (servicesError) throw servicesError;

            // Delete booking
            const { error } = await supabase.from('bookings').delete().eq('id', booking.id);

            if (error) throw error;

            setItems((prevItems) => prevItems.filter((item) => item.id !== booking.id));
            setAlert({ visible: true, message: t('booking_deleted_successfully'), type: 'success' });
        } catch (error) {
            console.error('Error deleting booking:', error);
            setAlert({ visible: true, message: t('error_deleting_booking'), type: 'danger' });
        }
    };

    const bulkDelete = async () => {
        try {
            const ids = selectedRecords.map((record) => record.id);

            // Delete related booking services first (if any)
            const { error: servicesError } = await supabase.from('booking_services').delete().in('booking_id', ids);

            if (servicesError) throw servicesError;

            // Delete bookings
            const { error } = await supabase.from('bookings').delete().in('id', ids);

            if (error) throw error;

            setItems((prevItems) => prevItems.filter((item) => !ids.includes(item.id)));
            setSelectedRecords([]);
            setAlert({ visible: true, message: t('bookings_deleted_successfully'), type: 'success' });
        } catch (error) {
            console.error('Error bulk deleting bookings:', error);
            setAlert({ visible: true, message: t('error_deleting_bookings'), type: 'danger' });
        }
    };

    const confirmDelete = (booking: Booking) => {
        setBookingToDelete(booking);
        setShowConfirmModal(true);
    };

    const confirmBulkDelete = () => {
        setShowBulkDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (bookingToDelete) {
            await deleteBooking(bookingToDelete);
            setBookingToDelete(null);
        }
        setShowConfirmModal(false);
    };

    const handleBulkDeleteConfirm = async () => {
        await bulkDelete();
        setShowBulkDeleteModal(false);
    };

    return (
        <div className="panel border-white-light px-0 dark:border-[#1b2e4b]">
            <h5 className="mb-5 px-5 text-lg font-semibold dark:text-white-light">{t('bookings')}</h5>

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
                </div>
            </div>

            {/* Table */}
            <div className="datatables pagination-padding relative">
                <DataTable
                    className={`${loading ? 'filter blur-sm pointer-events-none' : 'table-hover whitespace-nowrap'} rtl-table-headers`}
                    records={records}
                    columns={[
                        {
                            accessor: 'booking_reference',
                            title: t('booking_reference'),
                            sortable: true,
                            render: ({ booking_reference, customer }) => (
                                <div>
                                    <div className="font-semibold">{booking_reference}</div>
                                    <div className="text-xs text-gray-500">{customer?.full_name || t('no_name')}</div>
                                </div>
                            ),
                        },
                        {
                            accessor: 'destination',
                            title: t('destination'),
                            sortable: true,
                            render: ({ destination }) => (
                                <div>
                                    <div className="font-semibold">{destination?.name || t('unknown_destination')}</div>
                                    <div className="text-xs text-gray-500">{destination?.address}</div>
                                </div>
                            ),
                        },
                        {
                            accessor: 'trip_date',
                            title: t('trip_date'),
                            sortable: true,
                            render: ({ trip_date }) => new Date(trip_date).toLocaleDateString('tr-TR'),
                        },
                        {
                            accessor: 'total_amount',
                            title: t('total_amount'),
                            sortable: true,
                            render: ({ total_amount }) => <span className="font-semibold text-success">{formatCurrency(total_amount)}</span>,
                        },
                        {
                            accessor: 'status',
                            title: t('status'),
                            sortable: true,
                            render: ({ status }) => (
                                <span className={`badge ${getStatusBadge(status)}`}>
                                    {status === 'confirmed' ? t('confirmed') : status === 'cancelled' ? t('cancelled') : status === 'completed' ? t('completed') : t('pending')}
                                </span>
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
                            render: (booking) => (
                                <div className="flex items-center justify-center gap-2">
                                    <Link href={`/bookings/${booking.id}`} className="hover:text-info">
                                        <IconEye />
                                    </Link>
                                    <Link href={`/bookings/edit/${booking.id}`} className="hover:text-success">
                                        <IconEdit />
                                    </Link>
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
                    noRecordsText={t('no_bookings_found')}
                    loadingText={t('loading')}
                    minHeight={300}
                />

                {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white dark:bg-black-dark-light bg-opacity-60 backdrop-blur-sm" />}
            </div>

            <ConfirmModal
                isOpen={showConfirmModal}
                title={t('confirm_delete')}
                message={t('confirm_delete_booking_message')}
                onConfirm={handleDeleteConfirm}
                onCancel={() => {
                    setShowConfirmModal(false);
                    setBookingToDelete(null);
                }}
                confirmLabel={t('delete')}
                cancelLabel={t('cancel')}
            />

            {/* Bulk Delete Modal */}
            <ConfirmModal
                isOpen={showBulkDeleteModal}
                title={t('confirm_bulk_delete')}
                message={`${t('confirm_bulk_delete_bookings_message')} (${selectedRecords.length})`}
                onConfirm={handleBulkDeleteConfirm}
                onCancel={() => setShowBulkDeleteModal(false)}
                confirmLabel={t('delete_all')}
                cancelLabel={t('cancel')}
            />

            {/* Alerts */}
            {alert.visible && (
                <div className="fixed top-4 right-4 z-50 min-w-80 max-w-md">
                    <Alert type={alert.type} title={alert.type === 'success' ? t('success') : t('error')} message={alert.message} onClose={() => setAlert({ ...alert, visible: false })} />
                </div>
            )}
        </div>
    );
};

export default BookingsList;
