-- 20260614000004_add_subscription_state_to_profiles.sql
-- Persist Stripe subscription lifecycle state on Hyangmi profiles

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='stripe_customer_id') THEN
        ALTER TABLE public.profiles ADD COLUMN stripe_customer_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='stripe_subscription_id') THEN
        ALTER TABLE public.profiles ADD COLUMN stripe_subscription_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='subscription_status') THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_status TEXT NOT NULL DEFAULT 'inactive'
            CHECK (subscription_status IN (
                'inactive',
                'incomplete',
                'incomplete_expired',
                'trialing',
                'active',
                'past_due',
                'canceled',
                'unpaid',
                'paused'
            ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='subscription_current_period_end') THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_current_period_end TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='subscription_cancel_at_period_end') THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_cancel_at_period_end BOOLEAN NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='subscription_last_invoice_id') THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_last_invoice_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='subscription_last_invoice_status') THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_last_invoice_status TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='subscription_updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_updated_at TIMESTAMPTZ;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id ON public.profiles(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);
