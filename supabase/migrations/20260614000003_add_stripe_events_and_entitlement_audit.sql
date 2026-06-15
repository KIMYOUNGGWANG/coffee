-- 20260614000003_add_stripe_events_and_entitlement_audit.sql
-- Migration to add Stripe webhook idempotency and entitlement audit foundations

-- 1. Stripe event ledger for webhook dedupe and fulfillment metadata
CREATE TABLE IF NOT EXISTS public.stripe_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_created_at TIMESTAMPTZ,
    livemode BOOLEAN NOT NULL DEFAULT false,
    api_version TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    stripe_customer_id TEXT,
    stripe_session_id TEXT,
    stripe_payment_intent_id TEXT,
    stripe_subscription_id TEXT,
    stripe_subscription_item_id TEXT,
    stripe_invoice_id TEXT,
    item_type TEXT,
    amount_total INTEGER,
    currency TEXT,
    processing_status TEXT NOT NULL DEFAULT 'received'
        CHECK (processing_status IN ('received', 'processing', 'processed', 'ignored', 'failed')),
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    checkout_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT stripe_events_event_id_key UNIQUE (event_id)
);

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_stripe_events_customer_id ON public.stripe_events(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_session_id ON public.stripe_events(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_subscription_id ON public.stripe_events(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_user_id ON public.stripe_events(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_processing_status ON public.stripe_events(processing_status);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_stripe_events_updated_at'
          AND tgrelid = 'public.stripe_events'::regclass
    ) THEN
        CREATE TRIGGER update_stripe_events_updated_at
            BEFORE UPDATE ON public.stripe_events
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- 2. Append-only entitlement audit trail for paid state and credit changes
CREATE TABLE IF NOT EXISTS public.entitlement_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entitlement_kind TEXT NOT NULL
        CHECK (entitlement_kind IN ('credits', 'pdf_access', 'premium', 'subscription', 'scan_limit')),
    entitlement_change TEXT NOT NULL
        CHECK (entitlement_change IN ('grant', 'revoke', 'increment', 'decrement', 'consume', 'reset', 'sync')),
    source TEXT NOT NULL
        CHECK (source IN ('stripe', 'profile_bootstrap', 'scan', 'subscription', 'system', 'admin')),
    stripe_event_id TEXT REFERENCES public.stripe_events(event_id) ON DELETE SET NULL,
    stripe_session_id TEXT,
    stripe_payment_intent_id TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    previous_value JSONB,
    new_value JSONB,
    delta INTEGER,
    event_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.entitlement_audit ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'entitlement_audit'
          AND policyname = 'Users can view their own entitlement audit'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view their own entitlement audit" ON public.entitlement_audit FOR SELECT USING (auth.uid() = user_id)';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_entitlement_audit_user_id ON public.entitlement_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_entitlement_audit_stripe_event_id ON public.entitlement_audit(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_entitlement_audit_kind ON public.entitlement_audit(entitlement_kind);
CREATE INDEX IF NOT EXISTS idx_entitlement_audit_occurred_at ON public.entitlement_audit(occurred_at DESC);
