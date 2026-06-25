-- Add new flavor metrics to tasting_cards
ALTER TABLE tasting_cards
ADD COLUMN metric4 INTEGER NOT NULL DEFAULT 3 CHECK (metric4 BETWEEN 1 AND 5),
ADD COLUMN metric5 INTEGER NOT NULL DEFAULT 3 CHECK (metric5 BETWEEN 1 AND 5),
ADD COLUMN metric6 INTEGER NOT NULL DEFAULT 3 CHECK (metric6 BETWEEN 1 AND 5);

-- Update the schema cache so PostgREST recognizes the new columns immediately
NOTIFY pgrst, 'reload schema';
