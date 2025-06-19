-- Create bills table for the car CRM system
-- This table stores all billing information including invoices and receipts
-- linked to deals (WITHOUT redundant JSON field)

CREATE TABLE IF NOT EXISTS bills (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key to deals table
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    
    -- Bill type: 'tax_invoice', 'receipt_only', 'tax_invoice_receipt'
    bill_type VARCHAR(50) NOT NULL CHECK (bill_type IN ('tax_invoice', 'receipt_only', 'tax_invoice_receipt')),
    
    -- Bill status: 'pending', 'paid', 'overdue'
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    
    -- Common customer information
    customer_name VARCHAR(255) NOT NULL,
    identity_number VARCHAR(100),
    phone VARCHAR(50),
    date DATE DEFAULT CURRENT_DATE,
    car_details TEXT,
    
    -- Financial information
    sale_price DECIMAL(10,2),
    commission DECIMAL(10,2),
    free_text TEXT,
    total DECIMAL(10,2),
    tax_amount DECIMAL(10,2),
    total_with_tax DECIMAL(10,2),
    
    -- Payment type for receipts
    payment_type VARCHAR(50) CHECK (payment_type IS NULL OR payment_type IN ('visa', 'bank_transfer', 'transfer', 'check')),
    
    -- Visa payment fields
    visa_amount DECIMAL(10,2),
    visa_installments INTEGER,
    visa_card_type VARCHAR(100),
    visa_last_four VARCHAR(4),
    
    -- Bank transfer fields
    bank_amount DECIMAL(10,2),
    bank_name VARCHAR(255),
    bank_branch VARCHAR(255),
    account_number VARCHAR(100),
    
    -- Transfer fields
    transfer_number VARCHAR(100),
    transfer_holder_name VARCHAR(255),
    transfer_amount DECIMAL(10,2),
    transfer_bank_name VARCHAR(255),
    transfer_branch VARCHAR(255),
    transfer_account_number VARCHAR(100),
    transfer_branch_number VARCHAR(100),
    
    -- Check fields
    check_amount DECIMAL(10,2),
    check_bank_name VARCHAR(255),
    check_branch_number VARCHAR(100),
    check_account_number VARCHAR(100),
    check_number VARCHAR(100),
    check_holder_name VARCHAR(255),
    check_branch VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bills_deal_id ON bills(deal_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_bill_type ON bills(bill_type);
CREATE INDEX IF NOT EXISTS idx_bills_customer_name ON bills(customer_name);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills(created_at DESC);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_bills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS trigger_update_bills_updated_at ON bills;
CREATE TRIGGER trigger_update_bills_updated_at
    BEFORE UPDATE ON bills
    FOR EACH ROW
    EXECUTE FUNCTION update_bills_updated_at();

-- Add comments to describe the table and columns
COMMENT ON TABLE bills IS 'Bills and receipts linked to deals in the car CRM system - normalized structure';
COMMENT ON COLUMN bills.id IS 'Unique identifier for the bill';
COMMENT ON COLUMN bills.deal_id IS 'Reference to the associated deal';
COMMENT ON COLUMN bills.bill_type IS 'Type of bill: tax_invoice, receipt_only, or tax_invoice_receipt';
COMMENT ON COLUMN bills.status IS 'Payment status: pending, paid, or overdue';
COMMENT ON COLUMN bills.customer_name IS 'Name of the customer for the bill';
COMMENT ON COLUMN bills.identity_number IS 'Customer identity/passport number';
COMMENT ON COLUMN bills.phone IS 'Customer phone number';
COMMENT ON COLUMN bills.date IS 'Bill date';
COMMENT ON COLUMN bills.car_details IS 'Details about the car in the bill';
COMMENT ON COLUMN bills.sale_price IS 'Sale price of the car';
COMMENT ON COLUMN bills.commission IS 'Commission amount';
COMMENT ON COLUMN bills.free_text IS 'Additional notes or description';
COMMENT ON COLUMN bills.total IS 'Total before tax';
COMMENT ON COLUMN bills.tax_amount IS 'Tax amount (usually 18%)';
COMMENT ON COLUMN bills.total_with_tax IS 'Final total including tax';
COMMENT ON COLUMN bills.payment_type IS 'Payment method: visa, bank_transfer, transfer, or check';
COMMENT ON COLUMN bills.created_at IS 'Timestamp when the bill was created';
COMMENT ON COLUMN bills.updated_at IS 'Timestamp when the bill was last updated';

-- Enable Row Level Security (RLS) - Uncomment if needed
-- ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - Uncomment and modify as needed for your authentication setup
-- CREATE POLICY "Users can view all bills" ON bills FOR SELECT USING (true);
-- CREATE POLICY "Users can insert bills" ON bills FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Users can update bills" ON bills FOR UPDATE USING (true);
-- CREATE POLICY "Users can delete bills" ON bills FOR DELETE USING (true);

-- Grant permissions - Uncomment if needed
-- GRANT ALL ON bills TO authenticated;
-- GRANT ALL ON bills TO service_role;
