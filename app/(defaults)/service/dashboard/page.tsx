'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUserWithRole } from '@/lib/auth';
import { getTranslation } from '@/i18n';
import AccountPendingPage from '@/components/auth/account-pending';
import Link from 'next/link';
import supabase from '@/lib/supabase';

// Icons
import IconUser from '@/components/icon/icon-user';
import IconCalendar from '@/components/icon/icon-calendar';
import IconDollarSign from '@/components/icon/icon-dollar-sign';
import IconEye from '@/components/icon/icon-eye';
import IconEdit from '@/components/icon/icon-edit';
import IconOpenBook from '@/components/icon/icon-open-book';
import IconCreditCard from '@/components/icon/icon-credit-card';
import IconTrendingUp from '@/components/icon/icon-trending-up';

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
    status: string;
    created_at: string;
    [key: string]: any;
}

interface BookingSummary {
    total_bookings: number;
    pending_bookings: number;
    completed_bookings: number;
    total_earnings: number;
}

const ServiceProviderDashboard = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [serviceData, setServiceData] = useState<ServiceProviderData | null>(null);
    const [bookingSummary, setBookingSummary] = useState<BookingSummary>({
        total_bookings: 0,
        pending_bookings: 0,
        completed_bookings: 0,
        total_earnings: 0,
    });
    const [recentBookings, setRecentBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initializeDashboard = async () => {
            try {
                const { user: userData, error } = await getCurrentUserWithRole();

                if (error || !userData) {
                    router.push('/auth/signin');
                    return;
                }

                setUser(userData);

                // Check if user is active
                if (!userData.is_active) {
                    // User will see the pending approval page
                    setIsLoading(false);
                    return;
                }

                // Fetch service provider data based on role
                await fetchServiceProviderData(userData);
                await fetchBookingSummary(userData);
                await fetchRecentBookings(userData);
            } catch (error) {
                console.error('Error initializing dashboard:', error);
                router.push('/auth/signin');
            } finally {
                setIsLoading(false);
            }
        };

        initializeDashboard();
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
            }
        } catch (error) {
            console.error(`Error fetching ${tableName} data:`, error);
        }
    };

    const fetchBookingSummary = async (userData: User) => {
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
            default:
                return;
        }

        try {
            // Get booking services for this provider
            const { data: bookingServices, error } = await supabase
                .from('booking_services')
                .select(
                    `
                    *,
                    bookings!inner(*)
                `,
                )
                .eq('service_type', serviceType)
                .eq('service_id', serviceData?.id || '');

            if (!error && bookingServices) {
                const totalBookings = bookingServices.length;
                const pendingBookings = bookingServices.filter((bs) => bs.bookings?.status === 'pending' || bs.bookings?.status === 'confirmed').length;
                const completedBookings = bookingServices.filter((bs) => bs.bookings?.status === 'completed').length;
                const totalEarnings = bookingServices.reduce((sum, bs) => sum + (parseFloat(bs.booked_price) || 0), 0);

                setBookingSummary({
                    total_bookings: totalBookings,
                    pending_bookings: pendingBookings,
                    completed_bookings: completedBookings,
                    total_earnings: totalEarnings,
                });
            }
        } catch (error) {
            console.error('Error fetching booking summary:', error);
        }
    };

    const fetchRecentBookings = async (userData: User) => {
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
                .eq('service_id', serviceData?.id || '')
                .order('created_at', { ascending: false })
                .limit(5);

            if (!error && bookingServices) {
                setRecentBookings(bookingServices);
            }
        } catch (error) {
            console.error('Error fetching recent bookings:', error);
        }
    };

    if (isLoading) {
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

    const getServiceTypeIcon = () => {
        const roleName = user?.user_roles?.name;
        switch (roleName) {
            case 'guide':
                return <IconOpenBook className="w-6 h-6" />;
            case 'paramedic':
                return <IconUser className="w-6 h-6" />;
            case 'security_company':
                return <IconUser className="w-6 h-6" />;
            case 'travel_company':
                return <IconUser className="w-6 h-6" />;
            case 'entertainment_company':
                return <IconUser className="w-6 h-6" />;
            default:
                return <IconUser className="w-6 h-6" />;
        }
    };

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="panel border-white-light px-0 dark:border-[#1b2e4b]">
                <div className="px-6 py-7">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4 mb-4 md:mb-0">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center text-white">{getServiceTypeIcon()}</div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {t('welcome_back')}, {user?.full_name}!
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    {t('service_dashboard')} - {serviceData?.name || user?.user_roles?.name}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Link href="/service/profile" className="btn btn-outline-primary gap-2">
                                <IconEdit className="w-4 h-4" />
                                {t('update_profile')}
                            </Link>
                            <Link href="/service/bookings" className="btn btn-primary gap-2">
                                <IconCalendar className="w-4 h-4" />
                                {t('my_bookings')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="panel bg-gradient-to-r from-cyan-500 to-cyan-600">
                    <div className="flex justify-between">
                        <div className="ltr:mr-1 rtl:ml-1 text-white">
                            <div className="text-xl font-semibold mb-1">{bookingSummary.total_bookings}</div>
                            <div className="text-cyan-100">{t('total_bookings')}</div>
                        </div>
                        <div className="bg-cyan-400 rounded-full w-11 h-11 flex items-center justify-center">
                            <IconCalendar className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="panel bg-gradient-to-r from-violet-500 to-violet-600">
                    <div className="flex justify-between">
                        <div className="ltr:mr-1 rtl:ml-1 text-white">
                            <div className="text-xl font-semibold mb-1">{bookingSummary.pending_bookings}</div>
                            <div className="text-violet-100">{t('pending_bookings')}</div>
                        </div>
                        <div className="bg-violet-400 rounded-full w-11 h-11 flex items-center justify-center">
                            <IconTrendingUp className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="panel bg-gradient-to-r from-blue-500 to-blue-600">
                    <div className="flex justify-between">
                        <div className="ltr:mr-1 rtl:ml-1 text-white">
                            <div className="text-xl font-semibold mb-1">{bookingSummary.completed_bookings}</div>
                            <div className="text-blue-100">{t('completed')}</div>
                        </div>
                        <div className="bg-blue-400 rounded-full w-11 h-11 flex items-center justify-center">
                            <IconCreditCard className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="panel bg-gradient-to-r from-fuchsia-500 to-fuchsia-600">
                    <div className="flex justify-between">
                        <div className="ltr:mr-1 rtl:ml-1 text-white">
                            <div className="text-xl font-semibold mb-1">${bookingSummary.total_earnings.toFixed(2)}</div>
                            <div className="text-fuchsia-100">{t('total_earnings')}</div>
                        </div>
                        <div className="bg-fuchsia-400 rounded-full w-11 h-11 flex items-center justify-center">
                            <IconDollarSign className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Bookings */}
            <div className="panel">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('recent_bookings')}</h2>
                    <Link href="/service/bookings" className="text-primary hover:text-primary-dark transition-colors">
                        {t('view_all')}
                    </Link>
                </div>

                {recentBookings.length > 0 ? (
                    <div className="space-y-4">
                        {recentBookings.map((booking, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-white">Booking #{booking.bookings.booking_reference}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">{new Date(booking.bookings.trip_date).toLocaleDateString()}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-medium text-gray-900 dark:text-white">${parseFloat(booking.booked_price).toFixed(2)}</div>
                                    <span
                                        className={`text-xs px-2 py-1 rounded-full ${
                                            booking.bookings.status === 'completed'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : booking.bookings.status === 'confirmed'
                                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                        }`}
                                    >
                                        {booking.bookings.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">{t('no_bookings_found')}</div>
                )}
            </div>
        </div>
    );
};

export default ServiceProviderDashboard;
