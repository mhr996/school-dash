import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendBookingNotificationToService, BookingNotificationData } from '@/utils/booking-notifications';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * API Route: Send booking notifications to all services in a booking
 * POST /api/bookings/[id]/notify-services
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const bookingId = params.id;

        // Fetch booking details
        const { data: booking, error: bookingError } = await supabaseAdmin
            .from('bookings')
            .select(`
                id,
                booking_reference,
                trip_date,
                destinations (
                    name
                )
            `)
            .eq('id', bookingId)
            .single();

        if (bookingError || !booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Fetch all booking services
        const { data: bookingServices, error: servicesError } = await supabaseAdmin
            .from('booking_services')
            .select('*')
            .eq('booking_id', bookingId);

        if (servicesError || !bookingServices) {
            return NextResponse.json({ error: 'Services not found' }, { status: 404 });
        }

        const destinationName = (booking.destinations as any)?.name || '';
        const notifications: Promise<any>[] = [];

        // Send email to each service
        for (const service of bookingServices) {
            const serviceData = await getServiceDetails(service.service_type, service.service_id);

            if (serviceData && serviceData.email) {
                const notificationData: BookingNotificationData = {
                    bookingId: booking.id,
                    bookingReference: booking.booking_reference,
                    serviceType: service.service_type,
                    serviceName: serviceData.name,
                    serviceEmail: serviceData.email,
                    tripDate: booking.trip_date,
                    destination: destinationName,
                    bookedPrice: service.booked_price,
                    quantity: service.quantity,
                    days: service.days,
                    bookingServiceId: service.id,
                };

                notifications.push(sendBookingNotificationToService(notificationData));
            }
        }

        const results = await Promise.allSettled(notifications);
        const successCount = results.filter((r) => r.status === 'fulfilled').length;

        return NextResponse.json({
            success: true,
            message: `Sent ${successCount} of ${bookingServices.length} notifications`,
            results,
        });
    } catch (error) {
        console.error('Error in notify-services:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

async function getServiceDetails(serviceType: string, serviceId: string) {
    let tableName = '';

    switch (serviceType) {
        case 'guides':
            tableName = 'guides';
            break;
        case 'paramedics':
            tableName = 'paramedics';
            break;
        case 'security_companies':
            tableName = 'security_companies';
            break;
        case 'external_entertainment_companies':
            tableName = 'external_entertainment_companies';
            break;
        case 'travel_companies':
            tableName = 'travel_companies';
            break;
        default:
            return null;
    }

    const { data } = await supabaseAdmin.from(tableName).select('name, email').eq('id', serviceId).single();

    return data;
}
