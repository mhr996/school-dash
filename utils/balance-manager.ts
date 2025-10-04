import supabase from '@/lib/supabase';

interface BalanceTransaction {
    customerId: string;
    amount: number; // Positive for credits, negative for debits
    type: 'deal_created' | 'deal_deleted' | 'receipt_created' | 'receipt_deleted';
    referenceId: string; // Deal ID or Bill ID
    description: string;
}

/**
 * Updates customer balance and logs the transaction
 */
export const updateCustomerBalance = async (transaction: BalanceTransaction): Promise<boolean> => {
    try {
        // Start a transaction to ensure data consistency
        const { data: customer, error: fetchError } = await supabase.from('customers').select('balance').eq('id', transaction.customerId).single();

        if (fetchError) {
            console.error('Error fetching customer balance:', fetchError);
            return false;
        }

        const currentBalance = customer.balance || 0;
        const newBalance = currentBalance + transaction.amount;

        // Update customer balance
        const { error: updateError } = await supabase.from('customers').update({ balance: newBalance }).eq('id', transaction.customerId);

        if (updateError) {
            console.error('Error updating customer balance:', updateError);
            return false;
        }

        // Log the transaction (we'll create this table if it doesn't exist)
        try {
            await supabase.from('customer_transactions').insert({
                customer_id: transaction.customerId,
                type: transaction.type,
                amount: transaction.amount,
                balance_before: currentBalance,
                balance_after: newBalance,
                reference_id: transaction.referenceId,
                description: transaction.description,
                created_at: new Date().toISOString(),
            });
        } catch (logError) {
            console.warn('Could not log transaction (table may not exist):', logError);
            // Don't fail the balance update if logging fails
        }

        console.log(`Balance updated for customer ${transaction.customerId}: ${currentBalance} -> ${newBalance}`);
        return true;
    } catch (error) {
        console.error('Error in updateCustomerBalance:', error);
        return false;
    }
};

/**
 * Handles balance update when a deal is created
 * Updated to use selling_price instead of deal amount
 */
export const handleDealCreated = async (dealId: string, customerId: string, dealSellingPrice: number, dealTitle: string): Promise<boolean> => {
    return await updateCustomerBalance({
        customerId,
        amount: -dealSellingPrice, // Negative because deal selling price is what customer owes
        type: 'deal_created',
        referenceId: dealId,
        description: `Deal created: ${dealTitle} (₪${dealSellingPrice})`,
    });
};

/**
 * Handles balance update when a deal is deleted
 * Updated to use selling_price instead of deal amount
 */
export const handleDealDeleted = async (dealId: string, customerId: string, dealSellingPrice: number, dealTitle: string): Promise<boolean> => {
    return await updateCustomerBalance({
        customerId,
        amount: dealSellingPrice, // Positive because we're reversing the deduction
        type: 'deal_deleted',
        referenceId: dealId,
        description: `Deal deleted: ${dealTitle} (₪${dealSellingPrice})`,
    });
};

/**
 * Calculates total payment amount from a bill's payment fields or payments array
 */
export const calculateTotalPaymentAmount = (bill: any, payments?: any[]): number => {
    console.log('=== CALCULATE TOTAL PAYMENT AMOUNT DEBUG ===');
    console.log('Bill Type:', bill.bill_type);
    console.log('Bill Direction:', bill.bill_direction);
    console.log('Payments Array:', payments);
    console.log('Bill Amount (bill_amount):', bill.bill_amount);

    // If payments array is provided (new multiple payments structure), use that
    if (payments && payments.length > 0) {
        console.log('Using payments array logic');
        const totalAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

        // Apply bill direction: negative bills should have negative amounts
        if (bill.bill_direction === 'negative') {
            console.log('Calculated Amount (negative):', -Math.abs(totalAmount));
            return -Math.abs(totalAmount);
        } else {
            console.log('Calculated Amount (positive):', Math.abs(totalAmount));
            return Math.abs(totalAmount); // Ensure positive for positive bills
        }
    }

    // Otherwise, use legacy payment fields
    console.log('Using legacy payment fields logic');
    const visaAmount = parseFloat(bill.visa_amount || '0') || 0;
    const transferAmount = parseFloat(bill.transfer_amount || '0') || 0;
    const checkAmount = parseFloat(bill.check_amount || '0') || 0;
    const cashAmount = parseFloat(bill.cash_amount || '0') || 0;
    const bankAmount = parseFloat(bill.bank_amount || '0') || 0;
    const billAmount = parseFloat(bill.bill_amount || '0') || 0; // For general bills

    console.log('Legacy amounts - Visa:', visaAmount, 'Transfer:', transferAmount, 'Check:', checkAmount, 'Cash:', cashAmount, 'Bank:', bankAmount, 'Bill:', billAmount);

    let totalAmount = visaAmount + transferAmount + checkAmount + cashAmount + bankAmount + billAmount;

    // Apply bill direction: negative bills should have negative amounts
    if (bill.bill_direction === 'negative') {
        totalAmount = -Math.abs(totalAmount);
        console.log('Final Amount (negative):', totalAmount);
    } else {
        totalAmount = Math.abs(totalAmount); // Ensure positive for positive bills
        console.log('Final Amount (positive):', totalAmount);
    }

    console.log('=== END CALCULATE TOTAL PAYMENT AMOUNT DEBUG ===');
    return totalAmount;
};

/**
 * Handles balance update when a receipt/bill is created
 * Updated to compare against selling_price and handle excess payments
 * For exchange deals, also accounts for customer car evaluation value
 */
export const handleReceiptCreated = async (billId: string, customerId: string, bill: any, customerName: string, dealSellingPrice?: number, payments?: any[], deal?: any): Promise<boolean> => {
    const paymentAmount = calculateTotalPaymentAmount(bill, payments);

    console.log('=== BALANCE UPDATE DEBUG ===');
    console.log('Bill ID:', billId);
    console.log('Customer ID:', customerId);
    console.log('Customer Name:', customerName);
    console.log('Deal Selling Price:', dealSellingPrice);
    console.log('Deal Type:', deal?.deal_type);
    console.log('Payments:', payments);
    console.log('Bill Data:', bill);
    console.log('Calculated Payment Amount:', paymentAmount);

    if (paymentAmount === 0) {
        console.log('No payment amount to process for receipt:', billId);
        return true; // Not an error, just no payment to process
    }

    let balanceChangeAmount = paymentAmount;
    let description = '';

    // For negative bills (expenses/deductions)
    if (bill.bill_direction === 'negative') {
        description = `Expense/Deduction for ${customerName}: ${getPaymentDescription(bill, payments)}`;
        balanceChangeAmount = -Math.abs(paymentAmount); // Negative impact on balance
    } else {
        // For positive bills (payments)
        let effectiveDealAmount = dealSellingPrice || 0;

        // For exchange deals, reduce the effective deal amount by the customer car evaluation
        if (deal?.deal_type === 'exchange' && deal?.customer_car_eval_value) {
            const carEvaluationAmount = parseFloat(deal.customer_car_eval_value) || 0;
            effectiveDealAmount = Math.max(0, effectiveDealAmount - carEvaluationAmount);
            console.log('Exchange deal detected. Car evaluation:', carEvaluationAmount, 'Effective deal amount:', effectiveDealAmount);
        }

        if (effectiveDealAmount > 0) {
            // Payment towards a deal with an effective selling price
            if (paymentAmount <= effectiveDealAmount) {
                // Payment doesn't exceed effective deal amount - normal case
                description = `Payment received from ${customerName}: ${getPaymentDescription(bill, payments)} (towards deal)`;
                balanceChangeAmount = paymentAmount; // Positive impact on balance
            } else {
                // Payment exceeds effective deal amount - add excess to customer balance
                const excessAmount = paymentAmount - effectiveDealAmount;
                description = `Payment received from ${customerName}: ${getPaymentDescription(bill, payments)} (₪${effectiveDealAmount} for deal + ₪${excessAmount} excess)`;
                balanceChangeAmount = paymentAmount; // Full payment amount goes to balance
            }
        } else {
            // General payment not related to a deal selling price, or exchange deal fully covered by car value
            const dealNote = deal?.deal_type === 'exchange' ? ' (exchange deal - car value credited)' : '';
            description = `Payment received from ${customerName}: ${getPaymentDescription(bill, payments)}${dealNote}`;
            balanceChangeAmount = paymentAmount; // Full payment amount goes to balance as credit
        }
    }

    console.log('Balance Change Amount:', balanceChangeAmount);
    console.log('Description:', description);
    console.log('=== END DEBUG ===');

    return await updateCustomerBalance({
        customerId,
        amount: balanceChangeAmount,
        type: 'receipt_created',
        referenceId: billId,
        description,
    });
};

/**
 * Handles balance update when a receipt/bill is deleted
 * Updated to reverse the selling_price-aware payment logic
 */
export const handleReceiptDeleted = async (billId: string, customerId: string, bill: any, customerName: string, dealSellingPrice?: number, payments?: any[]): Promise<boolean> => {
    const paymentAmount = calculateTotalPaymentAmount(bill, payments);

    if (paymentAmount === 0) {
        console.log('No payment amount to reverse for deleted receipt:', billId);
        return true; // Not an error, just no payment to reverse
    }

    let balanceChangeAmount = -paymentAmount; // Reverse the original amount
    let description = '';

    // For negative bills (expenses/deductions) - reverse the deduction
    if (bill.bill_direction === 'negative') {
        description = `Reversed expense/deduction for ${customerName}: ${getPaymentDescription(bill, payments)}`;
        balanceChangeAmount = Math.abs(paymentAmount); // Positive impact (reversing a deduction)
    } else {
        // For positive bills (payments) - reverse the payment
        if (dealSellingPrice && dealSellingPrice > 0) {
            // Reversing payment towards a deal with a selling price
            if (paymentAmount <= dealSellingPrice) {
                description = `Reversed payment from ${customerName}: ${getPaymentDescription(bill, payments)} (was towards deal)`;
            } else {
                const excessAmount = paymentAmount - dealSellingPrice;
                description = `Reversed payment from ${customerName}: ${getPaymentDescription(bill, payments)} (was ₪${dealSellingPrice} for deal + ₪${excessAmount} excess)`;
            }
        } else {
            description = `Reversed payment from ${customerName}: ${getPaymentDescription(bill, payments)}`;
        }
        balanceChangeAmount = -paymentAmount; // Negative impact (reversing a payment)
    }

    return await updateCustomerBalance({
        customerId,
        amount: balanceChangeAmount,
        type: 'receipt_deleted',
        referenceId: billId,
        description,
    });
};

/**
 * Helper function to create a readable payment description
 */
const getPaymentDescription = (bill: any, payments?: any[]): string => {
    const descriptions: string[] = [];

    // If payments array is provided (new multiple payments structure), use that
    if (payments && payments.length > 0) {
        payments.forEach((payment) => {
            if (payment.amount && payment.amount > 0) {
                const type = payment.payment_type;
                descriptions.push(`${type}: ₪${payment.amount}`);
            }
        });
        return descriptions.join(', ') || 'Payment';
    }

    // Otherwise, use legacy payment fields
    if (bill.visa_amount && parseFloat(bill.visa_amount) > 0) {
        descriptions.push(`Visa: ₪${bill.visa_amount}`);
    }
    if (bill.transfer_amount && parseFloat(bill.transfer_amount) > 0) {
        descriptions.push(`Transfer: ₪${bill.transfer_amount}`);
    }
    if (bill.check_amount && parseFloat(bill.check_amount) > 0) {
        descriptions.push(`Check: ₪${bill.check_amount}`);
    }
    if (bill.cash_amount && parseFloat(bill.cash_amount) > 0) {
        descriptions.push(`Cash: ₪${bill.cash_amount}`);
    }
    if (bill.bank_amount && parseFloat(bill.bank_amount) > 0) {
        descriptions.push(`Bank: ₪${bill.bank_amount}`);
    }

    return descriptions.join(', ') || 'Payment';
};

/**
 * Gets customer ID from a deal, handling different deal types
 */
export const getCustomerIdFromDeal = (deal: any): string | null => {
    // For regular deals, use customer_id
    if (deal.customer_id) {
        return deal.customer_id.toString();
    }

    // For intermediary deals, use seller_id as the primary customer for balance tracking
    // If seller_id is not available, fall back to buyer_id
    if (deal.deal_type === 'intermediary') {
        if (deal.seller_id) {
            return deal.seller_id.toString();
        } else if (deal.buyer_id) {
            return deal.buyer_id.toString();
        }
    }

    return null;
};

/**
 * Get customer ID by customer name for general bills
 */
export const getCustomerIdByName = async (customerName: string): Promise<string | null> => {
    try {
        const { data, error } = await supabase.from('customers').select('id').eq('name', customerName).single();

        if (error) {
            console.warn('Customer not found by name:', customerName, error);
            return null;
        }

        return data.id.toString();
    } catch (error) {
        console.error('Error finding customer by name:', error);
        return null;
    }
};

/**
 * Handles balance update for exchange deals - adds customer car evaluation value as credit
 */
export const handleExchangeDealCustomerCarCredit = async (dealId: string, customerId: string, carEvaluationAmount: number, customerName: string): Promise<boolean> => {
    if (carEvaluationAmount <= 0) {
        console.log('No car evaluation amount to process for exchange deal:', dealId);
        return true; // Not an error, just no amount to process
    }

    return await updateCustomerBalance({
        customerId,
        amount: carEvaluationAmount, // Positive because it's a credit to customer for their car
        type: 'deal_created',
        referenceId: dealId,
        description: `Credit for customer car in exchange deal: ${customerName} (₪${carEvaluationAmount})`,
    });
};

// ============================================
// SCHOOL BALANCE MANAGEMENT
// ============================================

export interface SchoolBalanceDetails {
    schoolId: string;
    schoolName: string;
    totalTaxInvoices: number;
    totalReceipts: number;
    netBalance: number;
    taxInvoiceCount: number;
    receiptCount: number;
    bills: SchoolBill[];
}

export interface SchoolBill {
    id: string;
    bill_number: string;
    bill_type: 'tax_invoice' | 'receipt';
    total_amount: number;
    status: string;
    issue_date: string;
    booking_reference: string;
    booking_id: string;
    payments?: Array<{
        id: string;
        amount: number;
        payment_date: string;
        payment_type: string;
    }>;
}

/**
 * Calculate school balance from bills
 * Balance = Total Receipts (payments) - Total Tax Invoices
 * Negative balance means school owes money
 * Positive balance means school has credit/overpaid
 */
export const calculateSchoolBalance = async (schoolId: string): Promise<SchoolBalanceDetails | null> => {
    try {
        // Fetch school info
        const { data: school, error: schoolError } = await supabase
            .from('schools')
            .select('id, name')
            .eq('id', schoolId)
            .single();

        if (schoolError || !school) {
            console.error('Error fetching school:', schoolError);
            return null;
        }

        // Fetch all bills for bookings linked to this school
        const { data: bills, error: billsError } = await supabase
            .from('bills')
            .select(`
                id,
                bill_number,
                bill_type,
                total_amount,
                status,
                issue_date,
                booking_id,
                bookings!bills_booking_id_fkey(
                    booking_reference,
                    school_id
                ),
                payments(
                    id,
                    amount,
                    payment_date,
                    payment_type
                )
            `)
            .eq('bookings.school_id', schoolId)
            .order('issue_date', { ascending: false });

        if (billsError) {
            console.error('Error fetching bills:', billsError);
            return null;
        }

        // Filter bills that have a valid booking with matching school_id
        const schoolBills = (bills || []).filter((bill: any) => bill.bookings?.school_id === schoolId);

        let totalTaxInvoices = 0;
        let totalReceipts = 0;
        let taxInvoiceCount = 0;
        let receiptCount = 0;

        const formattedBills: SchoolBill[] = schoolBills.map((bill: any) => {
            if (bill.bill_type === 'tax_invoice') {
                totalTaxInvoices += bill.total_amount || 0;
                taxInvoiceCount++;
            } else if (bill.bill_type === 'receipt') {
                // For receipts, sum up actual payments instead of using total_amount
                const receiptTotal = (bill.payments || []).reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0);
                totalReceipts += receiptTotal;
                receiptCount++;
            }

            return {
                id: bill.id,
                bill_number: bill.bill_number,
                bill_type: bill.bill_type,
                total_amount: bill.total_amount,
                status: bill.status,
                issue_date: bill.issue_date,
                booking_reference: bill.bookings?.booking_reference || 'N/A',
                booking_id: bill.booking_id,
                payments: bill.payments || [],
            };
        });

        // Calculate net balance
        // Positive balance = school has overpaid (credit)
        // Negative balance = school owes money (debt)
        const netBalance = totalReceipts - totalTaxInvoices;

        return {
            schoolId: school.id,
            schoolName: school.name,
            totalTaxInvoices,
            totalReceipts,
            netBalance,
            taxInvoiceCount,
            receiptCount,
            bills: formattedBills,
        };
    } catch (error) {
        console.error('Error calculating school balance:', error);
        return null;
    }
};

/**
 * Get balances for multiple schools (for list view)
 */
export const calculateMultipleSchoolBalances = async (schoolIds: string[]): Promise<Map<string, number>> => {
    const balanceMap = new Map<string, number>();

    try {
        // Fetch all bills for all schools at once
        const { data: bills, error: billsError } = await supabase
            .from('bills')
            .select(`
                id,
                bill_type,
                total_amount,
                booking_id,
                bookings!bills_booking_id_fkey(
                    school_id
                ),
                payments(
                    amount
                )
            `)
            .in('bookings.school_id', schoolIds);

        if (billsError) {
            console.error('Error fetching bills for multiple schools:', billsError);
            return balanceMap;
        }

        // Group bills by school and calculate balances
        const schoolBillsMap = new Map<string, any[]>();
        
        (bills || []).forEach((bill: any) => {
            const schoolId = bill.bookings?.school_id;
            if (schoolId) {
                if (!schoolBillsMap.has(schoolId)) {
                    schoolBillsMap.set(schoolId, []);
                }
                schoolBillsMap.get(schoolId)!.push(bill);
            }
        });

        // Calculate balance for each school
        schoolBillsMap.forEach((schoolBills, schoolId) => {
            let totalTaxInvoices = 0;
            let totalReceipts = 0;

            schoolBills.forEach((bill: any) => {
                if (bill.bill_type === 'tax_invoice') {
                    totalTaxInvoices += bill.total_amount || 0;
                } else if (bill.bill_type === 'receipt') {
                    const receiptTotal = (bill.payments || []).reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0);
                    totalReceipts += receiptTotal;
                }
            });

            const netBalance = totalReceipts - totalTaxInvoices;
            balanceMap.set(schoolId, netBalance);
        });

        // Set 0 balance for schools with no bills
        schoolIds.forEach(schoolId => {
            if (!balanceMap.has(schoolId)) {
                balanceMap.set(schoolId, 0);
            }
        });

        return balanceMap;
    } catch (error) {
        console.error('Error calculating multiple school balances:', error);
        return balanceMap;
    }
};
