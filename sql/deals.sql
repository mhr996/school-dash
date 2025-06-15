-- Create deals table
CREATE TABLE IF NOT EXISTS deals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deal_type VARCHAR(50) NOT NULL CHECK (deal_type IN ('new_used_sale', 'exchange', 'intermediary', 'company_commission')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
    notes TEXT,
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    completion_date TIMESTAMP WITH TIME ZONE,
    expected_completion_date TIMESTAMP WITH TIME ZONE,
    deal_data JSONB DEFAULT '{}'::jsonb
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

-- Enable Row Level Security (RLS)
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to manage deals
CREATE POLICY "Enable all operations for authenticated users" ON deals
    FOR ALL USING (auth.role() = 'authenticated');

-- Optional: Create sample deals for testing
-- INSERT INTO deals (deal_type, title, description, amount, status, customer_name) VALUES
-- ('new_used_sale', 'بيع BMW X5 2023', 'بيع سيارة BMW X5 موديل 2023 للعميل أحمد محمد', 45000.00, 'active', 'أحمد محمد'),
-- ('exchange', 'تبديل Toyota Camry', 'تبديل سيارة تويوتا كامري قديمة بسيارة جديدة', 35000.00, 'completed', 'سارة أحمد'),
-- ('intermediary', 'وساطة صفقة Mercedes', 'وساطة في بيع سيارة مرسيدس بين طرفين', 5000.00, 'active', 'محمد علي'),
-- ('company_commission', 'عمولة من تويوتا', 'عمولة مستلمة من شركة تويوتا على مبيعات الشهر', 12000.00, 'completed', NULL);
