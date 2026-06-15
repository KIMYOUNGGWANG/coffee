-- 20260614000002_add_brewing_notes_and_scan_limits.sql
-- Migration to introduce 1:N brewing notes and monthly AI scan limit controls

-- 1. Add subscription and scan tracking columns to profiles table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_premium') THEN
        ALTER TABLE profiles ADD COLUMN is_premium BOOLEAN NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='scans_used') THEN
        ALTER TABLE profiles ADD COLUMN scans_used INTEGER NOT NULL DEFAULT 0 CHECK (scans_used >= 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='monthly_scan_limit') THEN
        ALTER TABLE profiles ADD COLUMN monthly_scan_limit INTEGER NOT NULL DEFAULT 5 CHECK (monthly_scan_limit >= 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_scan_reset') THEN
        ALTER TABLE profiles ADD COLUMN last_scan_reset TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;
END $$;

-- 2. Create brewing_notes table for 1:N relationship (Tasting Card has multiple brewing logs)
CREATE TABLE IF NOT EXISTS brewing_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tasting_card_id UUID NOT NULL REFERENCES tasting_cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    method TEXT NOT NULL,
    bean_amount NUMERIC NOT NULL,
    water_amount NUMERIC NOT NULL,
    grind_size TEXT,
    water_temp NUMERIC,
    brew_time INTEGER, -- in seconds
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    memo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on brewing_notes
ALTER TABLE brewing_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for brewing_notes
CREATE POLICY "Users can insert their own brewing notes" ON brewing_notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own brewing notes" ON brewing_notes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own brewing notes" ON brewing_notes
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brewing notes" ON brewing_notes
    FOR DELETE USING (auth.uid() = user_id);

-- Create performance indexes for relational fetching
CREATE INDEX IF NOT EXISTS idx_brewing_notes_card_id ON brewing_notes(tasting_card_id);
CREATE INDEX IF NOT EXISTS idx_brewing_notes_user_id ON brewing_notes(user_id);

-- 3. Create RPC Function to atomically consume scan allowance or one credit
CREATE OR REPLACE FUNCTION increment_user_scan(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    current_is_premium BOOLEAN;
    current_scans_used INTEGER;
    current_limit INTEGER;
    current_reset TIMESTAMPTZ;
    current_credits INTEGER;
BEGIN
    -- Select parameters with row locking
    SELECT is_premium, scans_used, monthly_scan_limit, last_scan_reset, credits
    INTO current_is_premium, current_scans_used, current_limit, current_reset, current_credits
    FROM public.profiles
    WHERE id = target_user_id
    FOR UPDATE;

    -- Fallback if profile row doesn't exist
    IF current_is_premium IS NULL THEN
        -- Insert profile row with default settings
        INSERT INTO public.profiles (id, is_premium, scans_used, monthly_scan_limit, last_scan_reset, credits, has_pdf_access)
        VALUES (target_user_id, false, 0, 5, now(), 1, false);
        current_is_premium := false;
        current_scans_used := 0;
        current_limit := 5;
        current_reset := now();
        current_credits := 1;
    END IF;

    -- Monthly reset logic check: if reset is older than 30 days, reset scans_used
    IF current_reset < now() - INTERVAL '30 days' THEN
        UPDATE public.profiles
        SET scans_used = 0, last_scan_reset = now()
        WHERE id = target_user_id;
        current_scans_used := 0;
    END IF;

    -- Premium tier bypasses limits and credit spend while still recording scan usage.
    IF current_is_premium = true THEN
        UPDATE public.profiles
        SET scans_used = scans_used + 1
        WHERE id = target_user_id;
        RETURN jsonb_build_object(
            'allowed', true,
            'source', 'premium',
            'credits_spent', 0,
            'credits_remaining', current_credits,
            'scans_used', current_scans_used + 1,
            'monthly_scan_limit', current_limit
        );
    END IF;

    -- Free tier consumes monthly allowance first.
    IF current_scans_used < current_limit THEN
        UPDATE public.profiles
        SET scans_used = scans_used + 1
        WHERE id = target_user_id;
        RETURN jsonb_build_object(
            'allowed', true,
            'source', 'monthly_allowance',
            'credits_spent', 0,
            'credits_remaining', current_credits,
            'scans_used', current_scans_used + 1,
            'monthly_scan_limit', current_limit
        );
    END IF;

    -- After monthly allowance is exhausted, exactly one credit buys one scan.
    IF current_credits > 0 THEN
        UPDATE public.profiles
        SET credits = credits - 1,
            scans_used = scans_used + 1
        WHERE id = target_user_id;
        RETURN jsonb_build_object(
            'allowed', true,
            'source', 'credit',
            'credits_spent', 1,
            'credits_remaining', current_credits - 1,
            'scans_used', current_scans_used + 1,
            'monthly_scan_limit', current_limit
        );
    END IF;

    RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'no_credits',
        'source', 'none',
        'credits_spent', 0,
        'credits_remaining', 0,
        'scans_used', current_scans_used,
        'monthly_scan_limit', current_limit
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
