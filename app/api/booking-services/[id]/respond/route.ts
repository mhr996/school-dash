import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendBookingConfirmationToCustomer } from '@/utils/booking-notifications';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * API Route: Accept or reject a booking service
 * POST /api/booking-services/[id]/respond
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const bookingServiceId = params.id;
        const body = await request.json();
        const { action, reason, userId } = body; // action: 'accept' or 'reject'

        if (!['accept', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Update booking service status
        const updateData: any = {
            acceptance_status: action === 'accept' ? 'accepted' : 'rejected',
            responded_by: userId,
        };

        if (action === 'accept') {
            updateData.accepted_at = new Date().toISOString();
        } else {
            updateData.rejected_at = new Date().toISOString();
            if (reason) {
                updateData.rejection_reason = reason;
            }
        }

        const { data: updatedService, error: updateError } = await supabaseAdmin
            .from('booking_services')
            .update(updateData)
            .eq('id', bookingServiceId)
            .select('booking_id')
            .single();

        if (updateError || !updatedService) {
            return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
        }

        // Check if all services have responded and all accepted
        const { data: allServices } = await supabaseAdmin
            .from('booking_services')
            .select('acceptance_status')
            .eq('booking_id', updatedService.booking_id);

        if (allServices) {
            const allAccepted = allServices.every((s) => s.acceptance_status === 'accepted');
            const allResponded = allServices.every((s) => s.acceptance_status !== 'pending');

            // If all services accepted, send confirmation email to customer
            if (allAccepted && allResponded) {
                const { data: booking } = await supabaseAdmin
                    .from('bookings')
                    .select('customer_id, users!bookings_customer_id_fkey(email)')
                    .eq('id', updatedService.booking_id)
                    .single();

                if (booking && (booking.users as any)?.email) {
                    await sendBookingConfirmationToCustomer(
                        updatedService.booking_id,
                        (booking.users as any).email
                    );
                }
            }
        }

        return NextResponse.json({
            success: true,
            action,
            message: action === 'accept' ? 'Booking accepted successfully' : 'Booking rejected successfully',
        });
    } catch (error) {
        console.error('Error in respond:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
