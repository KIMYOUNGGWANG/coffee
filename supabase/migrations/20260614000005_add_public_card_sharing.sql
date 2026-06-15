-- 20260614000005_add_public_card_sharing.sql
-- Adds opt-in, privacy-safe public card sharing for Hyangmi story links.

ALTER TABLE public.tasting_cards
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.tasting_cards
    ADD COLUMN IF NOT EXISTS public_share_token UUID NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS idx_tasting_cards_public_share_token
    ON public.tasting_cards(public_share_token);

CREATE INDEX IF NOT EXISTS idx_tasting_cards_public_cards
    ON public.tasting_cards(public_share_token)
    WHERE is_public = true;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'tasting_cards'
          AND policyname = 'Public users can view published tasting cards'
    ) THEN
        EXECUTE 'CREATE POLICY "Public users can view published tasting cards" ON public.tasting_cards FOR SELECT USING (is_public = true)';
    END IF;
END $$;
