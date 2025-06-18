-- Create deals table with comprehensive structure for all deal types
CREATE TABLE IF NOT EXISTS deals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Basic deal information (required for all deal types)
    deal_type VARCHAR(50) NOT NULL CHECK (deal_type IN ('new_used_sale', 'exchange', 'intermediary', 'company_commission')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(12,2) DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'pending')),
    notes TEXT,
    
    -- Customer and car references (optional - not all deal types need both)
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255), -- Denormalized for quick access
    car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
    
    -- Commission and financial details (optional)
    commission_rate DECIMAL(5,2),
    selling_price DECIMAL(12,2),
    profit_amount DECIMAL(12,2),
    
    -- Date fields (optional)
    completion_date TIMESTAMP WITH TIME ZONE,
    expected_completion_date TIMESTAMP WITH TIME ZONE,
    
    -- Company commission specific fields (optional)
    company_name VARCHAR(255),
    commission_date DATE,
    commission_description TEXT,
    
    -- Exchange deal specific fields (optional)
    old_car_manufacturer VARCHAR(100),
    old_car_name VARCHAR(255),
    old_car_year INTEGER,
    old_car_kilometers DECIMAL(10,2),
    old_car_condition VARCHAR(100),
    old_car_market_price DECIMAL(12,2),
    old_car_purchase_price DECIMAL(12,2),
    
    -- Intermediary deal specific fields (optional)
    seller_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    buyer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    seller_name VARCHAR(255),
    buyer_name VARCHAR(255),
    seller_commission DECIMAL(12,2),
    buyer_commission DECIMAL(12,2),
    
    -- Billing and payment information (optional)
    billing_type VARCHAR(50) CHECK (billing_type IN ('tax_invoice', 'tax_invoice_with_receipt', 'receipt_only')),
    payment_type VARCHAR(50) CHECK (payment_type IN ('cash', 'visa', 'bank_transfer', 'check', 'installments')),
    payment_details JSONB DEFAULT '{}'::jsonb,
    
    -- Flexible data storage for additional deal-specific information
    deal_data JSONB DEFAULT '{}'::jsonb,
    
    -- File attachments metadata
    attachments JSONB DEFAULT '[]'::jsonb
);

-- Create updated_at trigger for deals table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_deals_updated_at 
    BEFORE UPDATE ON deals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deals_deal_type ON deals(deal_type);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_customer_id ON deals(customer_id);
CREATE INDEX IF NOT EXISTS idx_deals_car_id ON deals(car_id);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at);
CREATE INDEX IF NOT EXISTS idx_deals_title ON deals(title);
CREATE INDEX IF NOT EXISTS idx_deals_completion_date ON deals(completion_date);
CREATE INDEX IF NOT EXISTS idx_deals_commission_date ON deals(commission_date);
CREATE INDEX IF NOT EXISTS idx_deals_company_name ON deals(company_name);
CREATE INDEX IF NOT EXISTS idx_deals_seller_id ON deals(seller_id);
CREATE INDEX IF NOT EXISTS idx_deals_buyer_id ON deals(buyer_id);
CREATE INDEX IF NOT EXISTS idx_deals_amount ON deals(amount);
CREATE INDEX IF NOT EXISTS idx_deals_selling_price ON deals(selling_price);

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_deals_deal_data ON deals USING GIN (deal_data);
CREATE INDEX IF NOT EXISTS idx_deals_payment_details ON deals USING GIN (payment_details);
CREATE INDEX IF NOT EXISTS idx_deals_attachments ON deals USING GIN (attachments);

-- Enable Row Level Security (RLS)
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to manage deals
CREATE POLICY "Enable all operations for authenticated users" ON deals
    FOR ALL USING (auth.role() = 'authenticated');

-- Optional: Create sample deals for testing
-- 
-- New/Used Sale Deal Example:
-- INSERT INTO deals (
--     deal_type, title, description, amount, status, customer_name, 
--     selling_price, profit_amount, billing_type, payment_type
-- ) VALUES (
--     'new_used_sale', 
--     'بيع BMW X5 2023', 
--     'بيع سيارة BMW X5 موديل 2023 للعميل أحمد محمد', 
--     45000.00, 
--     'active', 
--     'أحمد محمد',
--     45000.00,
--     5000.00,
--     'tax_invoice',
--     'visa'
-- );
--
-- Exchange Deal Example:
-- INSERT INTO deals (
--     deal_type, title, description, amount, status, customer_name,
--     old_car_manufacturer, old_car_name, old_car_year, old_car_kilometers,
--     old_car_condition, old_car_market_price, old_car_purchase_price
-- ) VALUES (
--     'exchange', 
--     'تبديل Toyota Camry', 
--     'تبديل سيارة تويوتا كامري قديمة بسيارة جديدة', 
--     35000.00, 
--     'completed', 
--     'سارة أحمد',
--     'Toyota',
--     'Camry',
--     2018,
--     75000,
--     'يد ثانية',
--     20000.00,
--     18000.00
-- );
--
-- Intermediary Deal Example:
-- INSERT INTO deals (
--     deal_type, title, description, amount, status,
--     seller_name, buyer_name, seller_commission, buyer_commission
-- ) VALUES (
--     'intermediary', 
--     'وساطة صفقة Mercedes', 
--     'وساطة في بيع سيارة مرسيدس بين طرفين', 
--     5000.00, 
--     'active',
--     'محمد علي',
--     'فاطمة سالم',
--     2500.00,
--     2500.00
-- );
--
-- Company Commission Deal Example:
-- INSERT INTO deals (
--     deal_type, title, description, amount, status,
--     company_name, commission_date, commission_description
-- ) VALUES (
--     'company_commission', 
--     'عمولة من تويوتا', 
--     'عمولة مستلمة من شركة تويوتا على مبيعات الشهر', 
--     12000.00, 
--     'completed',
--     'شركة تويوتا الخليج',
--     '2024-01-15',
--     'عمولة شهرية على مبيعات يناير 2024'
-- );
