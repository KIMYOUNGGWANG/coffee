-- 20260617000000_create_coffee_shelf_and_logs.sql
-- Migration to create coffee_shelf_items and brewing_logs tables for the Coffee Shelf system.

-- Create coffee_shelf_items table
CREATE TABLE IF NOT EXISTS coffee_shelf_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    roaster_name TEXT NOT NULL,
    bean_name TEXT NOT NULL,
    origin TEXT,
    roast_date DATE,
    opened_date DATE,
    total_weight INTEGER NOT NULL DEFAULT 200, -- Default bag size in grams
    fill_level INTEGER NOT NULL DEFAULT 100 CHECK (fill_level BETWEEN 0 AND 100),
    is_finished BOOLEAN NOT NULL DEFAULT FALSE,
    tasting_card_id UUID REFERENCES tasting_cards(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS) for coffee_shelf_items
ALTER TABLE coffee_shelf_items ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for coffee_shelf_items
CREATE POLICY "Users can insert their own shelf items" ON coffee_shelf_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own shelf items" ON coffee_shelf_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own shelf items" ON coffee_shelf_items
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shelf items" ON coffee_shelf_items
    FOR DELETE USING (auth.uid() = user_id);

-- Create performance indexes for coffee_shelf_items
CREATE INDEX IF NOT EXISTS idx_coffee_shelf_items_user_id ON coffee_shelf_items(user_id);
CREATE INDEX IF NOT EXISTS idx_coffee_shelf_items_is_finished ON coffee_shelf_items(is_finished);

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER update_coffee_shelf_items_updated_at
    BEFORE UPDATE ON coffee_shelf_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- Create brewing_logs table
CREATE TABLE IF NOT EXISTS brewing_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shelf_item_id UUID REFERENCES coffee_shelf_items(id) ON DELETE SET NULL,
    brewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    method TEXT NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb, -- Includes grind_size, water_temp, water_amount, coffee_amount, time etc.
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    simple_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS) for brewing_logs
ALTER TABLE brewing_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for brewing_logs
CREATE POLICY "Users can insert their own brewing logs" ON brewing_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own brewing logs" ON brewing_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own brewing logs" ON brewing_logs
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brewing logs" ON brewing_logs
    FOR DELETE USING (auth.uid() = user_id);

-- Create performance indexes for brewing_logs
CREATE INDEX IF NOT EXISTS idx_brewing_logs_user_id ON brewing_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_brewing_logs_brewed_at ON brewing_logs(brewed_at DESC);

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER update_brewing_logs_updated_at
    BEFORE UPDATE ON brewing_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
