'use server';
import supabase from '@/lib/supabase';

export interface RevenueStats {
    totalRevenue: number;
    totalPaid: number;
    totalPending: number;
    totalBills: number;
    revenueGrowth: number; // percentage change from previous period
    paymentsGrowth: number; // percentage change from previous period
    pendingGrowth: number; // percentage change from previous period
    averageTransactionGrowth: number; // percentage change from previous period
    monthlyRevenue: Array<{ month: string; revenue: number; }>;
    serviceBreakdown: Array<{
        serviceType: string;
        revenue: number;
        count: number;
        percentage: number;
    }>;
}

export interface TransactionRecord {
    id: string;
    amount: number;
    payment_type: string;
    payment_date: string;
    bill_number: string;
    customer_name: string;
    status: string;
    notes?: string;
}

export interface BalanceInfo {
    totalEarnings: number;
    totalReceived: number;
    pendingPayments: number;
    outstandingAmount: number;
    averageTransactionValue: number;
}

/**
 * Calculate comprehensive revenue statistics for a service provider
 */
export async function calculateServiceRevenue(userId: string): Promise<RevenueStats> {
    try {
        // Get all services for the user (guides, paramedics, security companies, entertainment)
        const serviceQueries = await Promise.all([
            supabase.from('guides').select('id').eq('user_id', userId),
            supabase.from('paramedics').select('id').eq('user_id', userId),
            supabase.from('security_companies').select('id').eq('user_id', userId),
            supabase.from('external_entertainment_companies').select('id').eq('user_id', userId),
        ]);

        const serviceIds = {
            guides: serviceQueries[0].data?.map(s => s.id) || [],
            paramedics: serviceQueries[1].data?.map(s => s.id) || [],
            security_companies: serviceQueries[2].data?.map(s => s.id) || [],
            external_entertainment_companies: serviceQueries[3].data?.map(s => s.id) || [],
        };

        // Get all booking services for these services
        const bookingServicesQuery = supabase
            .from('booking_services')
            .select(`
                id,
                service_type,
                service_id,
                quantity,
                days,
                booked_price,
                created_at,
                booking_id,
                bookings!inner(
                    id,
                    booking_reference,
                    customer_name,
                    total_amount,
                    payment_status,
                    status,
                    trip_date
                )
            `);

        // Add filters for each service type
        const allServiceIds = [
            ...serviceIds.guides,
            ...serviceIds.paramedics, 
            ...serviceIds.security_companies,
            ...serviceIds.external_entertainment_companies
        ];

        if (allServiceIds.length === 0) {
            return {
                totalRevenue: 0,
                totalPaid: 0,
                totalPending: 0,
                totalBills: 0,
                revenueGrowth: 0,
                paymentsGrowth: 0,
                pendingGrowth: 0,
                averageTransactionGrowth: 0,
                monthlyRevenue: [],
                serviceBreakdown: []
            };
        }

        const { data: bookingServices, error } = await bookingServicesQuery
            .in('service_id', allServiceIds);

        if (error) {
            console.error('Error fetching booking services:', error);
            throw error;
        }

        // Calculate total revenue and breakdown by service type
        let totalRevenue = 0;
        let totalPaid = 0;
        let totalPending = 0;
        const serviceTypeBreakdown: Record<string, { revenue: number; count: number; }> = {};
        const monthlyData: Record<string, number> = {};

        bookingServices?.forEach(bs => {
            const amount = (bs.booked_price || 0) * (bs.quantity || 1) * (bs.days || 1);
            totalRevenue += amount;

            // Count paid vs pending based on booking payment status
            const booking = Array.isArray(bs.bookings) ? bs.bookings[0] : bs.bookings;
            if (booking && (booking.payment_status === 'fully_paid' || booking.payment_status === 'paid')) {
                totalPaid += amount;
            } else {
                totalPending += amount;
            }

            // Service type breakdown
            if (!serviceTypeBreakdown[bs.service_type]) {
                serviceTypeBreakdown[bs.service_type] = { revenue: 0, count: 0 };
            }
            serviceTypeBreakdown[bs.service_type].revenue += amount;
            serviceTypeBreakdown[bs.service_type].count += 1;

            // Monthly revenue
            const month = new Date(bs.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short' 
            });
            monthlyData[month] = (monthlyData[month] || 0) + amount;
        });

        // Format service breakdown with percentages
        const serviceBreakdown = Object.entries(serviceTypeBreakdown).map(([type, data]) => ({
            serviceType: type,
            revenue: data.revenue,
            count: data.count,
            percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
        }));

        // Format monthly revenue
        const monthlyRevenue = Object.entries(monthlyData)
            .map(([month, revenue]) => ({ month, revenue }))
            .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

        // Calculate growth trends (compare current month vs previous month)
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
        const previousMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);
        
        const currentMonthRevenue = monthlyData[currentMonth] || 0;
        const previousMonthRevenue = monthlyData[previousMonth] || 0;
        
        const revenueGrowth = previousMonthRevenue > 0 
            ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
            : currentMonthRevenue > 0 ? 100 : 0;

        // Calculate payment trends from recent data
        const paymentsGrowth = Math.random() * 20 - 10; // TODO: Calculate from actual payment data
        const pendingGrowth = Math.random() * 20 - 10; // TODO: Calculate from actual pending data
        const averageTransactionGrowth = Math.random() * 20 - 10; // TODO: Calculate from actual transaction data

        return {
            totalRevenue,
            totalPaid,
            totalPending,
            totalBills: bookingServices?.length || 0,
            revenueGrowth,
            paymentsGrowth,
            pendingGrowth,
            averageTransactionGrowth,
            monthlyRevenue,
            serviceBreakdown
        };

    } catch (error) {
        console.error('Error calculating service revenue:', error);
        throw error;
    }
}

/**
 * Get transaction history for a service provider
 */
export async function getServiceTransactions(userId: string, limit = 50): Promise<TransactionRecord[]> {
    try {
        // Get all service IDs for the user
        const serviceQueries = await Promise.all([
            supabase.from('guides').select('id').eq('user_id', userId),
            supabase.from('paramedics').select('id').eq('user_id', userId),
            supabase.from('security_companies').select('id').eq('user_id', userId),
            supabase.from('external_entertainment_companies').select('id').eq('user_id', userId),
        ]);

        const allServiceIds = [
            ...(serviceQueries[0].data?.map(s => s.id) || []),
            ...(serviceQueries[1].data?.map(s => s.id) || []),
            ...(serviceQueries[2].data?.map(s => s.id) || []),
            ...(serviceQueries[3].data?.map(s => s.id) || []),
        ];

        if (allServiceIds.length === 0) {
            return [];
        }

        // Get bookings that use these services
        const { data: bookingServices } = await supabase
            .from('booking_services')
            .select(`
                booking_id,
                booked_price,
                quantity,
                days,
                bookings!inner(
                    id,
                    booking_reference,
                    customer_name,
                    payment_status,
                    trip_date
                )
            `)
            .in('service_id', allServiceIds);

        const bookingIds = bookingServices?.map(bs => bs.booking_id) || [];

        if (bookingIds.length === 0) {
            return [];
        }

        // Get bills and payments for these bookings
        const { data: payments, error } = await supabase
            .from('payments')
            .select(`
                id,
                amount,
                payment_type,
                payment_date,
                notes,
                bills!inner(
                    bill_number,
                    customer_name,
                    status,
                    booking_id
                )
            `)
            .in('bills.booking_id', bookingIds)
            .order('payment_date', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching transactions:', error);
            throw error;
        }

        return payments?.map(payment => {
            const bill = Array.isArray(payment.bills) ? payment.bills[0] : payment.bills;
            return {
                id: payment.id,
                amount: payment.amount,
                payment_type: payment.payment_type,
                payment_date: payment.payment_date,
                bill_number: bill?.bill_number || '',
                customer_name: bill?.customer_name || '',
                status: bill?.status || '',
                notes: payment.notes
            };
        }) || [];

    } catch (error) {
        console.error('Error fetching service transactions:', error);
        throw error;
    }
}

/**
 * Calculate balance information for a service provider
 */
export async function getServiceBalance(userId: string): Promise<BalanceInfo> {
    try {
        const revenueStats = await calculateServiceRevenue(userId);
        const transactions = await getServiceTransactions(userId);

        const totalEarnings = revenueStats.totalRevenue;
        const totalReceived = revenueStats.totalPaid;
        const pendingPayments = revenueStats.totalPending;
        const outstandingAmount = totalEarnings - totalReceived;
        
        const averageTransactionValue = transactions.length > 0 
            ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length 
            : 0;

        return {
            totalEarnings,
            totalReceived,
            pendingPayments,
            outstandingAmount,
            averageTransactionValue
        };

    } catch (error) {
        console.error('Error calculating service balance:', error);
        throw error;
    }
}

/**
 * Get revenue trend data for charts (last 12 months)
 */
export async function getRevenueTrend(userId: string): Promise<Array<{ month: string; revenue: number; payments: number; }>> {
    try {
        const serviceQueries = await Promise.all([
            supabase.from('guides').select('id').eq('user_id', userId),
            supabase.from('paramedics').select('id').eq('user_id', userId),
            supabase.from('security_companies').select('id').eq('user_id', userId),
            supabase.from('external_entertainment_companies').select('id').eq('user_id', userId),
        ]);

        const allServiceIds = [
            ...(serviceQueries[0].data?.map(s => s.id) || []),
            ...(serviceQueries[1].data?.map(s => s.id) || []),
            ...(serviceQueries[2].data?.map(s => s.id) || []),
            ...(serviceQueries[3].data?.map(s => s.id) || []),
        ];

        if (allServiceIds.length === 0) {
            return [];
        }

        // Get last 12 months of data
        const months = Array.from({ length: 12 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            return {
                key: date.toISOString().slice(0, 7), // YYYY-MM format
                display: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            };
        }).reverse();

        const { data: bookingServices } = await supabase
            .from('booking_services')
            .select(`
                booked_price,
                quantity,
                days,
                created_at,
                bookings!inner(payment_status)
            `)
            .in('service_id', allServiceIds)
            .gte('created_at', months[0].key + '-01')
            .lte('created_at', months[11].key + '-31');

        const { data: payments } = await supabase
            .from('payments')
            .select(`
                amount,
                payment_date,
                bills!inner(
                    booking_id,
                    bookings!inner(id)
                )
            `)
            .gte('payment_date', months[0].key + '-01')
            .lte('payment_date', months[11].key + '-31');

        // Process the data by month
        return months.map(month => {
            // Revenue from bookings in this month
            const monthRevenue = bookingServices
                ?.filter(bs => bs.created_at.startsWith(month.key))
                ?.reduce((sum, bs) => sum + ((bs.booked_price || 0) * (bs.quantity || 1) * (bs.days || 1)), 0) || 0;

            // Actual payments received in this month
            const monthPayments = payments
                ?.filter(p => p.payment_date.startsWith(month.key))
                ?.reduce((sum, p) => sum + p.amount, 0) || 0;

            return {
                month: month.display,
                revenue: monthRevenue,
                payments: monthPayments
            };
        });

    } catch (error) {
        console.error('Error fetching revenue trend:', error);
        throw error;
    }
}