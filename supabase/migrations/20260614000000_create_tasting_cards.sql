-- 20260614000000_create_tasting_cards.sql
-- Migration to create the tasting_cards table for Hyangmi

-- Enable uuid-ossp extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create tasting_cards table
CREATE TABLE IF NOT EXISTS tasting_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('coffee', 'beer', 'whiskey', 'wine')),
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    image_url TEXT,
    badges TEXT[] NOT NULL DEFAULT '{}',
    metric1 INTEGER NOT NULL CHECK (metric1 BETWEEN 1 AND 5),
    metric2 INTEGER NOT NULL CHECK (metric2 BETWEEN 1 AND 5),
    metric3 INTEGER NOT NULL CHECK (metric3 BETWEEN 1 AND 5),
    tags TEXT[] NOT NULL DEFAULT '{}',
    ai_description TEXT NOT NULL,
    footer_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE tasting_cards ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can insert their own cards" ON tasting_cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own cards" ON tasting_cards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards" ON tasting_cards
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cards" ON tasting_cards
    FOR DELETE USING (auth.uid() = user_id);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_tasting_cards_user_id ON tasting_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_tasting_cards_created_at ON tasting_cards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasting_cards_category ON tasting_cards(category);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasting_cards_updated_at
    BEFORE UPDATE ON tasting_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
