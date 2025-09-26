'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUserWithRole } from '@/lib/auth';
import { getTranslation } from '@/i18n';
import AccountPendingPage from '@/components/auth/account-pending';
import supabase from '@/lib/supabase';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { sortBy } from 'lodash';

// Icons
import IconEye from '@/components/icon/icon-eye';
import IconCalendar from '@/components/icon/icon-calendar';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconDollarSign from '@/components/icon/icon-dollar-sign';
import IconUser from '@/components/icon/icon-user';
import IconBuilding from '@/components/icon/icon-building';
import IconOpenBook from '@/components/icon/icon-open-book';
import IconHeart from '@/components/icon/icon-heart';
import IconLock from '@/components/icon/icon-lock';
import IconCar from '@/components/icon/icon-car';
import IconStar from '@/components/icon/icon-star';

interface User {
    id: string;
    full_name: string;
    email: string;
    is_active: boolean;
    user_roles?: {
        name: string;
        description: string;
    };
}

interface ServiceProviderData {
    id: string;
    name: string;
    [key: string]: any;
}

interface BookingData {
    id: string;
    booking_id: string;
    service_type: string;
    service_id: string;
    quantity: number;
    days: number;
    booked_price: number;
    rate_type: string;
    created_at: string;
    bookings: {
        id: string;
        booking_reference: string;
        customer_name: string;
        customer_email: string;
        customer_phone: string;
        trip_date: string;
        total_amount: number;
        payment_status: string;
        status: string;
        notes: string;
        special_requests: string;
    };
}

const ServiceProviderBookings = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [serviceData, setServiceData] = useState<ServiceProviderData | null>(null);
    const [bookings, setBookings] = useState<BookingData[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'created_at',
        direction: 'desc',
    });
    const [records, setRecords] = useState<BookingData[]>([]);
    const [initialRecords, setInitialRecords] = useState<BookingData[]>([]);

    const PAGE_SIZES = [10, 20, 30, 50, 100];

    useEffect(() => {
        const initializeBookings = async () => {
            try {
                const { user: userData, error } = await getCurrentUserWithRole();

                if (error || !userData) {
                    router.push('/auth/signin');
                    return;
                }

                setUser(userData);

                // Check if user is active
                if (!userData.is_active) {
                    setLoading(false);
                    return;
                }

                // Fetch service provider data and bookings
                await fetchServiceProviderData(userData);
            } catch (error) {
                console.error('Error initializing bookings:', error);
                router.push('/auth/signin');
            } finally {
                setLoading(false);
            }
        };

        initializeBookings();
    }, [router]);

    const fetchServiceProviderData = async (userData: User) => {
        const roleName = userData.user_roles?.name;
        let tableName = '';

        switch (roleName) {
            case 'guide':
                tableName = 'guides';
                break;
            case 'paramedic':
                tableName = 'paramedics';
                break;
            case 'security_company':
                tableName = 'security_companies';
                break;
            case 'travel_company':
                tableName = 'travel_companies';
                break;
            case 'entertainment_company':
                tableName = 'external_entertainment_companies';
                break;
            default:
                return;
        }

        try {
            const { data, error } = await supabase.from(tableName).select('*').eq('user_id', userData.id).single();

            if (!error && data) {
                setServiceData(data);
                await fetchBookings(userData, data);
            }
        } catch (error) {
            console.error(`Error fetching ${tableName} data:`, error);
        }
    };

    const fetchBookings = async (userData: User, serviceProviderData: ServiceProviderData) => {
        const roleName = userData.user_roles?.name;
        let serviceType = '';

        switch (roleName) {
            case 'guide':
                serviceType = 'guides';
                break;
            case 'paramedic':
                serviceType = 'paramedics';
                break;
            case 'security_company':
                serviceType = 'security_companies';
                break;
            case 'entertainment_company':
                serviceType = 'external_entertainment_companies';
                break;
            case 'travel_company':
                // Travel companies don't appear in booking_services, they're in bookings directly
                await fetchTravelCompanyBookings(serviceProviderData);
                return;
            default:
                return;
        }

        try {
            const { data: bookingServices, error } = await supabase
                .from('booking_services')
                .select(
                    `
                    *,
                    bookings!inner(*)
                `,
                )
                .eq('service_type', serviceType)
                .eq('service_id', serviceProviderData.id)
                .order('created_at', { ascending: false });

            if (!error && bookingServices) {
                setBookings(bookingServices);
                setInitialRecords(bookingServices);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
    };

    const fetchTravelCompanyBookings = async (serviceProviderData: ServiceProviderData) => {
        try {
            // For travel companies, we need to check trip_plans table
            const { data: tripPlans, error } = await supabase
                .from('trip_plans')
                .select(
                    `
                    *,
                    bookings(*)
                `,
                )
                .eq('travel_company_id', serviceProviderData.id);

            if (!error && tripPlans) {
                // Transform the data to match the BookingData interface
                const transformedBookings = tripPlans
                    .filter((tp) => tp.bookings && tp.bookings.length > 0)
                    .flatMap((tp) =>
                        tp.bookings.map((booking: any) => ({
                            id: `${tp.id}-${booking.id}`,
                            booking_id: booking.id,
                            service_type: 'travel_companies',
                            service_id: serviceProviderData.id,
                            quantity: 1,
                            days: 1,
                            booked_price: tp.travel_price || 0,
                            rate_type: 'fixed',
                            created_at: booking.created_at,
                            bookings: booking,
                        })),
                    );

                setBookings(transformedBookings);
                setInitialRecords(transformedBookings);
            }
        } catch (error) {
            console.error('Error fetching travel company bookings:', error);
        }
    };

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecords([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords]);

    useEffect(() => {
        const data = sortBy(initialRecords, sortStatus.columnAccessor);
        setInitialRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
        setPage(1);
    }, [sortStatus]);

    const getServiceIcon = () => {
        const roleName = user?.user_roles?.name;
        switch (roleName) {
            case 'guide':
                return <IconOpenBook className="w-6 h-6" />;
            case 'paramedic':
                return <IconHeart className="w-6 h-6" />;
            case 'security_company':
                return <IconLock className="w-6 h-6" />;
            case 'travel_company':
                return <IconCar className="w-6 h-6" />;
            case 'entertainment_company':
                return <IconStar className="w-6 h-6" />;
            default:
                return <IconUser className="w-6 h-6" />;
        }
    };

    const getServiceTitle = () => {
        const roleName = user?.user_roles?.name;
        switch (roleName) {
            case 'guide':
                return 'Guide Bookings';
            case 'paramedic':
                return 'Paramedic Bookings';
            case 'security_company':
                return 'Security Services Bookings';
            case 'travel_company':
                return 'Travel Services Bookings';
            case 'entertainment_company':
                return 'Entertainment Bookings';
            default:
                return 'My Bookings';
        }
    };

    const getStatusBadge = (status: string) => {
        const statusClasses = {
            pending: 'badge-outline-warning',
            confirmed: 'badge-outline-info',
            active: 'badge-outline-primary',
            completed: 'badge-outline-success',
            cancelled: 'badge-outline-danger',
        };

        return <span className={`badge ${statusClasses[status as keyof typeof statusClasses] || 'badge-outline-secondary'}`}>{status}</span>;
    };

    const getPaymentStatusBadge = (paymentStatus: string) => {
        const statusClasses = {
            pending: 'badge-outline-warning',
            deposit_paid: 'badge-outline-info',
            fully_paid: 'badge-outline-success',
            paid: 'badge-outline-success',
            cancelled: 'badge-outline-danger',
        };

        return <span className={`badge ${statusClasses[paymentStatus as keyof typeof statusClasses] || 'badge-outline-secondary'}`}>{paymentStatus.replace('_', ' ')}</span>;
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Show pending approval page if account is inactive
    if (user && !user.is_active) {
        return <AccountPendingPage />;
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="panel border-white-light px-0 dark:border-[#1b2e4b]">
                <div className="px-6 py-7">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center text-white">{getServiceIcon()}</div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{getServiceTitle()}</h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">View all your bookings and their details - {serviceData?.name || user?.full_name}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bookings Table */}
            <div className="panel">
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {t('my_bookings')} ({initialRecords.length})
                        </h2>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <IconCalendar className="w-4 h-4" />
                                Total Bookings: {initialRecords.length}
                            </div>
                        </div>
                    </div>
                </div>

                {initialRecords.length > 0 ? (
                    <div className="datatables pagination-padding">
                        <DataTable
                            className="table-hover whitespace-nowrap"
                            records={records}
                            columns={[
                                {
                                    accessor: 'bookings.booking_reference',
                                    title: t('booking_reference'),
                                    sortable: true,
                                    render: ({ bookings }) => <div className="font-medium text-primary">#{bookings.booking_reference}</div>,
                                },
                                {
                                    accessor: 'bookings.customer_name',
                                    title: 'Customer',
                                    sortable: true,
                                    render: ({ bookings }) => (
                                        <div>
                                            <div className="font-medium">{bookings.customer_name || 'N/A'}</div>
                                            <div className="text-xs text-gray-500">{bookings.customer_email}</div>
                                        </div>
                                    ),
                                },
                                {
                                    accessor: 'bookings.trip_date',
                                    title: t('trip_date'),
                                    sortable: true,
                                    render: ({ bookings }) => (
                                        <div className="flex items-center gap-2">
                                            <IconCalendar className="w-4 h-4 text-gray-400" />
                                            {new Date(bookings.trip_date).toLocaleDateString('en-GB')}
                                        </div>
                                    ),
                                },
                                {
                                    accessor: 'quantity',
                                    title: 'Service Details',
                                    render: ({ quantity, days, rate_type }) => (
                                        <div className="text-sm">
                                            <div>Qty: {quantity}</div>
                                            <div>Days: {days}</div>
                                            <div className="text-xs text-gray-500">Rate: {rate_type}</div>
                                        </div>
                                    ),
                                },
                                {
                                    accessor: 'booked_price',
                                    title: 'Amount',
                                    sortable: true,
                                    render: ({ booked_price }) => (
                                        <div className="flex items-center gap-1 font-medium text-green-600">
                                            <IconDollarSign className="w-4 h-4" />${parseFloat(booked_price.toString()).toFixed(2)}
                                        </div>
                                    ),
                                },
                                {
                                    accessor: 'bookings.status',
                                    title: 'Status',
                                    sortable: true,
                                    render: ({ bookings }) => getStatusBadge(bookings.status),
                                },
                                {
                                    accessor: 'bookings.payment_status',
                                    title: 'Payment',
                                    sortable: true,
                                    render: ({ bookings }) => getPaymentStatusBadge(bookings.payment_status),
                                },
                                {
                                    accessor: 'created_at',
                                    title: 'Booked On',
                                    sortable: true,
                                    render: ({ created_at }) => <div className="text-sm">{new Date(created_at).toLocaleDateString('en-GB')}</div>,
                                },
                                {
                                    accessor: 'action',
                                    title: 'Actions',
                                    textAlignment: 'center' as const,
                                    render: ({ bookings }) => (
                                        <div className="mx-auto flex w-max items-center gap-2">
                                            <button type="button" className="hover:text-info" title="View Details">
                                                <IconEye />
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
                            minHeight={300}
                            paginationText={({ from, to, totalRecords }) => `${t('showing')} ${from} ${t('to')} ${to} ${t('of')} ${totalRecords} ${t('entries')}`}
                            noRecordsText={t('no_bookings_found')}
                        />
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                            <IconCalendar className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('no_bookings_found')}</h3>
                        <p className="text-gray-600 dark:text-gray-400">You don't have any bookings yet. Bookings will appear here once customers book your services.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ServiceProviderBookings;
