-- 20260614000001_add_credits_to_profiles.sql
-- Migration to create the profiles foundation and add monetization fields

-- 1. Create profiles for fresh schemas before later migrations alter it
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    credits INTEGER NOT NULL DEFAULT 1 CHECK (credits >= 0),
    has_pdf_access BOOLEAN NOT NULL DEFAULT false,
    is_premium BOOLEAN NOT NULL DEFAULT false,
    scans_used INTEGER NOT NULL DEFAULT 0 CHECK (scans_used >= 0),
    monthly_scan_limit INTEGER NOT NULL DEFAULT 5 CHECK (monthly_scan_limit >= 0),
    last_scan_reset TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add required columns when an older starter profile table already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='credits') THEN
        ALTER TABLE public.profiles ADD COLUMN credits INTEGER NOT NULL DEFAULT 1 CHECK (credits >= 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='has_pdf_access') THEN
        ALTER TABLE public.profiles ADD COLUMN has_pdf_access BOOLEAN NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='is_premium') THEN
        ALTER TABLE public.profiles ADD COLUMN is_premium BOOLEAN NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='scans_used') THEN
        ALTER TABLE public.profiles ADD COLUMN scans_used INTEGER NOT NULL DEFAULT 0 CHECK (scans_used >= 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='monthly_scan_limit') THEN
        ALTER TABLE public.profiles ADD COLUMN monthly_scan_limit INTEGER NOT NULL DEFAULT 5 CHECK (monthly_scan_limit >= 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='last_scan_reset') THEN
        ALTER TABLE public.profiles ADD COLUMN last_scan_reset TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='created_at') THEN
        ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;
END $$;

-- 3. Protect profiles with RLS and let users read only their own profile
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'profiles'
          AND policyname = 'Users can view their own profile'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id)';
    END IF;
END $$;

-- 4. Bootstrap profile rows for new and existing auth users
CREATE OR REPLACE FUNCTION public.bootstrap_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        credits,
        has_pdf_access,
        is_premium,
        scans_used,
        monthly_scan_limit,
        last_scan_reset
    )
    VALUES (
        NEW.id,
        NEW.email,
        1,
        false,
        false,
        0,
        5,
        now()
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'on_auth_user_created_profile'
          AND tgrelid = 'auth.users'::regclass
    ) THEN
        EXECUTE 'CREATE TRIGGER on_auth_user_created_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.bootstrap_profile_for_user()';
    END IF;
END $$;

INSERT INTO public.profiles (id, email)
SELECT id, email
FROM auth.users
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_profiles_updated_at'
          AND tgrelid = 'public.profiles'::regclass
    ) THEN
        CREATE TRIGGER update_profiles_updated_at
            BEFORE UPDATE ON public.profiles
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- 5. Create RPC Function to decrement credit atomically
-- This ensures thread-safety and transactional integrity on credit spends
CREATE OR REPLACE FUNCTION decrement_user_credit(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_credits INTEGER;
BEGIN
    -- Select the user's credits with row locking (FOR UPDATE) to prevent race conditions
    SELECT credits INTO current_credits
    FROM public.profiles
    WHERE id = target_user_id
    FOR UPDATE;

    IF current_credits IS NULL THEN
        RETURN FALSE;
    END IF;

    IF current_credits > 0 THEN
        UPDATE public.profiles
        SET credits = credits - 1
        WHERE id = target_user_id;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
