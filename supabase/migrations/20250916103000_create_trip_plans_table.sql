-- Create trip_plans table for managing school trip routes and services
CREATE TABLE IF NOT EXISTS trip_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Core info
    school_id TEXT NOT NULL,
    school_name TEXT NOT NULL,
    trip_date DATE,

    -- Destination
    destination_name TEXT,
    destination_address TEXT,
    destination_lat DOUBLE PRECISION,
    destination_lng DOUBLE PRECISION,

    -- Travel
    travel_company_id TEXT,
    travel_company_name TEXT,
    travel_vehicle_type TEXT,
    travel_area TEXT,
    travel_price NUMERIC(12,2) DEFAULT 0,

    -- Paramedics (multiple)
    paramedic_ids TEXT[],
    paramedics_selection JSONB DEFAULT '[]'::jsonb, -- array of {id, name, rate_type, quantity, unit_price, total}
    paramedics_total NUMERIC(12,2) DEFAULT 0,

    -- Guides (multiple)
    guide_ids TEXT[],
    guides_selection JSONB DEFAULT '[]'::jsonb, -- array of {id, name, rate_type, quantity, unit_price, total}
    guides_total NUMERIC(12,2) DEFAULT 0,

    -- Security
    security_company_id TEXT,
    security_company_name TEXT,
    security_price NUMERIC(12,2) DEFAULT 0,

    -- Entertainment (multiple)
    entertainment_ids TEXT[],
    entertainment_selection JSONB DEFAULT '[]'::jsonb, -- array of {id, name, price}
    entertainment_total NUMERIC(12,2) DEFAULT 0,

    -- Totals
    total_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    pricing_breakdown JSONB DEFAULT '{}'::jsonb,

    notes TEXT
);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_trip_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trip_plans_updated_at_trigger
    BEFORE UPDATE ON trip_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_trip_plans_updated_at();

-- RLS policies
ALTER TABLE trip_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trip_plans_select_authenticated" ON trip_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "trip_plans_insert_authenticated" ON trip_plans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "trip_plans_update_authenticated" ON trip_plans FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "trip_plans_delete_authenticated" ON trip_plans FOR DELETE TO authenticated USING (true);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_trip_plans_school_id ON trip_plans(school_id);
CREATE INDEX IF NOT EXISTS idx_trip_plans_trip_date ON trip_plans(trip_date);
CREATE INDEX IF NOT EXISTS idx_trip_plans_created_at ON trip_plans(created_at DESC);
