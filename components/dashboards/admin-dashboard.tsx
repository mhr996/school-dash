'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import supabase from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import IconTrendingUp from '@/components/icon/icon-trending-up';
import IconUsers from '@/components/icon/icon-users';
import IconBuilding from '@/components/icon/icon-building';
import IconCalendar from '@/components/icon/icon-calendar';
import IconShekelSign from '@/components/icon/icon-shekel-sign';
import IconReceipt from '@/components/icon/icon-receipt';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconUser from '@/components/icon/icon-user';
import IconSettings from '@/components/icon/icon-settings';
import IconPlus from '@/components/icon/icon-plus';
import IconBarChart from '@/components/icon/icon-bar-chart';
import IconCar from '@/components/icon/icon-car';
import IconHeart from '@/components/icon/icon-heart';
import IconLock from '@/components/icon/icon-lock';
import IconPlayCircle from '@/components/icon/icon-play-circle';
import IconUserPlus from '@/components/icon/icon-user-plus';
import IconCircleCheck from '@/components/icon/icon-circle-check';
import IconInfoCircle from '@/components/icon/icon-info-circle';
import IconBook from '@/components/icon/icon-book';
import IconStar from '@/components/icon/icon-star';
import IconAward from '@/components/icon/icon-award';
import IconCashBanknotes from '@/components/icon/icon-cash-banknotes';
import { getTranslation } from '@/i18n';

interface DashboardStats {
    totalEarnings: number;
    monthlyEarnings: number;
    totalBookings: number;
    pendingBookings: number;
    totalUsers: number;
    totalSchools: number;
    totalDestinations: number;
    totalGuides: number;
    totalParamedics: number;
    totalSecurityCompanies: number;
    totalTravelCompanies: number;
    totalEntertainmentCompanies: number;
    totalEducationPrograms: number;
    totalDebt: number;
}

interface BookingTypeCount {
    type: string;
    count: number;
    color: string;
}

interface RecentBooking {
    id: string;
    booking_reference: string;
    booking_type: string;
    trip_date: string;
    total_amount: number;
    payment_status: string;
    status: string;
    customer_name: string;
    school_name: string;
    created_at: string;
}

interface MonthlyRevenue {
    month: string;
    revenue: number;
}

interface TopDestination {
    id: string;
    name: string;
    bookings_count: number;
    total_revenue: number;
}

interface TopSchool {
    id: string;
    name: string;
    bookings_count: number;
    total_spent: number;
}

interface ServicePerformance {
    service_name: string;
    service_type: string;
    bookings_count: number;
    total_revenue: number;
}

const AdminDashboard = () => {
    const { t } = getTranslation();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        totalEarnings: 0,
        monthlyEarnings: 0,
        totalBookings: 0,
        pendingBookings: 0,
        totalUsers: 0,
        totalSchools: 0,
        totalDestinations: 0,
        totalGuides: 0,
        totalParamedics: 0,
        totalSecurityCompanies: 0,
        totalTravelCompanies: 0,
        totalEntertainmentCompanies: 0,
        totalEducationPrograms: 0,
        totalDebt: 0,
    });
    const [bookingTypes, setBookingTypes] = useState<BookingTypeCount[]>([]);
    const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
    const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
    const [topDestinations, setTopDestinations] = useState<TopDestination[]>([]);
    const [topSchools, setTopSchools] = useState<TopSchool[]>([]);
    const [topServices, setTopServices] = useState<ServicePerformance[]>([]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch all data in parallel
            const [
                bookingsData,
                usersData,
                schoolsData,
                destinationsData,
                guidesData,
                paramedicsData,
                securityData,
                travelData,
                entertainmentData,
                educationData,
                recentBookingsData,
                bookingServicesData,
                payoutsData,
            ] = await Promise.all([
                supabase.from('bookings').select('*'),
                supabase.from('users').select('id'),
                supabase.from('schools').select('id, name'),
                supabase.from('destinations').select('id, name').eq('is_active', true),
                supabase.from('guides').select('id, name').eq('status', 'active'),
                supabase.from('paramedics').select('id, name').eq('status', 'active'),
                supabase.from('security_companies').select('id, name').eq('status', 'active'),
                supabase.from('travel_companies').select('id, name').eq('status', 'active'),
                supabase.from('external_entertainment_companies').select('id, name').eq('status', 'active'),
                supabase.from('education_programs').select('id, name').eq('status', 'active'),
                supabase
                    .from('bookings')
                    .select(
                        `
                        id,
                        booking_reference,
                        booking_type,
                        trip_date,
                        total_amount,
                        payment_status,
                        status,
                        created_at,
                        destination_id,
                        school_id,
                        customer:users!bookings_customer_id_fkey(full_name),
                        school:schools(name)
                    `,
                    )
                    .order('created_at', { ascending: false })
                    .limit(10),
                supabase.from('booking_services').select('service_type, service_id, booked_price, booking_id'),
                supabase.from('payouts').select('amount'),
            ]);

            // Calculate total and monthly earnings
            const allBookings = bookingsData.data || [];
            const totalEarnings = allBookings.reduce((sum: number, booking: any) => sum + (parseFloat(booking.total_amount?.toString() || '0') || 0), 0);

            // Calculate total debt (total of all booking services booked_price minus payouts)
            const bookingServices = bookingServicesData.data || [];
            const totalServicesBooked = bookingServices.reduce((sum: number, service: any) => sum + (parseFloat(service.booked_price?.toString() || '0') || 0), 0);
            const allPayouts = payoutsData.data || [];
            const totalPayouts = allPayouts.reduce((sum: number, payout: any) => sum + (parseFloat(payout.amount?.toString() || '0') || 0), 0);
            const totalDebt = totalServicesBooked - totalPayouts;

            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const monthlyEarnings = allBookings
                .filter((booking: any) => {
                    const bookingDate = new Date(booking.created_at);
                    return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
                })
                .reduce((sum: number, booking: any) => sum + (parseFloat(booking.total_amount?.toString() || '0') || 0), 0);

            // Count pending bookings
            const pendingBookings = allBookings.filter((b: any) => b.status === 'pending').length;

            // Group bookings by type
            const bookingTypeMap = new Map<string, number>();
            allBookings.forEach((booking: any) => {
                const type = booking.booking_type || 'full_trip';
                bookingTypeMap.set(type, (bookingTypeMap.get(type) || 0) + 1);
            });

            const bookingTypeColors: Record<string, string> = {
                full_trip: '#3b82f6',
                guides_only: '#10b981',
                paramedics_only: '#ef4444',
                security_only: '#f59e0b',
                entertainment_only: '#a855f7',
                transportation_only: '#06b6d4',
                education_only: '#10b981',
            };

            const bookingTypesData: BookingTypeCount[] = Array.from(bookingTypeMap.entries()).map(([type, count]) => ({
                type,
                count,
                color: bookingTypeColors[type] || '#6b7280',
            }));

            // Calculate monthly revenue for last 6 months
            const monthlyRevenueData: MonthlyRevenue[] = [];
            for (let i = 5; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const month = date.toLocaleString('default', { month: 'short' });
                const monthNumber = date.getMonth();
                const year = date.getFullYear();

                const revenue = allBookings
                    .filter((booking: any) => {
                        const bookingDate = new Date(booking.created_at);
                        return bookingDate.getMonth() === monthNumber && bookingDate.getFullYear() === year;
                    })
                    .reduce((sum: number, booking: any) => sum + (parseFloat(booking.total_amount?.toString() || '0') || 0), 0);

                monthlyRevenueData.push({ month, revenue });
            }

            // Format recent bookings
            const formattedRecentBookings: RecentBooking[] = (recentBookingsData.data || []).map((booking: any) => {
                return {
                    id: booking.id,
                    booking_reference: booking.booking_reference,
                    booking_type: booking.booking_type,
                    trip_date: booking.trip_date,
                    total_amount: parseFloat(booking.total_amount?.toString() || '0'),
                    payment_status: booking.payment_status,
                    status: booking.status,
                    customer_name: booking.customer?.full_name || 'N/A',
                    school_name: booking.school?.name || 'N/A',
                    created_at: booking.created_at,
                };
            });

            // Calculate top destinations by booking count and revenue
            const destinationStats = new Map<string, { bookings: number; revenue: number }>();
            const allDest = destinationsData.data || [];
            allBookings.forEach((booking: any) => {
                if (booking.destination_id) {
                    const stats = destinationStats.get(booking.destination_id) || { bookings: 0, revenue: 0 };
                    stats.bookings += 1;
                    stats.revenue += parseFloat(booking.total_amount?.toString() || '0') || 0;
                    destinationStats.set(booking.destination_id, stats);
                }
            });

            const topDestinationsData: TopDestination[] = Array.from(destinationStats.entries())
                .map(([id, stats]) => {
                    const dest = allDest.find((d: any) => d.id === id);
                    return {
                        id,
                        name: dest?.name || 'Unknown',
                        bookings_count: stats.bookings,
                        total_revenue: stats.revenue,
                    };
                })
                .sort((a, b) => b.bookings_count - a.bookings_count)
                .slice(0, 5);

            // Calculate top schools by booking count and spending
            const schoolStats = new Map<string, { bookings: number; spent: number }>();
            const allSchools = schoolsData.data || [];
            allBookings.forEach((booking: any) => {
                if (booking.school_id) {
                    const stats = schoolStats.get(booking.school_id) || { bookings: 0, spent: 0 };
                    stats.bookings += 1;
                    stats.spent += parseFloat(booking.total_amount?.toString() || '0') || 0;
                    schoolStats.set(booking.school_id, stats);
                }
            });

            const topSchoolsData: TopSchool[] = Array.from(schoolStats.entries())
                .map(([id, stats]) => {
                    const school = allSchools.find((s: any) => s.id === id);
                    return {
                        id,
                        name: school?.name || 'Unknown',
                        bookings_count: stats.bookings,
                        total_spent: stats.spent,
                    };
                })
                .sort((a, b) => b.total_spent - a.total_spent)
                .slice(0, 5);

            // Calculate top performing services
            const serviceStats = new Map<string, { service_type: string; bookings: number; revenue: number }>();
            const allServices = bookingServicesData.data || [];
            const allGuidesData = guidesData.data || [];
            const allParamedicsData = paramedicsData.data || [];
            const allSecurityData = securityData.data || [];
            const allTravelData = travelData.data || [];
            const allEntertainmentData = entertainmentData.data || [];
            const allEducationData = educationData.data || [];

            allServices.forEach((service: any) => {
                const key = `${service.service_type}_${service.service_id}`;
                const stats = serviceStats.get(key) || { service_type: service.service_type, bookings: 0, revenue: 0 };
                stats.bookings += 1;
                stats.revenue += parseFloat(service.booked_price?.toString() || '0') || 0;
                serviceStats.set(key, stats);
            });

            const topServicesData: ServicePerformance[] = Array.from(serviceStats.entries())
                .map(([key, stats]) => {
                    const [type, id] = key.split('_');
                    let serviceName = 'Unknown';

                    if (type === 'guides') serviceName = allGuidesData.find((g: any) => g.id === id)?.name || 'Unknown Guide';
                    else if (type === 'paramedics') serviceName = allParamedicsData.find((p: any) => p.id === id)?.name || 'Unknown Paramedic';
                    else if (type === 'security_companies') serviceName = allSecurityData.find((s: any) => s.id === id)?.name || 'Unknown Security';
                    else if (type === 'travel_companies') serviceName = allTravelData.find((t: any) => t.id === id)?.name || 'Unknown Travel';
                    else if (type === 'external_entertainment_companies') serviceName = allEntertainmentData.find((e: any) => e.id === id)?.name || 'Unknown Entertainment';
                    else if (type === 'education_programs') serviceName = allEducationData.find((e: any) => e.id === id)?.name || 'Unknown Education';

                    return {
                        service_name: serviceName,
                        service_type: type,
                        bookings_count: stats.bookings,
                        total_revenue: stats.revenue,
                    };
                })
                .sort((a, b) => b.total_revenue - a.total_revenue)
                .slice(0, 10);

            setStats({
                totalEarnings,
                monthlyEarnings,
                totalBookings: allBookings.length,
                pendingBookings,
                totalUsers: usersData.data?.length || 0,
                totalSchools: schoolsData.data?.length || 0,
                totalDestinations: destinationsData.data?.length || 0,
                totalGuides: guidesData.data?.length || 0,
                totalParamedics: paramedicsData.data?.length || 0,
                totalSecurityCompanies: securityData.data?.length || 0,
                totalTravelCompanies: travelData.data?.length || 0,
                totalEntertainmentCompanies: entertainmentData.data?.length || 0,
                totalEducationPrograms: educationData.data?.length || 0,
                totalDebt,
            });

            setBookingTypes(bookingTypesData);
            setRecentBookings(formattedRecentBookings);
            setMonthlyRevenue(monthlyRevenueData);
            setTopDestinations(topDestinationsData);
            setTopSchools(topSchoolsData);
            setTopServices(topServicesData);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        {
            title: t('create_new_booking'),
            description: t('start_new_trip_booking'),
            icon: IconPlus,
            color: 'from-blue-500 to-blue-600',
            onClick: () => router.push('/bookings/create'),
        },
        {
            title: t('add_destination'),
            description: t('add_new_destination'),
            icon: IconMapPin,
            color: 'from-green-500 to-green-600',
            onClick: () => router.push('/destinations/create'),
        },
        {
            title: t('add_user'),
            description: t('create_new_user'),
            icon: IconUserPlus,
            color: 'from-purple-500 to-purple-600',
            onClick: () => router.push('/users/create'),
        },
        {
            title: t('view_reports'),
            description: t('generate_reports'),
            icon: IconBarChart,
            color: 'from-orange-500 to-orange-600',
            onClick: () => router.push('/reports'),
        },
        {
            title: t('manage_services'),
            description: t('edit_services'),
            icon: IconSettings,
            color: 'from-pink-500 to-pink-600',
            onClick: () => router.push('/services'),
        },
        {
            title: t('view_all_bookings'),
            description: t('browse_bookings'),
            icon: IconCalendar,
            color: 'from-cyan-500 to-cyan-600',
            onClick: () => router.push('/bookings'),
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-8">
            {/* Header */}
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-2">{t('admin_dashboard')}</h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg">{t('overview_of_system')}</p>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
                {/* Total Earnings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <IconShekelSign className="w-7 h-7" />
                        </div>
                        <IconTrendingUp className="w-6 h-6 text-white/60" />
                    </div>
                    <h3 className="text-3xl font-bold mb-1">₪{stats.totalEarnings.toLocaleString()}</h3>
                    <p className="text-white/80 text-sm">{t('total_earnings')}</p>
                    <div className="mt-4 pt-4 border-t border-white/20">
                        <p className="text-xs text-white/70">
                            {t('this_month')}: <span className="font-semibold">₪{stats.monthlyEarnings.toLocaleString()}</span>
                        </p>
                    </div>
                </motion.div>

                {/* Total Bookings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <IconCalendar className="w-7 h-7" />
                        </div>
                        <IconCircleCheck className="w-6 h-6 text-white/60" />
                    </div>
                    <h3 className="text-3xl font-bold mb-1">{stats.totalBookings}</h3>
                    <p className="text-white/80 text-sm">{t('total_bookings')}</p>
                    <div className="mt-4 pt-4 border-t border-white/20">
                        <p className="text-xs text-white/70">
                            {t('pending')}: <span className="font-semibold">{stats.pendingBookings}</span>
                        </p>
                    </div>
                </motion.div>

                {/* Total Users */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <IconUsers className="w-7 h-7" />
                        </div>
                        <IconUser className="w-6 h-6 text-white/60" />
                    </div>
                    <h3 className="text-3xl font-bold mb-1">{stats.totalUsers}</h3>
                    <p className="text-white/80 text-sm">{t('total_users')}</p>
                    <div className="mt-4 pt-4 border-t border-white/20">
                        <p className="text-xs text-white/70">
                            {t('schools')}: <span className="font-semibold">{stats.totalSchools}</span>
                        </p>
                    </div>
                </motion.div>

                {/* Total Destinations */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <IconMapPin className="w-7 h-7" />
                        </div>
                        <IconInfoCircle className="w-6 h-6 text-white/60" />
                    </div>
                    <h3 className="text-3xl font-bold mb-1">{stats.totalDestinations}</h3>
                    <p className="text-white/80 text-sm">{t('active_destinations')}</p>
                    <div className="mt-4 pt-4 border-t border-white/20">
                        <p className="text-xs text-white/70">
                            {t('total_services')}: <span className="font-semibold">{stats.totalGuides + stats.totalParamedics + stats.totalSecurityCompanies}</span>
                        </p>
                    </div>
                </motion.div>

                {/* Total Debt */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <IconCashBanknotes className="w-7 h-7" />
                        </div>
                        <IconReceipt className="w-6 h-6 text-white/60" />
                    </div>
                    <h3 className="text-3xl font-bold mb-1">₪{stats.totalDebt.toLocaleString()}</h3>
                    <p className="text-white/80 text-sm">{t('total_debt')}</p>
                    <div className="mt-4 pt-4 border-t border-white/20">
                        <p className="text-xs text-white/70">{t('amount_owed_to_services')}</p>
                    </div>
                </motion.div>
            </div>

            {/* Services Overview */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('services_overview')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                <IconUsers className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalGuides}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{t('guides')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                <IconHeart className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalParamedics}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{t('paramedics')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                <IconLock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSecurityCompanies}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{t('security')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                <IconCar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTravelCompanies}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{t('travel_companies')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                <IconPlayCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalEntertainmentCompanies}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{t('entertainment')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                <IconBuilding className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSchools}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{t('schools')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                <IconBook className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalEducationPrograms}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{t('education_programs')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Revenue Chart */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 shadow-lg"
                >
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <IconBarChart className="w-6 h-6 text-blue-600" />
                        {t('revenue_trend')}
                    </h3>
                    <div className="space-y-4">
                        {monthlyRevenue.map((item, index) => {
                            const maxRevenue = Math.max(...monthlyRevenue.map((r) => r.revenue));
                            const percentage = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                            return (
                                <div key={index}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.month}</span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">₪{item.revenue.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Booking Types Distribution */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 shadow-lg"
                >
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <IconReceipt className="w-6 h-6 text-purple-600" />
                        {t('booking_types_distribution')}
                    </h3>
                    <div className="space-y-3">
                        {bookingTypes.map((item, index) => {
                            const total = bookingTypes.reduce((sum, type) => sum + type.count, 0);
                            const percentage = total > 0 ? (item.count / total) * 100 : 0;
                            return (
                                <div key={index} className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t(item.type)}</span>
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                {item.count} ({percentage.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: item.color }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>

            {/* Analytics Row: Top Destinations, Schools, and Services */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Top Destinations */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 shadow-lg"
                >
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <IconMapPin className="w-6 h-6 text-orange-600" />
                        {t('top_destinations')}
                    </h3>
                    <div className="space-y-4">
                        {topDestinations.map((destination, index) => (
                            <motion.div
                                key={destination.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.8 + index * 0.1 }}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                onClick={() => router.push(`/destinations/preview/${destination.id}`)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                                        <span className="text-sm font-bold text-orange-600 dark:text-orange-400">#{index + 1}</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{destination.name}</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            {destination.bookings_count} {t('bookings')}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-green-600 dark:text-green-400 text-sm">₪{destination.total_revenue.toLocaleString()}</p>
                                </div>
                            </motion.div>
                        ))}
                        {topDestinations.length === 0 && (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <IconMapPin className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">{t('no_data_available')}</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Top Schools */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.75 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 shadow-lg"
                >
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <IconBuilding className="w-6 h-6 text-indigo-600" />
                        {t('top_schools')}
                    </h3>
                    <div className="space-y-4">
                        {topSchools.map((school, index) => (
                            <motion.div
                                key={school.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.85 + index * 0.1 }}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                onClick={() => router.push(`/schools/preview/${school.id}`)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">#{index + 1}</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{school.name}</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            {school.bookings_count} {t('bookings')}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-green-600 dark:text-green-400 text-sm">₪{school.total_spent.toLocaleString()}</p>
                                </div>
                            </motion.div>
                        ))}
                        {topSchools.length === 0 && (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <IconBuilding className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">{t('no_data_available')}</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Top Services */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 shadow-lg"
                >
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <IconAward className="w-6 h-6 text-yellow-600" />
                        {t('top_services')}
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {topServices.map((service, index) => {
                            const serviceIconMap: Record<string, any> = {
                                guides: IconUsers,
                                paramedics: IconHeart,
                                security_companies: IconLock,
                                travel_companies: IconCar,
                                external_entertainment_companies: IconPlayCircle,
                                education_programs: IconBook,
                            };
                            const ServiceIcon = serviceIconMap[service.service_type] || IconSettings;
                            const serviceColorMap: Record<string, string> = {
                                guides: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
                                paramedics: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
                                security_companies: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30',
                                travel_companies: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
                                external_entertainment_companies: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30',
                                education_programs: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30',
                            };
                            const colorClass = serviceColorMap[service.service_type] || 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';

                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.9 + index * 0.05 }}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                                            <ServiceIcon className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-gray-900 dark:text-white text-xs truncate">{service.service_name}</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                {service.bookings_count} {t('bookings')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-2">
                                        <p className="font-bold text-green-600 dark:text-green-400 text-xs">₪{service.total_revenue.toLocaleString()}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                        {topServices.length === 0 && (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <IconAward className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">{t('no_data_available')}</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('quick_actions')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {quickActions.map((action, index) => (
                        <motion.button
                            key={index}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={action.onClick}
                            className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 text-left group"
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
                                >
                                    <action.icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{action.title}</h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">{action.description}</p>
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            {/* Recent Bookings */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('recent_bookings')}</h2>
                    <button onClick={() => router.push('/bookings')} className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium flex items-center gap-1">
                        {t('view_all')}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('reference')}</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('type')}</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('customer')}</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('school')}</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('trip_date')}</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('amount')}</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('status')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                {recentBookings.map((booking, index) => (
                                    <motion.tr
                                        key={booking.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 1 + index * 0.05 }}
                                        className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors duration-200 cursor-pointer"
                                        onClick={() => router.push(`/bookings/preview/${booking.id}`)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{booking.booking_reference}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-900 dark:text-white">{t(booking.booking_type)}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-900 dark:text-white">{booking.customer_name}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{booking.school_name}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-900 dark:text-white">{new Date(booking.trip_date).toLocaleDateString()}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-semibold text-green-600 dark:text-green-400">₪{booking.total_amount.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    booking.status === 'confirmed'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                        : booking.status === 'pending'
                                                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                                                }`}
                                            >
                                                {t(booking.status)}
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminDashboard;
