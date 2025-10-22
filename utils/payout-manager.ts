/**
 * Payout Manager Utility
 * Handles creation and management of payout records for service providers
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export type ServiceType = 
    | 'guides' 
    | 'paramedics' 
    | 'security_companies' 
    | 'external_entertainment_companies' 
    | 'travel_companies' 
    | 'education_programs';

export interface BookingService {
    id: string;
    booking_id: string;
    service_type: ServiceType;
    service_id: string;
    quantity: number;
    days: number;
    booked_price: number;
    rate_type: string;
}

export interface PayoutRecord {
    id?: string;
    type: 'booking' | 'payment';
    service_type: ServiceType;
    service_id: string;
    user_id: string;
    service_provider_name: string;
    amount: number;
    payment_method?: string;
    payment_date?: string;
    booking_service_id?: string;
    booking_record_id?: string;
    status: 'pending' | 'paid' | 'cancelled';
    description?: string;
    notes?: string;
    created_by: string;
}

/**
 * Get service provider details from service tables
 */
async function getServiceProviderDetails(serviceType: ServiceType, serviceId: string) {
    const tableMap: Record<ServiceType, string> = {
        guides: 'guides',
        paramedics: 'paramedics',
        security_companies: 'security_companies',
        external_entertainment_companies: 'external_entertainment_companies',
        travel_companies: 'travel_companies',
        education_programs: 'education_programs',
    };

    const table = tableMap[serviceType];
    
    const { data, error } = await supabase
        .from(table)
        .select('id, name, user_id')
        .eq('id', serviceId)
        .single();

    if (error || !data) {
        console.error(`Error fetching ${serviceType} details:`, error);
        return null;
    }

    return {
        name: data.name,
        user_id: data.user_id,
    };
}

/**
 * Create booking-type payout records for all services in a booking
 * Called when a booking is confirmed
 */
export async function createBookingPayoutRecords(
    bookingId: string,
    bookingReference: string,
    confirmedByUserId: string
): Promise<{ success: boolean; records?: PayoutRecord[]; error?: string }> {
    try {
        // Fetch all booking services
        const { data: bookingServices, error: servicesError } = await supabase
            .from('booking_services')
            .select('*')
            .eq('booking_id', bookingId);

        if (servicesError) {
            console.error('Error fetching booking services:', servicesError);
            return { success: false, error: servicesError.message };
        }

        if (!bookingServices || bookingServices.length === 0) {
            return { success: true, records: [] }; // No services to create payouts for
        }

        // Check if payout records already exist for this booking
        const { data: existingPayouts } = await supabase
            .from('payouts')
            .select('booking_service_id')
            .eq('type', 'booking')
            .in('booking_service_id', bookingServices.map(s => s.id));

        const existingServiceIds = new Set(existingPayouts?.map(p => p.booking_service_id) || []);

        // Create payout records for each service
        const payoutRecords: PayoutRecord[] = [];

        for (const service of bookingServices) {
            // Skip if payout record already exists
            if (existingServiceIds.has(service.id)) {
                console.log(`Payout record already exists for booking service ${service.id}, skipping...`);
                continue;
            }

            // Get service provider details
            const providerDetails = await getServiceProviderDetails(service.service_type, service.service_id);

            if (!providerDetails) {
                console.error(`Could not fetch provider details for ${service.service_type} ${service.service_id}`);
                continue;
            }

            // Calculate total amount (quantity × days × booked_price)
            const totalAmount = service.quantity * service.days * service.booked_price;

            const payoutRecord: PayoutRecord = {
                type: 'booking',
                service_type: service.service_type,
                service_id: service.service_id,
                user_id: providerDetails.user_id,
                service_provider_name: providerDetails.name,
                amount: totalAmount,
                booking_service_id: service.id,
                status: 'pending',
                description: `Booking ${bookingReference} - ${service.service_type} service`,
                notes: `Quantity: ${service.quantity}, Days: ${service.days}, Rate: ₪${service.booked_price}`,
                created_by: confirmedByUserId,
                payment_method: 'bank_transfer', // Default, will be updated when payment is made
                payment_date: new Date().toISOString().split('T')[0],
            };

            payoutRecords.push(payoutRecord);
        }

        if (payoutRecords.length === 0) {
            console.log('No new payout records to create');
            return { success: true, records: [] };
        }

        // Insert payout records
        const { data: insertedPayouts, error: insertError } = await supabase
            .from('payouts')
            .insert(payoutRecords)
            .select();

        if (insertError) {
            console.error('Error inserting payout records:', insertError);
            return { success: false, error: insertError.message };
        }

        console.log(`✅ Created ${insertedPayouts?.length || 0} booking payout records for booking ${bookingReference}`);
        return { success: true, records: insertedPayouts as PayoutRecord[] };
    } catch (error) {
        console.error('Error creating booking payout records:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Create a payment record from a booking record
 * Called when admin makes payment for a booking payout
 */
export async function createPaymentFromBookingRecord(
    bookingRecordId: string,
    paymentDetails: {
        payment_method: string;
        payment_date: string;
        account_number?: string;
        account_holder_name?: string;
        bank_name?: string;
        transaction_number?: string;
        reference_number?: string;
        check_number?: string;
        check_bank_name?: string;
        notes?: string;
    },
    createdByUserId: string
): Promise<{ success: boolean; payment?: PayoutRecord; error?: string }> {
    try {
        // Fetch the booking record
        const { data: bookingRecord, error: fetchError } = await supabase
            .from('payouts')
            .select('*')
            .eq('id', bookingRecordId)
            .eq('type', 'booking')
            .single();

        if (fetchError || !bookingRecord) {
            console.error('Error fetching booking record:', fetchError);
            return { success: false, error: 'Booking record not found' };
        }

        // Check if payment already exists for this booking record
        const { data: existingPayment } = await supabase
            .from('payouts')
            .select('id')
            .eq('booking_record_id', bookingRecordId)
            .eq('type', 'payment')
            .single();

        if (existingPayment) {
            return { success: false, error: 'Payment already exists for this booking record' };
        }

        // Create payment record
        const paymentRecord: any = {
            type: 'payment',
            service_type: bookingRecord.service_type,
            service_id: bookingRecord.service_id,
            user_id: bookingRecord.user_id,
            service_provider_name: bookingRecord.service_provider_name,
            amount: bookingRecord.amount,
            payment_method: paymentDetails.payment_method,
            payment_date: paymentDetails.payment_date,
            booking_service_id: bookingRecord.booking_service_id,
            booking_record_id: bookingRecordId,
            status: 'paid',
            description: bookingRecord.description,
            notes: paymentDetails.notes || bookingRecord.notes,
            created_by: createdByUserId,
            // Payment method specific fields
            account_number: paymentDetails.account_number,
            account_holder_name: paymentDetails.account_holder_name,
            bank_name: paymentDetails.bank_name,
            transaction_number: paymentDetails.transaction_number,
            reference_number: paymentDetails.reference_number,
            check_number: paymentDetails.check_number,
            check_bank_name: paymentDetails.check_bank_name,
        };

        // Insert payment record
        const { data: insertedPayment, error: insertError } = await supabase
            .from('payouts')
            .insert([paymentRecord])
            .select()
            .single();

        if (insertError) {
            console.error('Error creating payment record:', insertError);
            return { success: false, error: insertError.message };
        }

        // Update booking record status to 'paid'
        const { error: updateError } = await supabase
            .from('payouts')
            .update({ status: 'paid' })
            .eq('id', bookingRecordId);

        if (updateError) {
            console.error('Error updating booking record status:', updateError);
            // Don't fail the operation, just log the error
        }

        console.log(`✅ Created payment record for booking payout ${bookingRecordId}`);
        return { success: true, payment: insertedPayment as PayoutRecord };
    } catch (error) {
        console.error('Error creating payment from booking record:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Check if booking already has payout records
 */
export async function checkBookingHasPayouts(bookingId: string): Promise<boolean> {
    const { data: bookingServices } = await supabase
        .from('booking_services')
        .select('id')
        .eq('booking_id', bookingId);

    if (!bookingServices || bookingServices.length === 0) {
        return false;
    }

    const { data: payouts } = await supabase
        .from('payouts')
        .select('id')
        .eq('type', 'booking')
        .in('booking_service_id', bookingServices.map(s => s.id))
        .limit(1);

    return (payouts?.length || 0) > 0;
}
