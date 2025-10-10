import supabase from '@/lib/supabase';

interface BookingData {
    id: string;
    booking_reference: string;
    customer_name: string;
    customer_email?: string;
    customer_phone?: string;
    total_amount: number;
    services: Array<{
        type: string;
        name: string;
        quantity: number;
        days: number;
        cost: number;
    }>;
}

/**
 * Generates a tax invoice for a booking when it's confirmed
 */
export const generateTaxInvoiceForBooking = async (bookingData: BookingData): Promise<{ success: boolean; bill?: any; error?: string }> => {
    try {

        // Generate bill number
        const { data: billNumber, error: billNumberError } = await supabase.rpc('generate_bill_number', {
            bill_type_param: 'tax_invoice'
        });

        if (billNumberError) {
            return { success: false, error: 'Failed to generate bill number' };
        }

       
        const taxRate = 18.00;
        const subtotal = bookingData.total_amount;
        const taxAmount = (subtotal * taxRate) / 100;
        const totalAmount = subtotal + taxAmount;


        // Create tax invoice
        const billData = {
            bill_number: billNumber,
            bill_type: 'tax_invoice',
            booking_id: bookingData.id,
            customer_name: bookingData.customer_name,
            customer_email: bookingData.customer_email,
            customer_phone: bookingData.customer_phone,
            subtotal: subtotal,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            tax_rate: taxRate,
            status: 'issued',
            issue_date: new Date().toISOString().split('T')[0],
            due_date: null, // No due date for tax invoices
            description: `Tax Invoice for Booking ${bookingData.booking_reference}`,
            auto_generated: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        console.log('📄 Bill data to insert:', billData);

        const { data: bill, error: billError } = await supabase
            .from('bills')
            .insert([billData])
            .select()
            .single();

        console.log('💾 Bill creation result:', { bill, billError });

        if (billError) {
            console.error('❌ Error creating bill:', billError);
            return { success: false, error: 'Failed to create tax invoice' };
        }

        console.log('✅ Bill created successfully:', bill);

        // Tax invoice is complete - services are referenced from the booking, no need to duplicate data
        console.log('🎉 Tax invoice generation completed successfully!');
        return { success: true, bill };

    } catch (error) {
        console.error('Unexpected error generating tax invoice:', error);
        return { success: false, error: 'Unexpected error occurred' };
    }
};

/**
 * Checks if a tax invoice already exists for a booking
 */
export const checkExistingTaxInvoice = async (bookingId: string): Promise<{ exists: boolean; bill?: any }> => {
    try {
        console.log('🔍 Checking for existing tax invoice for booking:', bookingId);
        
        const { data, error } = await supabase
            .from('bills')
            .select('*')
            .eq('booking_id', bookingId)
            .eq('bill_type', 'tax_invoice')
            .single();

        console.log('🔍 Existing tax invoice check result:', { data, error });

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('❌ Error checking existing tax invoice:', error);
            return { exists: false };
        }

        const exists = !!data;
        console.log('🔍 Final result - tax invoice exists:', exists);
        
        return { exists, bill: data };
    } catch (error) {
        console.error('❌ Unexpected error checking tax invoice:', error);
        return { exists: false };
    }
};
