-- Add confirmed coffee-memory fields without changing the legacy card or owner-RLS contract.

ALTER TABLE public.tasting_cards
    ADD COLUMN IF NOT EXISTS package_origin TEXT,
    ADD COLUMN IF NOT EXISTS package_process TEXT,
    ADD COLUMN IF NOT EXISTS repurchase_intent TEXT NOT NULL DEFAULT 'undecided',
    ADD COLUMN IF NOT EXISTS repurchase_reasons TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    ADD COLUMN IF NOT EXISTS scan_source TEXT,
    ADD COLUMN IF NOT EXISTS scan_confidence DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS corrected_fields TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'tasting_cards_repurchase_intent_check'
          AND conrelid = 'public.tasting_cards'::regclass
    ) THEN
        ALTER TABLE public.tasting_cards
            ADD CONSTRAINT tasting_cards_repurchase_intent_check
            CHECK (repurchase_intent IN ('again', 'maybe', 'no', 'undecided'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'tasting_cards_scan_source_check'
          AND conrelid = 'public.tasting_cards'::regclass
    ) THEN
        ALTER TABLE public.tasting_cards
            ADD CONSTRAINT tasting_cards_scan_source_check
            CHECK (scan_source IS NULL OR scan_source IN ('gemini', 'manual'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'tasting_cards_scan_confidence_check'
          AND conrelid = 'public.tasting_cards'::regclass
    ) THEN
        ALTER TABLE public.tasting_cards
            ADD CONSTRAINT tasting_cards_scan_confidence_check
            CHECK (scan_confidence IS NULL OR scan_confidence BETWEEN 0 AND 1);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'tasting_cards_corrected_fields_check'
          AND conrelid = 'public.tasting_cards'::regclass
    ) THEN
        ALTER TABLE public.tasting_cards
            ADD CONSTRAINT tasting_cards_corrected_fields_check
            CHECK (
                corrected_fields <@ ARRAY[
                    'title',
                    'subtitle',
                    'package_origin',
                    'package_process',
                    'tags'
                ]::TEXT[]
            );
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_tasting_cards_user_repurchase_intent
    ON public.tasting_cards (user_id, repurchase_intent);

CREATE INDEX IF NOT EXISTS idx_tasting_cards_user_confirmed_at
    ON public.tasting_cards (user_id, confirmed_at DESC);
