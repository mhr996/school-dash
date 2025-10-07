/**
 * Service Provider Balance Manager
 * 
 * Calculates balances for service providers (guides, paramedics, security, entertainment, travel companies)
 * based on booking assignments and payouts made.
 * 
 * Balance Calculation:
 * - Positive Balance = Platform owes the service provider
 * - Negative Balance = Service provider owes the platform (rare case)
 * 
 * Formula: Total Earned from Bookings - Total Payouts Received = Net Balance
 */

import supabase from '@/lib/supabase';

// Service types
export type ServiceType = 
    | 'guides' 
    | 'paramedics' 
    | 'security_companies' 
    | 'external_entertainment_companies' 
    | 'travel_companies';

// Service provider details with balance
export interface ServiceProviderBalance {
    serviceType: ServiceType;
    serviceId: string;
    userId: string | null;
    providerName: string;
    email?: string;
    phone?: string;
    totalEarned: number;      // Sum of booked_price from booking_services
    totalPaidOut: number;     // Sum of payout amounts
    netBalance: number;       // totalEarned - totalPaidOut
    bookingCount: number;     // Number of bookings assigned
    payoutCount: number;      // Number of payouts received
    lastBookingDate: string | null;
    lastPayoutDate: string | null;
}

// Booking service details
export interface ServiceBooking {
    id: string;
    bookingId: string;
    bookingReference: string;
    tripDate: string;
    quantity: number;
    days: number;
    bookedPrice: number;
    totalAmount: number; // quantity * days * bookedPrice
    bookingStatus: string;
}

// Payout details
export interface ServicePayout {
    id: string;
    amount: number;
    paymentMethod: string;
    paymentDate: string;
    referenceNumber: string | null;
    description: string | null;
    notes: string | null;
    createdBy: string;
    createdByName?: string;
}

/**
 * Get the table name for a service type
 */
const getServiceTableName = (serviceType: ServiceType): string => {
    return serviceType;
};

/**
 * Calculate balance for a specific service provider
 */
export const calculateServiceProviderBalance = async (
    serviceType: ServiceType,
    serviceId: string
): Promise<ServiceProviderBalance | null> => {
    try {
        // 1. Fetch service provider details
        const tableName = getServiceTableName(serviceType);
        const { data: serviceProvider, error: serviceError } = await supabase
            .from(tableName)
            .select('id, name, email, phone, user_id')
            .eq('id', serviceId)
            .single();

        if (serviceError || !serviceProvider) {
            console.error(`Error fetching ${serviceType} provider:`, serviceError);
            return null;
        }

        // 2. Fetch all booking_services for this provider (only confirmed/completed bookings)
        const { data: bookingServices, error: bookingError } = await supabase
            .from('booking_services')
            .select(`
                id,
                booking_id,
                quantity,
                days,
                booked_price,
                bookings!inner (
                    id,
                    booking_reference,
                    trip_date,
                    status
                )
            `)
            .eq('service_type', serviceType)
            .eq('service_id', serviceId)
            .in('bookings.status', ['confirmed', 'completed']);

        if (bookingError) {
            console.error('Error fetching booking services:', bookingError);
            return null;
        }

        // 3. Calculate total earned from bookings
        const bookings = (bookingServices || []) as any[];
        const totalEarned = bookings.reduce((sum, bs) => {
            const amount = (bs.booked_price || 0) * (bs.quantity || 1) * (bs.days || 1);
            return sum + amount;
        }, 0);

        // Get last booking date
        const lastBookingDate = bookings.length > 0
            ? bookings.sort((a: any, b: any) => 
                new Date(b.bookings[0]?.trip_date || 0).getTime() - new Date(a.bookings[0]?.trip_date || 0).getTime()
              )[0]?.bookings[0]?.trip_date
            : null;

        // 4. Fetch all payouts for this provider
        const { data: payouts, error: payoutError } = await supabase
            .from('payouts')
            .select('id, amount, payment_date')
            .eq('service_type', serviceType)
            .eq('service_id', serviceId);

        if (payoutError) {
            console.error('Error fetching payouts:', payoutError);
            return null;
        }

        // 5. Calculate total paid out
        const payoutList = payouts || [];
        const totalPaidOut = payoutList.reduce((sum, payout) => sum + (payout.amount || 0), 0);

        // Get last payout date
        const lastPayoutDate = payoutList.length > 0
            ? payoutList.sort((a, b) => 
                new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
              )[0]?.payment_date
            : null;

        // 6. Calculate net balance
        const netBalance = totalEarned - totalPaidOut;

        return {
            serviceType,
            serviceId,
            userId: serviceProvider.user_id,
            providerName: serviceProvider.name,
            email: serviceProvider.email,
            phone: serviceProvider.phone,
            totalEarned,
            totalPaidOut,
            netBalance,
            bookingCount: bookings.length,
            payoutCount: payoutList.length,
            lastBookingDate,
            lastPayoutDate,
        };
    } catch (error) {
        console.error('Error calculating service provider balance:', error);
        return null;
    }
};

/**
 * Get all service providers of a specific type with their balances
 */
export const getAllServiceProvidersWithBalance = async (
    serviceType: ServiceType
): Promise<ServiceProviderBalance[]> => {
    try {
        const tableName = getServiceTableName(serviceType);
        
        // Fetch all active service providers of this type
        const { data: providers, error: providersError } = await supabase
            .from(tableName)
            .select('id, name, email, phone, user_id, status')
            .eq('status', 'active');

        if (providersError) {
            console.error(`Error fetching ${serviceType}:`, providersError);
            return [];
        }

        if (!providers || providers.length === 0) {
            return [];
        }

        // Calculate balance for each provider
        const balances = await Promise.all(
            providers.map(provider => 
                calculateServiceProviderBalance(serviceType, provider.id)
            )
        );

        // Filter out null results and return
        return balances.filter((balance): balance is ServiceProviderBalance => balance !== null);
    } catch (error) {
        console.error('Error getting all service providers with balance:', error);
        return [];
    }
};

/**
 * Get detailed booking history for a service provider
 */
export const getServiceProviderBookings = async (
    serviceType: ServiceType,
    serviceId: string
): Promise<ServiceBooking[]> => {
    try {
        const { data: bookingServices, error } = await supabase
            .from('booking_services')
            .select(`
                id,
                booking_id,
                quantity,
                days,
                booked_price,
                bookings!inner (
                    id,
                    booking_reference,
                    trip_date,
                    status
                )
            `)
            .eq('service_type', serviceType)
            .eq('service_id', serviceId)
            .in('bookings.status', ['confirmed', 'completed'])
            .order('bookings.trip_date', { ascending: false });

        if (error) {
            console.error('Error fetching booking history:', error);
            return [];
        }

        return ((bookingServices || []) as any[]).map((bs: any) => {
            const booking = Array.isArray(bs.bookings) ? bs.bookings[0] : bs.bookings;
            return {
                id: bs.id,
                bookingId: bs.booking_id,
                bookingReference: booking?.booking_reference || '',
                tripDate: booking?.trip_date || '',
                quantity: bs.quantity,
                days: bs.days,
                bookedPrice: bs.booked_price,
                totalAmount: bs.booked_price * bs.quantity * bs.days,
                bookingStatus: booking?.status || '',
            };
        });
    } catch (error) {
        console.error('Error getting service provider bookings:', error);
        return [];
    }
};

/**
 * Get payout history for a service provider
 */
export const getServiceProviderPayouts = async (
    serviceType: ServiceType,
    serviceId: string
): Promise<ServicePayout[]> => {
    try {
        const { data: payouts, error } = await supabase
            .from('payouts')
            .select(`
                id,
                amount,
                payment_method,
                payment_date,
                reference_number,
                description,
                notes,
                created_by,
                users!payouts_created_by_fkey (
                    full_name
                )
            `)
            .eq('service_type', serviceType)
            .eq('service_id', serviceId)
            .order('payment_date', { ascending: false });

        if (error) {
            console.error('Error fetching payout history:', error);
            return [];
        }

        return ((payouts || []) as any[]).map((payout: any) => {
            const user = Array.isArray(payout.users) ? payout.users[0] : payout.users;
            return {
                id: payout.id,
                amount: payout.amount,
                paymentMethod: payout.payment_method,
                paymentDate: payout.payment_date,
                referenceNumber: payout.reference_number,
                description: payout.description,
                notes: payout.notes,
                createdBy: payout.created_by,
                createdByName: user?.full_name,
            };
        });
    } catch (error) {
        console.error('Error getting service provider payouts:', error);
        return [];
    }
};

/**
 * Get balance summary across all service types
 */
export const getAllServicesBalanceSummary = async (): Promise<{
    totalOwed: number;
    byServiceType: Record<ServiceType, { totalOwed: number; providerCount: number }>;
}> => {
    try {
        const serviceTypes: ServiceType[] = [
            'guides',
            'paramedics',
            'security_companies',
            'external_entertainment_companies',
            'travel_companies',
        ];

        const summaryByType: Record<ServiceType, { totalOwed: number; providerCount: number }> = {} as any;
        let totalOwed = 0;

        for (const serviceType of serviceTypes) {
            const providers = await getAllServiceProvidersWithBalance(serviceType);
            const typeOwed = providers.reduce((sum, p) => sum + Math.max(0, p.netBalance), 0);
            
            summaryByType[serviceType] = {
                totalOwed: typeOwed,
                providerCount: providers.filter(p => p.netBalance > 0).length,
            };
            
            totalOwed += typeOwed;
        }

        return {
            totalOwed,
            byServiceType: summaryByType,
        };
    } catch (error) {
        console.error('Error getting balance summary:', error);
        return {
            totalOwed: 0,
            byServiceType: {} as any,
        };
    }
};
