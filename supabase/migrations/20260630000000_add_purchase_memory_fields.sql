ALTER TABLE public.tasting_cards
    ADD COLUMN IF NOT EXISTS purchase_url TEXT,
    ADD COLUMN IF NOT EXISTS purchase_note TEXT;

ALTER TABLE public.coffee_shelf_items
    ADD COLUMN IF NOT EXISTS purchase_url TEXT,
    ADD COLUMN IF NOT EXISTS purchase_note TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'tasting_cards_purchase_url_length_check'
          AND conrelid = 'public.tasting_cards'::regclass
    ) THEN
        ALTER TABLE public.tasting_cards
            ADD CONSTRAINT tasting_cards_purchase_url_length_check
            CHECK (purchase_url IS NULL OR char_length(purchase_url) <= 500);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'tasting_cards_purchase_note_length_check'
          AND conrelid = 'public.tasting_cards'::regclass
    ) THEN
        ALTER TABLE public.tasting_cards
            ADD CONSTRAINT tasting_cards_purchase_note_length_check
            CHECK (purchase_note IS NULL OR char_length(purchase_note) <= 160);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'coffee_shelf_items_purchase_url_length_check'
          AND conrelid = 'public.coffee_shelf_items'::regclass
    ) THEN
        ALTER TABLE public.coffee_shelf_items
            ADD CONSTRAINT coffee_shelf_items_purchase_url_length_check
            CHECK (purchase_url IS NULL OR char_length(purchase_url) <= 500);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'coffee_shelf_items_purchase_note_length_check'
          AND conrelid = 'public.coffee_shelf_items'::regclass
    ) THEN
        ALTER TABLE public.coffee_shelf_items
            ADD CONSTRAINT coffee_shelf_items_purchase_note_length_check
            CHECK (purchase_note IS NULL OR char_length(purchase_note) <= 160);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tasting_cards_user_purchase_url
    ON public.tasting_cards (user_id)
    WHERE purchase_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_coffee_shelf_items_user_purchase_url
    ON public.coffee_shelf_items (user_id)
    WHERE purchase_url IS NOT NULL;
