'use client';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';
import dynamic from 'next/dynamic';
import { getTranslation } from '@/i18n';
import supabase from '@/lib/supabase';
import Link from 'next/link';

// Dynamic import for charts to avoid SSR issues
const ReactApexChart = dynamic(() => import('react-apexcharts'), {
    ssr: false,
    loading: () => (
        <div className="h-[200px] flex items-center justify-center animate-pulse bg-gray-200 dark:bg-gray-700 rounded">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 animate-pulse"></div>
        </div>
    ),
});

// Icons
import IconTrendingUp from '@/components/icon/icon-trending-up';
import IconTrendingDown from '@/components/icon/icon-trending-down';
import IconDollarSign from '@/components/icon/icon-dollar-sign';
import IconUsersGroup from '@/components/icon/icon-users-group';
import IconCar from '@/components/icon/icon-car';
import IconBuilding from '@/components/icon/icon-building';
import IconCalendar from '@/components/icon/icon-calendar';
import IconFilter from '@/components/icon/icon-filter';
import IconDownload from '@/components/icon/icon-download';
import IconUser from '@/components/icon/icon-user';
import IconHeart from '@/components/icon/icon-heart';
import IconSquareCheck from '@/components/icon/icon-square-check';
import IconStar from '@/components/icon/icon-star';
import IconMapPin from '@/components/icon/icon-map-pin';

// Date range interface
interface DateRange {
    startDate: string;
    endDate: string;
}

// Service performance interfaces
interface ServicePerformance {
    id: string;
    name: string;
    bookingsCount: number;
    totalRevenue: number;
    rank: number;
}

interface GuidePerformance extends ServicePerformance {
    hourlyRate: number;
    dailyRate: number;
    tripsCompleted: number;
}

interface ParamedicPerformance extends ServicePerformance {
    hourlyRate: number;
    dailyRate: number;
    emergencyResponseCount: number;
}

interface SecurityCompanyPerformance extends ServicePerformance {
    activeContracts: number;
}

interface EntertainmentCompanyPerformance extends ServicePerformance {
    averagePrice: number;
    eventTypes: string[];
}

interface DestinationPerformance extends ServicePerformance {
    address: string;
    totalVisitors: number;
}

interface TravelCompanyPerformance extends ServicePerformance {
    vehicleCount: number;
    vehicleTypes: string[];
    averageDistance: number;
}

// Reports data interface
interface ReportsData {
    loading: boolean;
    dateRange: DateRange;

    // Summary stats
    totalRevenue: number;
    totalBookings: number;
    totalStudents: number;
    totalTravelCompanies: number;

    // Growth percentages
    revenueGrowth: number;
    bookingsGrowth: number;
    studentsGrowth: number;
    travelCompaniesGrowth: number;

    // Chart data
    revenueByMonth: { month: string; amount: number }[];
    bookingsByStatus: { status: string; count: number }[];
    paymentMethods: { method: string; percentage: number }[];
    topDestinations: { destination: string; bookings: number }[];
    travelCompaniesStats: { name: string; bookingsCount: number; vehicleCount: number }[];

    // Service performance data
    topGuides: GuidePerformance[];
    topParamedics: ParamedicPerformance[];
    topSecurityCompanies: SecurityCompanyPerformance[];
    topEntertainmentCompanies: EntertainmentCompanyPerformance[];
    topDestinationsPerformance: DestinationPerformance[];
    topTravelCompaniesPerformance: TravelCompanyPerformance[];

    // Detailed tables
    recentBookings: any[];
    upcomingTrips: any[];
}

const ReportsPage = () => {
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl';
    const [isMounted, setIsMounted] = useState(false);
    const { t } = getTranslation();

    // Initialize date range to last 30 days
    const getDefaultDateRange = (): DateRange => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);

        return {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
        };
    };

    const [reportsData, setReportsData] = useState<ReportsData>({
        loading: true,
        dateRange: getDefaultDateRange(),
        totalRevenue: 0,
        totalBookings: 0,
        totalStudents: 0,
        totalTravelCompanies: 0,
        revenueGrowth: 0,
        bookingsGrowth: 0,
        studentsGrowth: 0,
        travelCompaniesGrowth: 0,
        revenueByMonth: [],
        bookingsByStatus: [],
        paymentMethods: [],
        topDestinations: [],
        travelCompaniesStats: [],
        topGuides: [],
        topParamedics: [],
        topSecurityCompanies: [],
        topEntertainmentCompanies: [],
        topDestinationsPerformance: [],
        topTravelCompaniesPerformance: [],
        recentBookings: [],
        upcomingTrips: [],
    });

    // Selected report section for mobile view
    const [selectedSection, setSelectedSection] = useState<string>('overview');

    // Active service tab for top performing services
    const [activeServiceTab, setActiveServiceTab] = useState<string>('guides');

    useEffect(() => {
        setIsMounted(true);
        fetchReportsData();
    }, []);

    useEffect(() => {
        if (reportsData.dateRange.startDate && reportsData.dateRange.endDate) {
            fetchReportsData();
        }
    }, [reportsData.dateRange]);

    const fetchReportsData = async () => {
        setReportsData((prev) => ({ ...prev, loading: true }));

        try {
            const { startDate, endDate } = reportsData.dateRange;

            // Parallel data fetching for better performance
            const [bookingsData, billsData, studentsData, travelCompaniesData, destinationsData, tripsData, guidesData, paramedicsData, securityData, entertainmentData, allBookingsData] =
                await Promise.all([
                    // Bookings in date range
                    supabase
                        .from('bookings')
                        .select(
                            `
                        *,
                        destination:destinations(name, address),
                        booking_services(*)
                    `,
                        )
                        .gte('created_at', startDate)
                        .lte('created_at', endDate + 'T23:59:59'),

                    // Bills and payments in date range
                    supabase
                        .from('bills')
                        .select(
                            `
                        *,
                        payments(*)
                    `,
                        )
                        .gte('created_at', startDate)
                        .lte('created_at', endDate + 'T23:59:59'),

                    // All students (for total count)
                    supabase.from('students').select('id, created_at, status'),

                    // All travel companies
                    supabase.from('travel_companies').select('*'),

                    // Popular destinations
                    supabase.from('destinations').select('*'),

                    // Upcoming trips
                    supabase
                        .from('bookings')
                        .select(
                            `
                        *,
                        destination:destinations(name, address)
                    `,
                        )
                        .gte('trip_date', new Date().toISOString().split('T')[0])
                        .order('trip_date', { ascending: true })
                        .limit(10),

                    // Service performance data
                    supabase.from('guides').select('*'),
                    supabase.from('paramedics').select('*'),
                    supabase.from('security_companies').select('*'),
                    supabase.from('external_entertainment_companies').select('*'),

                    // Recent bookings for performance calculation (last 1000 bookings for performance)
                    supabase
                        .from('bookings')
                        .select(
                            `
                        *,
                        destination:destinations(id, name, address),
                        services
                    `,
                        )
                        .order('created_at', { ascending: false })
                        .limit(1000),
                ]);

            // Process the data and update state
            await processReportsData({
                bookings: bookingsData.data || [],
                bills: billsData.data || [],
                students: studentsData.data || [],
                travelCompanies: travelCompaniesData.data || [],
                destinations: destinationsData.data || [],
                upcomingTrips: tripsData.data || [],
                guides: guidesData.data || [],
                paramedics: paramedicsData.data || [],
                securityCompanies: securityData.data || [],
                entertainmentCompanies: entertainmentData.data || [],
                allBookings: allBookingsData.data || [],
            });
        } catch (error) {
            console.error('Error fetching reports data:', error);
        } finally {
            setReportsData((prev) => ({ ...prev, loading: false }));
        }
    };

    const processReportsData = async (data: any) => {
        const { bookings, bills, students, travelCompanies, destinations, upcomingTrips, guides, paramedics, securityCompanies, entertainmentCompanies, allBookings } = data;

        // Calculate revenue metrics
        const totalRevenue = bills.reduce((sum: number, bill: any) => {
            const billTotal = bill.payments?.reduce((pSum: number, payment: any) => pSum + payment.amount, 0) || 0;
            return sum + billTotal;
        }, 0);

        // Calculate growth (compare with previous period)
        const periodLength = new Date(reportsData.dateRange.endDate).getTime() - new Date(reportsData.dateRange.startDate).getTime();
        const prevStartDate = new Date(new Date(reportsData.dateRange.startDate).getTime() - periodLength).toISOString().split('T')[0];
        const prevEndDate = reportsData.dateRange.startDate;

        const { data: prevBookings } = await supabase
            .from('bookings')
            .select('*')
            .gte('created_at', prevStartDate)
            .lte('created_at', prevEndDate + 'T23:59:59');

        const { data: prevBills } = await supabase
            .from('bills')
            .select('*, payments(*)')
            .gte('created_at', prevStartDate)
            .lte('created_at', prevEndDate + 'T23:59:59');

        const prevRevenue = (prevBills || []).reduce((sum: number, bill: any) => {
            const billTotal = bill.payments?.reduce((pSum: number, payment: any) => pSum + payment.amount, 0) || 0;
            return sum + billTotal;
        }, 0);

        const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
        const bookingsGrowth = (prevBookings?.length || 0) > 0 ? ((bookings.length - (prevBookings?.length || 0)) / (prevBookings?.length || 1)) * 100 : 0;

        // Process payment methods
        const paymentMethods = bills.reduce((acc: any, bill: any) => {
            bill.payments?.forEach((payment: any) => {
                if (!acc[payment.payment_type]) {
                    acc[payment.payment_type] = 0;
                }
                acc[payment.payment_type] += payment.amount;
            });
            return acc;
        }, {});

        const totalPayments = Object.values(paymentMethods).reduce((sum: number, amount: any) => sum + amount, 0);
        const paymentMethodsChart = Object.entries(paymentMethods).map(([method, amount]: [string, any]) => ({
            method: method.replace('_', ' ').toUpperCase(),
            percentage: totalPayments > 0 ? (amount / totalPayments) * 100 : 0,
        }));

        // Process bookings by status
        const bookingsByStatus = bookings.reduce((acc: any, booking: any) => {
            if (!acc[booking.status]) {
                acc[booking.status] = 0;
            }
            acc[booking.status]++;
            return acc;
        }, {});

        const bookingsByStatusChart = Object.entries(bookingsByStatus).map(([status, count]: [string, any]) => ({
            status: status.replace('_', ' ').toUpperCase(),
            count,
        }));

        // Travel companies stats
        const travelCompaniesStats = travelCompanies.map((company: any) => ({
            name: company.name,
            bookingsCount: Math.floor(Math.random() * 50), // Placeholder - would need actual bookings count
            vehicleCount: company.vehicle_count || 0,
        }));

        // Top destinations
        const destinationCounts = bookings.reduce((acc: any, booking: any) => {
            const destName = booking.destination?.name || 'Unknown';
            if (!acc[destName]) {
                acc[destName] = 0;
            }
            acc[destName]++;
            return acc;
        }, {});

        const topDestinations = Object.entries(destinationCounts)
            .map(([destination, bookings]: [string, any]) => ({ destination, bookings }))
            .sort((a, b) => b.bookings - a.bookings)
            .slice(0, 5);

        // Revenue by month (last 6 months)
        const revenueByMonth: { month: string; amount: number }[] = [];
        const currentDate = new Date();

        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthStart = monthDate.toISOString().split('T')[0];
            const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).toISOString().split('T')[0];

            const monthBills = bills.filter((bill: any) => bill.created_at >= monthStart && bill.created_at <= monthEnd + 'T23:59:59');

            const monthRevenue = monthBills.reduce((sum: number, bill: any) => {
                const billTotal = bill.payments?.reduce((pSum: number, payment: any) => pSum + payment.amount, 0) || 0;
                return sum + billTotal;
            }, 0);

            revenueByMonth.push({
                month: monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                amount: monthRevenue,
            });
        }

        // Process service performance data with real calculations
        const calculateServicePerformance = (services: any[], allBookings: any[], type: 'guides' | 'paramedics' | 'security_companies' | 'external_entertainment_companies'): any[] => {
            return services
                .map((service: any) => {
                    // Count real bookings for this service based on the services JSON field
                    let serviceBookings = 0;
                    let totalRevenue = 0;

                    allBookings.forEach((booking: any) => {
                        if (booking.services && Array.isArray(booking.services)) {
                            booking.services.forEach((bookingService: any) => {
                                if (bookingService.type === type && bookingService.id === service.id) {
                                    serviceBookings++;
                                    totalRevenue += bookingService.cost || 0;
                                }
                            });
                        }
                    });

                    return {
                        id: service.id,
                        name: service.name,
                        bookingsCount: serviceBookings,
                        totalRevenue,
                        rank: 0, // Will be set after sorting
                        ...(type === 'guides' && {
                            hourlyRate: service.hourly_rate || 0,
                            dailyRate: service.daily_rate || 0,
                            tripsCompleted: serviceBookings,
                        }),
                        ...(type === 'paramedics' && {
                            hourlyRate: service.hourly_rate || 0,
                            dailyRate: service.daily_rate || 0,
                            emergencyResponseCount: Math.floor(serviceBookings * 0.2), // Estimate 20% of bookings had emergencies
                        }),
                        ...(type === 'external_entertainment_companies' && {
                            averagePrice: service.price || totalRevenue / Math.max(serviceBookings, 1),
                            eventTypes: ['Shows', 'Tours', 'Activities'], // Still simulated
                        }),
                    };
                })
                .sort((a, b) => b.bookingsCount - a.bookingsCount)
                .map((service, index) => ({ ...service, rank: index + 1 }))
                .slice(0, 10);
        };

        // Calculate destination performance
        const calculateDestinationPerformance = (): DestinationPerformance[] => {
            const destinationStats = new Map();

            allBookings.forEach((booking: any) => {
                if (booking.destination) {
                    const destId = booking.destination.id;
                    const existing = destinationStats.get(destId) || {
                        id: destId,
                        name: booking.destination.name,
                        address: booking.destination.address || '',
                        bookingsCount: 0,
                        totalRevenue: 0,
                        totalVisitors: 0,
                    };

                    existing.bookingsCount++;
                    existing.totalRevenue += booking.total_amount || 0;
                    existing.totalVisitors += 1; // Simplified - assume 1 visitor per booking
                    destinationStats.set(destId, existing);
                }
            });

            return Array.from(destinationStats.values())
                .sort((a, b) => b.bookingsCount - a.bookingsCount)
                .map((dest, index) => ({
                    ...dest,
                    rank: index + 1,
                }))
                .slice(0, 10);
        };

        const topGuides = calculateServicePerformance(guides, allBookings, 'guides');
        const topParamedics = calculateServicePerformance(paramedics, allBookings, 'paramedics');
        const topSecurityCompanies = calculateServicePerformance(securityCompanies, allBookings, 'security_companies');
        const topEntertainmentCompanies = calculateServicePerformance(entertainmentCompanies, allBookings, 'external_entertainment_companies');
        const topDestinationsPerformance = calculateDestinationPerformance();

        // Calculate travel company performance
        const calculateTravelCompanyPerformance = (): TravelCompanyPerformance[] => {
            const travelCompanyStats = allBookings.reduce((acc: Map<string, { bookingsCount: number; totalRevenue: number }>, booking: any) => {
                if (booking.travel_company_id) {
                    const existing = acc.get(booking.travel_company_id) || { bookingsCount: 0, totalRevenue: 0 };
                    existing.bookingsCount++;
                    existing.totalRevenue += booking.total_amount || 0;
                    acc.set(booking.travel_company_id, existing);
                }
                return acc;
            }, new Map<string, { bookingsCount: number; totalRevenue: number }>());

            return travelCompanies
                .map((company: any): TravelCompanyPerformance => {
                    // Get stats for this company
                    const stats = travelCompanyStats.get(company.id) || { bookingsCount: 0, totalRevenue: 0 };

                    // Calculate average trip distance (simulated for now)
                    const averageDistance: number = 25 + Math.random() * 50; // 25-75 km average

                    return {
                        id: company.id,
                        name: company.name,
                        bookingsCount: stats.bookingsCount,
                        totalRevenue: stats.totalRevenue,
                        rank: 0, // Will be set after sorting
                        vehicleCount: company.vehicle_count || 0,
                        vehicleTypes: company.vehicle_types || [],
                        averageDistance,
                    };
                })
                .sort((a: TravelCompanyPerformance, b: TravelCompanyPerformance) => b.bookingsCount - a.bookingsCount)
                .map((company: TravelCompanyPerformance, index: number): TravelCompanyPerformance => ({ ...company, rank: index + 1 }))
                .slice(0, 10);
        };

        const topTravelCompaniesPerformance = calculateTravelCompanyPerformance();

        // Update state with processed data
        setReportsData((prev) => ({
            ...prev,
            totalRevenue,
            totalBookings: bookings.length,
            totalStudents: students.length,
            totalTravelCompanies: travelCompanies.length,
            revenueGrowth,
            bookingsGrowth,
            studentsGrowth: 0, // Would need previous period comparison
            travelCompaniesGrowth: 0, // Would need previous period comparison
            revenueByMonth,
            bookingsByStatus: bookingsByStatusChart,
            paymentMethods: paymentMethodsChart,
            topDestinations,
            travelCompaniesStats: travelCompaniesStats.slice(0, 10),
            topGuides,
            topParamedics,
            topSecurityCompanies,
            topEntertainmentCompanies,
            topDestinationsPerformance,
            topTravelCompaniesPerformance,
            recentBookings: bookings.slice(0, 10),
            upcomingTrips,
        }));
    };

    const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
        setReportsData((prev) => ({
            ...prev,
            dateRange: {
                ...prev.dateRange,
                [field]: value,
            },
        }));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatGrowth = (growth: number) => {
        const formatted = Math.abs(growth).toFixed(1);
        return `${growth >= 0 ? '+' : '-'}${formatted}%`;
    };

    if (!isMounted) {
        return <div className="animate-pulse">{t('loading')}...</div>;
    }

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-black dark:text-white">{t('reports')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">{t('comprehensive_analytics_dashboard')}</p>
                </div>

                {/* Date Range Filters */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2">
                        <IconCalendar className="w-5 h-5 text-gray-500" />
                        <input type="date" value={reportsData.dateRange.startDate} onChange={(e) => handleDateRangeChange('startDate', e.target.value)} className="form-input w-auto" />
                        <span className="text-gray-500">-</span>
                        <input type="date" value={reportsData.dateRange.endDate} onChange={(e) => handleDateRangeChange('endDate', e.target.value)} className="form-input w-auto" />
                    </div>
                    <button className="btn btn-primary gap-2">
                        <IconDownload className="w-4 h-4" />
                        {t('export_report')}
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {reportsData.loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="panel">
                            <div className="animate-pulse">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Summary Cards */}
            {!reportsData.loading && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {/* Revenue Card */}
                        <div className="panel bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex-1">
                                    <h5 className="text-lg font-semibold opacity-90">{t('total_revenue')}</h5>
                                    <div className="text-3xl font-bold mt-2">{formatCurrency(reportsData.totalRevenue)}</div>
                                </div>
                                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                                    <IconDollarSign className="w-8 h-8" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {reportsData.revenueGrowth >= 0 ? <IconTrendingUp className="w-4 h-4" /> : <IconTrendingDown className="w-4 h-4" />}
                                <span className="text-sm opacity-90">
                                    {formatGrowth(reportsData.revenueGrowth)} {t('from_previous_period')}
                                </span>
                            </div>
                        </div>

                        {/* Bookings Card */}
                        <div className="panel bg-gradient-to-r from-green-500 to-green-600 text-white">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex-1">
                                    <h5 className="text-lg font-semibold opacity-90">{t('total_bookings')}</h5>
                                    <div className="text-3xl font-bold mt-2">{reportsData.totalBookings.toLocaleString()}</div>
                                </div>
                                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                                    <IconCalendar className="w-8 h-8" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {reportsData.bookingsGrowth >= 0 ? <IconTrendingUp className="w-4 h-4" /> : <IconTrendingDown className="w-4 h-4" />}
                                <span className="text-sm opacity-90">
                                    {formatGrowth(reportsData.bookingsGrowth)} {t('from_previous_period')}
                                </span>
                            </div>
                        </div>

                        {/* Students Card */}
                        <div className="panel bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex-1">
                                    <h5 className="text-lg font-semibold opacity-90">{t('total_students')}</h5>
                                    <div className="text-3xl font-bold mt-2">{reportsData.totalStudents.toLocaleString()}</div>
                                </div>
                                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                                    <IconUsersGroup className="w-8 h-8" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <IconTrendingUp className="w-4 h-4" />
                                <span className="text-sm opacity-90">{t('active_students')}</span>
                            </div>
                        </div>

                        {/* Travel Companies Card */}
                        <div className="panel bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex-1">
                                    <h5 className="text-lg font-semibold opacity-90">{t('travel_companies')}</h5>
                                    <div className="text-3xl font-bold mt-2">{reportsData.totalTravelCompanies}</div>
                                </div>
                                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                                    <IconBuilding className="w-8 h-8" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <IconCar className="w-4 h-4" />
                                <span className="text-sm opacity-90">{t('transport_partners')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {/* Revenue Trend Chart */}
                        <div className="panel">
                            <div className="flex items-center justify-between mb-5">
                                <h5 className="font-semibold text-lg dark:text-white">{t('revenue_trend')}</h5>
                            </div>
                            <div className="bg-white dark:bg-black rounded-lg">
                                <ReactApexChart
                                    series={[
                                        {
                                            name: t('revenue'),
                                            data: reportsData.revenueByMonth.map((item) => item.amount),
                                        },
                                    ]}
                                    options={{
                                        chart: {
                                            height: 300,
                                            type: 'area',
                                            background: 'transparent',
                                            zoom: { enabled: false },
                                            toolbar: { show: false },
                                        },
                                        dataLabels: { enabled: false },
                                        stroke: { show: true, curve: 'smooth', width: 2 },
                                        colors: ['#1f2937'],
                                        fill: {
                                            type: 'gradient',
                                            gradient: {
                                                shadeIntensity: 1,
                                                inverseColors: false,
                                                opacityFrom: 0.28,
                                                opacityTo: 0.05,
                                                stops: [45, 100],
                                            },
                                        },
                                        theme: { mode: isDark ? 'dark' : 'light' },
                                        grid: {
                                            borderColor: isDark ? '#191e3a' : '#e0e6ed',
                                            strokeDashArray: 5,
                                            xaxis: { lines: { show: false } },
                                        },
                                        xaxis: {
                                            categories: reportsData.revenueByMonth.map((item) => item.month),
                                            axisBorder: { show: false },
                                            axisTicks: { show: false },
                                        },
                                        yaxis: {
                                            tickAmount: 7,
                                            labels: {
                                                formatter: (value: number) => formatCurrency(value),
                                            },
                                        },
                                        tooltip: {
                                            marker: { show: true },
                                            y: {
                                                formatter: (value: number) => formatCurrency(value),
                                            },
                                        },
                                    }}
                                    height={300}
                                    type="area"
                                />
                            </div>
                        </div>

                        {/* Payment Methods Distribution */}
                        <div className="panel">
                            <div className="flex items-center justify-between mb-5">
                                <h5 className="font-semibold text-lg dark:text-white">{t('payment_methods')}</h5>
                            </div>
                            <div className="bg-white dark:bg-black rounded-lg">
                                <ReactApexChart
                                    series={reportsData.paymentMethods.map((item) => item.percentage)}
                                    options={{
                                        chart: {
                                            height: 300,
                                            type: 'pie',
                                            background: 'transparent',
                                        },
                                        labels: reportsData.paymentMethods.map((item) => item.method),
                                        colors: ['#e7515a', '#e2a03f', '#805dca', '#00ab55', '#4361ee'],
                                        responsive: [
                                            {
                                                breakpoint: 480,
                                                options: {
                                                    chart: { width: 200 },
                                                },
                                            },
                                        ],
                                        stroke: { show: false },
                                        legend: {
                                            position: 'bottom',
                                            horizontalAlign: 'center',
                                            fontSize: '14px',
                                            markers: { size: 6 },
                                        },
                                        theme: { mode: isDark ? 'dark' : 'light' },
                                        tooltip: {
                                            y: {
                                                formatter: (value: number) => `${value.toFixed(1)}%`,
                                            },
                                        },
                                    }}
                                    height={300}
                                    type="pie"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Additional Charts Row */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {/* Bookings by Status Chart */}
                        <div className="panel">
                            <div className="flex items-center justify-between mb-5">
                                <h5 className="font-semibold text-lg dark:text-white">{t('bookings_by_status')}</h5>
                            </div>
                            <div className="bg-white dark:bg-black rounded-lg">
                                {reportsData.bookingsByStatus.length > 0 ? (
                                    <ReactApexChart
                                        series={reportsData.bookingsByStatus.map((item) => item.count)}
                                        options={{
                                            chart: {
                                                height: 300,
                                                type: 'donut',
                                                background: 'transparent',
                                            },
                                            labels: reportsData.bookingsByStatus.map((item) => item.status),
                                            colors: ['#4361ee', '#805dca', '#00ab55', '#e7515a', '#e2a03f'],
                                            responsive: [
                                                {
                                                    breakpoint: 480,
                                                    options: {
                                                        chart: { width: 200 },
                                                    },
                                                },
                                            ],
                                            stroke: { show: false },
                                            legend: {
                                                position: 'bottom',
                                                horizontalAlign: 'center',
                                                fontSize: '14px',
                                                markers: { size: 6 },
                                            },
                                            theme: { mode: isDark ? 'dark' : 'light' },
                                            plotOptions: {
                                                pie: {
                                                    donut: {
                                                        size: '65%',
                                                        background: 'transparent',
                                                        labels: {
                                                            show: true,
                                                            name: {
                                                                show: true,
                                                                fontSize: '29px',
                                                                fontWeight: '600',
                                                                color: undefined,
                                                                offsetY: 16,
                                                            },
                                                            value: {
                                                                show: true,
                                                                fontSize: '16px',
                                                                fontWeight: 400,
                                                                color: undefined,
                                                                offsetY: -16,
                                                                formatter: (val: any) => `${val} bookings`,
                                                            },
                                                            total: {
                                                                show: true,
                                                                showAlways: false,
                                                                label: 'Total',
                                                                fontSize: '22px',
                                                                fontWeight: 600,
                                                                color: '#373d3f',
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        }}
                                        height={300}
                                        type="donut"
                                    />
                                ) : (
                                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                                        <p>{t('no_data_available')}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top Destinations */}
                        <div className="panel">
                            <div className="flex items-center justify-between mb-5">
                                <h5 className="font-semibold text-lg dark:text-white">{t('top_destinations')}</h5>
                            </div>
                            <div className="space-y-4">
                                {reportsData.topDestinations.length > 0 ? (
                                    reportsData.topDestinations.map((dest, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'}`}
                                                ></div>
                                                <span className="font-medium">{dest.destination}</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-lg">{dest.bookings}</div>
                                                <div className="text-sm text-gray-500">{t('bookings')}</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>{t('no_destinations_data')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Data Tables Section */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {/* Recent Bookings Table */}
                        <div className="panel">
                            <div className="flex items-center justify-between mb-5">
                                <h5 className="font-semibold text-lg dark:text-white">{t('recent_bookings')}</h5>
                                <Link href="/bookings" className="text-primary hover:underline text-sm">
                                    {t('view_all')}
                                </Link>
                            </div>
                            <div className="table-responsive">
                                <table className="table-hover">
                                    <thead>
                                        <tr>
                                            <th>{t('customer_name')}</th>
                                            <th>{t('destination')}</th>
                                            <th>{t('amount')}</th>
                                            <th>{t('status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportsData.recentBookings.length > 0 ? (
                                            reportsData.recentBookings.slice(0, 5).map((booking: any) => (
                                                <tr key={booking.id}>
                                                    <td>
                                                        <div className="font-medium">{booking.customer_name || t('unknown')}</div>
                                                        <div className="text-xs text-gray-500">{booking.customer_phone}</div>
                                                    </td>
                                                    <td>
                                                        <div className="font-medium">{booking.destination?.name || t('unknown')}</div>
                                                    </td>
                                                    <td>
                                                        <div className="font-bold text-green-600">{formatCurrency(booking.total_amount || 0)}</div>
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={`badge whitespace-nowrap ${
                                                                booking.status === 'confirmed'
                                                                    ? 'badge-outline-success'
                                                                    : booking.status === 'pending'
                                                                      ? 'badge-outline-warning'
                                                                      : booking.status === 'cancelled'
                                                                        ? 'badge-outline-danger'
                                                                        : 'badge-outline-info'
                                                            }`}
                                                        >
                                                            {booking.status?.toUpperCase() || 'UNKNOWN'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="text-center py-4 text-gray-500">
                                                    {t('no_recent_bookings')}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Travel Companies Overview */}
                        <div className="panel">
                            <div className="flex items-center justify-between mb-5">
                                <h5 className="font-semibold text-lg dark:text-white">{t('travel_companies_overview')}</h5>
                                <span className="badge bg-primary text-white">{reportsData.totalTravelCompanies}</span>
                            </div>
                            <div className="space-y-3">
                                {reportsData.travelCompaniesStats.length > 0 ? (
                                    reportsData.travelCompaniesStats.slice(0, 5).map((company: any, index: number) => (
                                        <div
                                            key={index}
                                            className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="font-semibold text-gray-900 dark:text-white">{company.name}</div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                        {company.vehicleCount} {t('vehicles')} • {company.bookingsCount} {t('bookings')}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-center">
                                                        <div className="text-lg font-bold text-blue-600">{company.vehicleCount}</div>
                                                        <div className="text-xs text-gray-500">{t('vehicles')}</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-lg font-bold text-green-600">{company.bookingsCount}</div>
                                                        <div className="text-xs text-gray-500">{t('bookings')}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <IconBuilding className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>{t('no_travel_companies_data')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Top Performing Services */}
                    <div className="panel">
                        <div className="flex items-center justify-between mb-8">
                            <h5 className="font-semibold text-lg dark:text-white">{t('top_performing_services')}</h5>
                        </div>

                        {/* Beautiful Tabs */}
                        <div className="mb-8">
                            <div className="flex flex-wrap gap-1 p-1 bg-gray-100 dark:bg-gray-900/50 rounded-xl backdrop-blur-sm">
                                {[
                                    { id: 'guides', label: t('guides'), icon: IconUser, color: 'emerald' },
                                    { id: 'paramedics', label: t('paramedics'), icon: IconHeart, color: 'red' },
                                    { id: 'security', label: t('security_companies'), icon: IconSquareCheck, color: 'amber' },
                                    { id: 'entertainment', label: t('entertainment'), icon: IconStar, color: 'purple' },
                                    { id: 'destinations', label: t('destinations'), icon: IconMapPin, color: 'blue' },
                                    { id: 'travel_companies', label: t('travel_companies'), icon: IconCar, color: 'teal' },
                                ].map((tab) => {
                                    const IconComponent = tab.icon;
                                    const isActive = activeServiceTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveServiceTab(tab.id)}
                                            className={`
                                                flex items-center gap-3 px-6 py-3 rounded-lg font-medium transition-all duration-300 ease-in-out
                                                ${
                                                    isActive
                                                        ? `bg-white dark:bg-gray-800 text-${tab.color}-600 dark:text-${tab.color}-400 shadow-lg shadow-${tab.color}-100 dark:shadow-${tab.color}-900/20 transform scale-105`
                                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50'
                                                }
                                            `}
                                        >
                                            <IconComponent className={`w-5 h-5 ${isActive ? `text-${tab.color}-600 dark:text-${tab.color}-400` : ''}`} />
                                            <span>{tab.label}</span>
                                            {isActive && <div className={`w-2 h-2 rounded-full bg-${tab.color}-400 animate-pulse`}></div>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="min-h-[400px]">
                            {/* Guides Tab */}
                            {activeServiceTab === 'guides' && (
                                <div className="space-y-4 animate-fade-in">
                                    {reportsData.topGuides.length > 0 ? (
                                        reportsData.topGuides.map((guide, index) => (
                                            <div
                                                key={guide.id}
                                                className="group p-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800/30 hover:shadow-lg hover:shadow-emerald-100 dark:hover:shadow-emerald-900/20 transition-all duration-300"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-full group-hover:scale-110 transition-transform duration-300">
                                                            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">#{index + 1}</span>
                                                        </div>
                                                        <div>
                                                            <h6 className="text-lg font-semibold text-gray-900 dark:text-white">{guide.name}</h6>
                                                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                                                                <span>
                                                                    {guide.bookingsCount} {t('bookings')}
                                                                </span>
                                                                <span>•</span>
                                                                <span>
                                                                    {guide.tripsCompleted} {t('trips_completed')}
                                                                </span>
                                                                <span>•</span>
                                                                <span>
                                                                    {formatCurrency(guide.dailyRate)}/{t('day')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(guide.totalRevenue)}</div>
                                                        <div className="text-sm text-gray-500">{t('total_revenue')}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-gray-500">
                                            <IconUser className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p>{t('no_guides_data')}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Paramedics Tab */}
                            {activeServiceTab === 'paramedics' && (
                                <div className="space-y-4 animate-fade-in">
                                    {reportsData.topParamedics.length > 0 ? (
                                        reportsData.topParamedics.map((paramedic, index) => (
                                            <div
                                                key={paramedic.id}
                                                className="group p-6 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl border border-red-200 dark:border-red-800/30 hover:shadow-lg hover:shadow-red-100 dark:hover:shadow-red-900/20 transition-all duration-300"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full group-hover:scale-110 transition-transform duration-300">
                                                            <span className="text-lg font-bold text-red-600 dark:text-red-400">#{index + 1}</span>
                                                        </div>
                                                        <div>
                                                            <h6 className="text-lg font-semibold text-gray-900 dark:text-white">{paramedic.name}</h6>
                                                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                                                                <span>
                                                                    {paramedic.bookingsCount} {t('bookings')}
                                                                </span>
                                                                <span>•</span>
                                                                <span>
                                                                    {paramedic.emergencyResponseCount} {t('responses')}
                                                                </span>
                                                                <span>•</span>
                                                                <span>
                                                                    {formatCurrency(paramedic.dailyRate)}/{t('day')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(paramedic.totalRevenue)}</div>
                                                        <div className="text-sm text-gray-500">{t('total_revenue')}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-gray-500">
                                            <IconHeart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p>{t('no_paramedics_data')}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Security Companies Tab */}
                            {activeServiceTab === 'security' && (
                                <div className="space-y-4 animate-fade-in">
                                    {reportsData.topSecurityCompanies.length > 0 ? (
                                        reportsData.topSecurityCompanies.map((company, index) => (
                                            <div
                                                key={company.id}
                                                className="group p-6 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border border-amber-200 dark:border-amber-800/30 hover:shadow-lg hover:shadow-amber-100 dark:hover:shadow-amber-900/20 transition-all duration-300"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center justify-center w-12 h-12 bg-amber-100 dark:bg-amber-900/40 rounded-full group-hover:scale-110 transition-transform duration-300">
                                                            <span className="text-lg font-bold text-amber-600 dark:text-amber-400">#{index + 1}</span>
                                                        </div>
                                                        <div>
                                                            <h6 className="text-lg font-semibold text-gray-900 dark:text-white">{company.name}</h6>
                                                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                                                                <span>
                                                                    {company.bookingsCount} {t('bookings')}
                                                                </span>
                                                                <span>•</span>
                                                                <span>
                                                                    {company.activeContracts} {t('active_contracts')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(company.totalRevenue)}</div>
                                                        <div className="text-sm text-gray-500">{t('total_revenue')}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-gray-500">
                                            <IconSquareCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p>{t('no_security_data')}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Entertainment Companies Tab */}
                            {activeServiceTab === 'entertainment' && (
                                <div className="space-y-4 animate-fade-in">
                                    {reportsData.topEntertainmentCompanies.length > 0 ? (
                                        reportsData.topEntertainmentCompanies.map((company, index) => (
                                            <div
                                                key={company.id}
                                                className="group p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800/30 hover:shadow-lg hover:shadow-purple-100 dark:hover:shadow-purple-900/20 transition-all duration-300"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-full group-hover:scale-110 transition-transform duration-300">
                                                            <span className="text-lg font-bold text-purple-600 dark:text-purple-400">#{index + 1}</span>
                                                        </div>
                                                        <div>
                                                            <h6 className="text-lg font-semibold text-gray-900 dark:text-white">{company.name}</h6>
                                                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                                                                <span>
                                                                    {company.bookingsCount} {t('bookings')}
                                                                </span>
                                                                <span>•</span>
                                                                <span>
                                                                    {formatCurrency(company.averagePrice)} {t('avg_price')}
                                                                </span>
                                                                <span>•</span>
                                                                <span>{company.eventTypes.join(', ')}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(company.totalRevenue)}</div>
                                                        <div className="text-sm text-gray-500">{t('total_revenue')}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-gray-500">
                                            <IconStar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p>{t('no_entertainment_data')}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Destinations Tab */}
                            {activeServiceTab === 'destinations' && (
                                <div className="space-y-4 animate-fade-in">
                                    {reportsData.topDestinationsPerformance.length > 0 ? (
                                        reportsData.topDestinationsPerformance.map((destination, index) => (
                                            <div
                                                key={destination.id}
                                                className="group p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800/30 hover:shadow-lg hover:shadow-blue-100 dark:hover:shadow-blue-900/20 transition-all duration-300"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full group-hover:scale-110 transition-transform duration-300">
                                                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">#{index + 1}</span>
                                                        </div>
                                                        <div>
                                                            <h6 className="text-lg font-semibold text-gray-900 dark:text-white">{destination.name}</h6>
                                                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                                                                <span>
                                                                    {destination.bookingsCount} {t('bookings')}
                                                                </span>
                                                            </div>
                                                            {destination.address && (
                                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                    <IconMapPin className="w-3 h-3 inline mr-1" />
                                                                    {destination.address}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(destination.totalRevenue)}</div>
                                                        <div className="text-sm text-gray-500">{t('total_revenue')}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-gray-500">
                                            <IconMapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p>{t('no_destinations_data')}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Travel Companies Tab */}
                            {activeServiceTab === 'travel_companies' && (
                                <div className="space-y-4 animate-fade-in">
                                    {reportsData.topTravelCompaniesPerformance.length > 0 ? (
                                        reportsData.topTravelCompaniesPerformance.map((company, index) => (
                                            <div
                                                key={company.id}
                                                className="group p-6 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl border border-teal-200 dark:border-teal-800/30 hover:shadow-lg hover:shadow-teal-100 dark:hover:shadow-teal-900/20 transition-all duration-300"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center justify-center w-12 h-12 bg-teal-100 dark:bg-teal-900/40 rounded-full group-hover:scale-110 transition-transform duration-300">
                                                            <span className="text-lg font-bold text-teal-600 dark:text-teal-400">#{index + 1}</span>
                                                        </div>
                                                        <div>
                                                            <h6 className="text-lg font-semibold text-gray-900 dark:text-white">{company.name}</h6>
                                                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                                                                <span>
                                                                    {company.bookingsCount} {t('bookings')}
                                                                </span>
                                                                <span>•</span>
                                                                <span>
                                                                    {company.vehicleCount} {t('vehicles')}
                                                                </span>
                                                                <span>•</span>
                                                                <span>
                                                                    {company.averageDistance.toFixed(1)} km {t('avg_distance')}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                <IconCar className="w-3 h-3 inline mr-1" />
                                                                {company.vehicleTypes.join(', ') || t('various_vehicles')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{formatCurrency(company.totalRevenue)}</div>
                                                        <div className="text-sm text-gray-500">{t('total_revenue')}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-gray-500">
                                            <IconCar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p>{t('no_travel_companies_data')}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ReportsPage;
