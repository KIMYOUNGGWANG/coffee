ALTER TABLE public.brewing_logs
    ADD COLUMN IF NOT EXISTS coach_source TEXT,
    ADD COLUMN IF NOT EXISTS coach_feedback TEXT,
    ADD COLUMN IF NOT EXISTS coach_iteration INTEGER,
    ADD COLUMN IF NOT EXISTS coach_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'brewing_logs_coach_source_check'
          AND conrelid = 'public.brewing_logs'::regclass
    ) THEN
        ALTER TABLE public.brewing_logs
            ADD CONSTRAINT brewing_logs_coach_source_check
            CHECK (coach_source IS NULL OR coach_source IN ('dial_in_coach', 'ai_barista', 'manual'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'brewing_logs_coach_feedback_check'
          AND conrelid = 'public.brewing_logs'::regclass
    ) THEN
        ALTER TABLE public.brewing_logs
            ADD CONSTRAINT brewing_logs_coach_feedback_check
            CHECK (coach_feedback IS NULL OR coach_feedback IN ('too_sour', 'too_bitter', 'too_weak', 'too_heavy', 'balanced'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'brewing_logs_coach_iteration_check'
          AND conrelid = 'public.brewing_logs'::regclass
    ) THEN
        ALTER TABLE public.brewing_logs
            ADD CONSTRAINT brewing_logs_coach_iteration_check
            CHECK (coach_iteration IS NULL OR coach_iteration BETWEEN 1 AND 12);
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_brewing_logs_user_coach_source
    ON public.brewing_logs (user_id, coach_source, brewed_at DESC);
